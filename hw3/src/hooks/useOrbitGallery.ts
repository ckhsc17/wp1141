'use client';

import { useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface PurchaseRecord {
  id: number;
  date: string;
  items: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>;
  total: number;
}

export const useOrbitGallery = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  
  const [isLoading, setIsLoading] = useState(false);
  const [nearbyAntique, setNearbyAntique] = useState<{name: string, position: THREE.Vector3} | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());

  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;

  // Get purchased items from localStorage
  const getPurchasedItems = useCallback((): string[] => {
    try {
      const purchases = localStorage.getItem('antiquePurchases');
      if (!purchases) return [];
      
      const purchaseRecords: PurchaseRecord[] = JSON.parse(purchases);
      const purchasedItems = new Set<string>();
      
      purchaseRecords.forEach(record => {
        record.items.forEach(item => {
          const filename = item.name.toLowerCase().replace(/\s+/g, '_');
          purchasedItems.add(filename);
        });
      });
      
      return Array.from(purchasedItems);
    } catch (error) {
      console.error('Error reading purchased items:', error);
      return [];
    }
  }, []);

  // Check if camera is near any display case with antiques
  const checkNearbyDisplayCase = useCallback((cameraPosition: THREE.Vector3) => {
    const displayCasePositions = [
      { x: -4, z: -4 },
      { x: 0, z: -4 },
      { x: 4, z: -4 },
      { x: -4, z: 0 },
      { x: 4, z: 0 },
      { x: -4, z: 4 },
      { x: 0, z: 4 },
      { x: 4, z: 4 },
    ];
    
    const purchasedItems = getPurchasedItems();
    const detectionDistance = 2.5;
    
    let closestAntique: {name: string, position: THREE.Vector3} | null = null;
    let closestDistance = Infinity;
    
    for (let i = 0; i < purchasedItems.length && i < 8; i++) {
      const displayPos = displayCasePositions[i];
      const distance = Math.sqrt(
        Math.pow(cameraPosition.x - displayPos.x, 2) +
        Math.pow(cameraPosition.z - displayPos.z, 2)
      );
      
      if (distance < detectionDistance && distance < closestDistance) {
        closestDistance = distance;
        closestAntique = {
          name: purchasedItems[i],
          position: new THREE.Vector3(displayPos.x, 1.4, displayPos.z)
        };
      }
    }
    
    setNearbyAntique(closestAntique);
  }, [getPurchasedItems]);

  // Normalize and place antique model in a wrapper group
  const normalizeAndPlace = useCallback((antiqueModel: THREE.Object3D, displayPos: THREE.Vector3, displayCaseHeight: number) => {
    const box = new THREE.Box3().setFromObject(antiqueModel);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 建立一個包裝 Group
    const wrapper = new THREE.Group();

    // 先把模型平移，讓中心對齊 (0,0,0)
    antiqueModel.position.sub(center);

    // 放進 wrapper
    wrapper.add(antiqueModel);

    // 縮放 wrapper (不動模型內部 pivot)
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 1;
    const scale = targetSize / maxDim;
    wrapper.scale.setScalar(scale);

    wrapper.updateMatrixWorld(true);

    // 重新計算
    const newBox = new THREE.Box3().setFromObject(wrapper);
    const newSize = newBox.getSize(new THREE.Vector3());

    // 設定 wrapper 的最終位置（居中在展示櫃上）
    wrapper.position.set(
      displayPos.x,
      displayCaseHeight + newSize.y / 2,
      displayPos.z
    );

    return wrapper;
  }, []);

  // Initialize OrbitControls
  const initializeControls = useCallback((camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    // Dispose existing controls
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }

    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.1;
    orbitControls.target.set(0, 1, 0);
    orbitControls.minDistance = 2;
    orbitControls.maxDistance = 15;
    orbitControls.maxPolarAngle = Math.PI * 0.7;
    orbitControls.minPolarAngle = Math.PI * 0.1;
    
    // 設置相機在地面高度附近，稍微後退一點
    camera.position.set(0, 3, 3);
    orbitControls.target.set(0, 1, 0);
    orbitControls.update();
    
    // 添加 WASD 移動控制
    const orbitKeyDown = (event: KeyboardEvent) => {
      keysPressed.current.add(event.code);
    };

    const orbitKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code);
    };

    document.addEventListener('keydown', orbitKeyDown);
    document.addEventListener('keyup', orbitKeyUp);

    // 存儲清理函數
    (orbitControls as any).cleanup = () => {
      document.removeEventListener('keydown', orbitKeyDown);
      document.removeEventListener('keyup', orbitKeyUp);
    };
    
    controlsRef.current = orbitControls;
  }, []);

  // Load 3D models
  const loadModels = useCallback(async () => {
    if (!sceneRef.current || !CDN_URL) return;

    setIsLoading(true);
    const loader = new GLTFLoader();
    const scene = sceneRef.current;

    try {
      // Load gallery background
      const galleryGltf = await new Promise<any>((resolve, reject) => {
        loader.load(
          `${CDN_URL}/vr_gallery.glb`,
          resolve,
          undefined,
          reject
        );
      });
      
      const galleryModel = galleryGltf.scene;
      galleryModel.position.set(0, 0, 0);
      scene.add(galleryModel);

      // Load display cases
      const displayCasePositions = [
        { x: -4, z: -4 },
        { x: 0, z: -4 },
        { x: 4, z: -4 },
        { x: -4, z: 0 },
        { x: 4, z: 0 },
        { x: -4, z: 4 },
        { x: 0, z: 4 },
        { x: 4, z: 4 },
      ];

      const purchasedItems = getPurchasedItems();

      for (let i = 0; i < 8; i++) {
        // Load display case
        const displayCaseGltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            `${CDN_URL}/display_case.glb`,
            resolve,
            undefined,
            reject
          );
        });

        const displayCase = displayCaseGltf.scene.clone();
        displayCase.position.set(
          displayCasePositions[i].x,
          0.7,
          displayCasePositions[i].z
        );
        scene.add(displayCase);

        // Load antique if available
        if (i < purchasedItems.length) {
          try {
            console.log('Loading antique model:', purchasedItems[i]);
            const antiqueGltf = await new Promise<any>((resolve, reject) => {
              loader.load(
                `${CDN_URL}/${purchasedItems[i]}.glb`,
                resolve,
                undefined,
                reject
              );
            });
            
            const antiqueModel = antiqueGltf.scene;
            
            // Use the normalize and place function
            const displayPos = new THREE.Vector3(displayCasePositions[i].x, 0, displayCasePositions[i].z);
            const displayCaseHeight = 1.4;
            const normalizedWrapper = normalizeAndPlace(antiqueModel, displayPos, displayCaseHeight);
            
            // Add floating animation to the wrapper
            const originalY = normalizedWrapper.position.y;
            normalizedWrapper.userData = {
              originalY: originalY,
              floatOffset: Math.random() * Math.PI * 2,
              floatSpeed: 0.5 + Math.random() * 0.5,
              floatAmplitude: 0.05 + Math.random() * 0.03,
              rotationSpeed: 0.5 + Math.random() * 0.4,
              rotationAxis: new THREE.Vector3(0, 1, 0)
            };
            
            scene.add(normalizedWrapper);
          } catch (error) {
            console.warn(`Failed to load antique model: ${purchasedItems[i]}.glb`, error);
          }
        }
      }

    } catch (error) {
      console.error('Failed to load gallery models:', error);
    } finally {
      setIsLoading(false);
    }
  }, [CDN_URL, getPurchasedItems, normalizeAndPlace]);

  // Initialize Three.js scene
  const initThreeJS = useCallback(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.7, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Initialize controls
    initializeControls(camera, renderer);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      const deltaTime = clockRef.current.getDelta();
      const elapsedTime = clockRef.current.getElapsedTime();
      
      // Handle WASD movement for Orbit controls
      if (controlsRef.current && camera) {
        const moveSpeed = 5;
        const controls = controlsRef.current;
        
        // 使用世界座標系的方向
        const movement = new THREE.Vector3();
        
        if (keysPressed.current.has('KeyW')) {
          movement.z -= 1;
        }
        if (keysPressed.current.has('KeyS')) {
          movement.z += 1;
        }
        if (keysPressed.current.has('KeyA')) {
          movement.x -= 1;
        }
        if (keysPressed.current.has('KeyD')) {
          movement.x += 1;
        }
        
        if (movement.length() > 0) {
          movement.normalize().multiplyScalar(moveSpeed * deltaTime);
          
          // 計算新的 target 位置
          const newTarget = controls.target.clone().add(movement);
          const bounds = 6;
          
          // 限制移動範圍在展示櫃區域內
          if (Math.abs(newTarget.x) <= bounds && Math.abs(newTarget.z) <= bounds) {
            // 移動 target 和相機
            const cameraOffset = camera.position.clone().sub(controls.target);
            controls.target.copy(newTarget);
            controls.target.y = 1.0;
            
            // 相機跟隨移動，但保持相對位置
            camera.position.copy(controls.target).add(cameraOffset);
            camera.position.y = Math.max(1.2, camera.position.y);
            
            controls.update();
          }
        }
        
        // 檢測是否靠近展示櫃
        checkNearbyDisplayCase(controls.target);
      }
      
      // Update floating animation for antiques
      if (scene) {
        scene.traverse((child) => {
          if (child.userData.originalY !== undefined) {
            const { originalY, floatOffset, floatSpeed, floatAmplitude, rotationSpeed, rotationAxis } = child.userData;
            
            // Update floating animation
            child.position.y = originalY + Math.sin(elapsedTime * floatSpeed + floatOffset) * floatAmplitude;
            
            // Update rotation animation
            if (rotationSpeed && rotationAxis) {
              child.rotateOnAxis(rotationAxis, rotationSpeed * deltaTime);
            }
          }
        });
      }
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
    };
  }, [initializeControls, checkNearbyDisplayCase]);

  return {
    mountRef,
    isLoading,
    nearbyAntique,
    setNearbyAntique,
    initThreeJS,
    loadModels,
    controlsRef
  };
};