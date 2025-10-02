'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface ThreeGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

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

const ThreeGallery: React.FC<ThreeGalleryProps> = ({ isOpen, onClose }) => {
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
  const getPurchasedItems = (): string[] => {
    try {
      const purchases = localStorage.getItem('antiquePurchases');
      if (!purchases) return [];
      
      const purchaseRecords: PurchaseRecord[] = JSON.parse(purchases);
      const purchasedItems = new Set<string>();
      
      purchaseRecords.forEach(record => {
        record.items.forEach(item => {
          // Convert name to filename format: lowercase with underscores
          const filename = item.name.toLowerCase().replace(/\s+/g, '_');
          purchasedItems.add(filename);
        });
      });
      
      return Array.from(purchasedItems);
    } catch (error) {
      console.error('Error reading purchased items:', error);
      return [];
    }
  };

  // Initialize Three.js scene
  const initThreeJS = () => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera - position inside the gallery
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Position camera at human eye level on the ground
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
        const moveSpeed = 5; // 移動速度
        const controls = controlsRef.current;
        
        // 使用世界座標系的方向，而不是相機方向
        const movement = new THREE.Vector3();
        
        if (keysPressed.current.has('KeyW')) {
          movement.z -= 5; // 向前（負 Z 方向）
        }
        if (keysPressed.current.has('KeyS')) {
          movement.z += 5; // 向後（正 Z 方向）
        }
        if (keysPressed.current.has('KeyA')) {
          movement.x -= 5; // 向左（負 X 方向）
        }
        if (keysPressed.current.has('KeyD')) {
          movement.x += 5; // 向右（正 X 方向）
        }
        
        if (movement.length() > 0) {
          movement.normalize().multiplyScalar(moveSpeed * deltaTime);
          
          // 計算新的 target 位置
          const newTarget = controls.target.clone().add(movement);
          const bounds = 6; // 展示櫃範圍約 -6 到 6
          
          // 限制移動範圍在展示櫃區域內
          if (Math.abs(newTarget.x) <= bounds && Math.abs(newTarget.z) <= bounds) {
            // 移動 target 和相機
            const cameraOffset = camera.position.clone().sub(controls.target);
            controls.target.copy(newTarget);
            controls.target.y = 1.0; // 保持 target 在合適高度
            
            // 相機跟隨移動，但保持相對位置
            camera.position.copy(controls.target).add(cameraOffset);
            camera.position.y = Math.max(1.2, camera.position.y); // 確保不會太低
            
            controls.update();
          }
        }
        
        // 檢測是否靠近展示櫃（使用 target 位置更準確）
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
  };

  // Initialize OrbitControls
  const initializeControls = (camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
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
    orbitControls.maxPolarAngle = Math.PI * 0.7; // 限制向下看的角度
    orbitControls.minPolarAngle = Math.PI * 0.1; // 限制向上看的角度
    
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
  };

  // Check if camera is near any display case with antiques
  const checkNearbyDisplayCase = (cameraPosition: THREE.Vector3) => {
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
    const detectionDistance = 2.5; // 檢測距離
    
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
  };

  // Normalize and place antique model in a wrapper group
  const normalizeAndPlace = (antiqueModel: THREE.Object3D, displayPos: THREE.Vector3, displayCaseHeight: number) => {
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
  };

  // Load 3D models
  const loadModels = async () => {
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
            console.log('Antique GLTF loaded:', antiqueGltf);
            const antiqueModel = antiqueGltf.scene;
            
            // Use the normalize and place function
            const displayPos = new THREE.Vector3(displayCasePositions[i].x, 0, displayCasePositions[i].z);
            const displayCaseHeight = 1.4;
            const normalizedWrapper = normalizeAndPlace(antiqueModel, displayPos, displayCaseHeight);
            
            // Add floating animation to the wrapper
            const originalY = normalizedWrapper.position.y;
            normalizedWrapper.userData = {
              originalY: originalY,
              floatOffset: Math.random() * Math.PI * 2, // Random phase for each model
              floatSpeed: 0.5 + Math.random() * 0.5, // Random speed between 0.5-1.0
              floatAmplitude: 0.05 + Math.random() * 0.03, // Random amplitude between 0.05-0.08
              rotationSpeed: 0.5 + Math.random() * 0.4, // Random rotation speed between 0.3-0.7
              rotationAxis: new THREE.Vector3(0, 1, 0) // Rotate around Y axis (vertical)
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
  };

  useEffect(() => {
    if (isOpen && mountRef.current) {
      const cleanup = initThreeJS();
      loadModels();

      return () => {
        cleanup?.();
        if (controlsRef.current && (controlsRef.current as any).cleanup) {
          (controlsRef.current as any).cleanup();
        }
        if (rendererRef.current && mountRef.current && mountRef.current.contains(rendererRef.current.domElement)) {
          mountRef.current.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
        }
      };
    }
  }, [isOpen]);

  // Re-initialize controls when gallery opens
  useEffect(() => {
    if (isOpen && cameraRef.current && rendererRef.current) {
      initializeControls(cameraRef.current, rendererRef.current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Control buttons */}
      <div className="absolute top-4 right-4 z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 rounded-lg p-4 max-w-xs">
        <h3 className="font-bold mb-2">控制說明:</h3>
        <ul className="text-sm space-y-1">
          <li>• 拖曳滑鼠旋轉視角</li>
          <li>• 滾輪縮放距離</li>
          <li>• WASD 鍵在地面移動</li>
          <li>• 靠近展示櫃查看古董詳情</li>
        </ul>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg">Loading 3D Gallery...</span>
          </div>
        </div>
      )}


      {/* Antique Info Popup */}
      {nearbyAntique && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white bg-opacity-95 rounded-lg shadow-2xl p-6 max-w-md backdrop-blur-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800">古董資訊</h3>
              <button
                onClick={() => setNearbyAntique(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">名稱:</span>
                <span className="text-sm text-gray-600 capitalize">
                  {nearbyAntique.name.replace(/_/g, ' ')}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">位置:</span>
                <span className="text-sm text-gray-600">
                  展示櫃 ({nearbyAntique.position.x}, {nearbyAntique.position.z})
                </span>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 使用滑鼠拖曳可以更好地觀察這件古董的 3D 模型
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three.js mount point */}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

export default ThreeGallery;