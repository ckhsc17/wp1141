'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

interface ThreeGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

type ControlType = 'FirstPerson' | 'Orbit' | 'PointerLock';

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
  const controlsRef = useRef<FirstPersonControls | OrbitControls | PointerLockControls | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const [isLoading, setIsLoading] = useState(false);
  const [currentControl, setCurrentControl] = useState<ControlType>('FirstPerson');

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
    // Position camera inside the gallery room
    camera.position.set(0, 2, 2);
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
      
      if (controlsRef.current) {
        if (controlsRef.current instanceof FirstPersonControls) {
          controlsRef.current.update(deltaTime);
        } else if (controlsRef.current instanceof OrbitControls) {
          controlsRef.current.update();
        }
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

  // Initialize controls based on current control type
  const initializeControls = (camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    // Dispose existing controls
    if (controlsRef.current) {
      controlsRef.current.dispose();
    }

    switch (currentControl) {
      case 'FirstPerson':
        const fpControls = new FirstPersonControls(camera, renderer.domElement);
        fpControls.movementSpeed = 5;
        fpControls.lookSpeed = 0.1;
        fpControls.constrainVertical = true;
        fpControls.verticalMin = 1.0;
        fpControls.verticalMax = 2.0;
        controlsRef.current = fpControls;
        break;

      case 'Orbit':
        const orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.05;
        orbitControls.target.set(0, 1, 0);
        orbitControls.minDistance = 1;
        orbitControls.maxDistance = 20;
        orbitControls.maxPolarAngle = Math.PI * 0.8;
        controlsRef.current = orbitControls;
        break;

      case 'PointerLock':
        const plControls = new PointerLockControls(camera, renderer.domElement);
        
        // Add click to lock pointer
        const instructions = document.createElement('div');
        instructions.style.position = 'absolute';
        instructions.style.top = '50%';
        instructions.style.left = '50%';
        instructions.style.transform = 'translate(-50%, -50%)';
        instructions.style.color = 'white';
        instructions.style.fontFamily = 'Arial';
        instructions.style.fontSize = '16px';
        instructions.style.textAlign = 'center';
        instructions.style.pointerEvents = 'none';
        instructions.innerHTML = 'Click to look around<br/>WASD to move';
        
        if (mountRef.current) {
          mountRef.current.appendChild(instructions);
        }

        renderer.domElement.addEventListener('click', () => {
          plControls.lock();
        });

        plControls.addEventListener('lock', () => {
          if (instructions.parentNode) {
            instructions.parentNode.removeChild(instructions);
          }
        });

        plControls.addEventListener('unlock', () => {
          if (mountRef.current && !mountRef.current.contains(instructions)) {
            mountRef.current.appendChild(instructions);
          }
        });

        // Add WASD movement for PointerLock
        const moveForward = new THREE.Vector3();
        const moveRight = new THREE.Vector3();
        const velocity = new THREE.Vector3();
        const direction = new THREE.Vector3();

        const onKeyDown = (event: KeyboardEvent) => {
          switch (event.code) {
            case 'KeyW':
              moveForward.z = -1;
              break;
            case 'KeyS':
              moveForward.z = 1;
              break;
            case 'KeyA':
              moveRight.x = -1;
              break;
            case 'KeyD':
              moveRight.x = 1;
              break;
          }
        };

        const onKeyUp = (event: KeyboardEvent) => {
          switch (event.code) {
            case 'KeyW':
            case 'KeyS':
              moveForward.z = 0;
              break;
            case 'KeyA':
            case 'KeyD':
              moveRight.x = 0;
              break;
          }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // Store cleanup functions
        (plControls as any).cleanup = () => {
          document.removeEventListener('keydown', onKeyDown);
          document.removeEventListener('keyup', onKeyUp);
          if (instructions.parentNode) {
            instructions.parentNode.removeChild(instructions);
          }
        };

        controlsRef.current = plControls;
        break;
    }
  };

  // Switch control type
  const switchControlType = (newType: ControlType) => {
    if (currentControl === newType) return;
    
    setCurrentControl(newType);
    
    if (cameraRef.current && rendererRef.current) {
      // Reset camera position when switching controls
      cameraRef.current.position.set(0, 2, 2);
      cameraRef.current.lookAt(0, 1, 0);
      initializeControls(cameraRef.current, rendererRef.current);
    }
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
            const antiqueGltf = await new Promise<any>((resolve, reject) => {
              loader.load(
                `${CDN_URL}/${purchasedItems[i]}.glb`,
                resolve,
                undefined,
                reject
              );
            });

            const antiqueModel = antiqueGltf.scene;
            antiqueModel.position.set(
              displayCasePositions[i].x,
              1.5, // Place on top of display case
              displayCasePositions[i].z
            );
            antiqueModel.scale.setScalar(0.5); // Scale down if needed
            scene.add(antiqueModel);
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

  // Re-initialize controls when control type changes
  useEffect(() => {
    if (isOpen && cameraRef.current && rendererRef.current) {
      initializeControls(cameraRef.current, rendererRef.current);
    }
  }, [currentControl, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Control buttons */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        {/* Close button */}
        <button
          onClick={onClose}
          className="bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Control type buttons */}
        <button
          onClick={() => switchControlType('FirstPerson')}
          className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            currentControl === 'FirstPerson'
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-black'
          }`}
        >
          First Person
        </button>
        
        <button
          onClick={() => switchControlType('Orbit')}
          className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            currentControl === 'Orbit'
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-black'
          }`}
        >
          Orbit
        </button>
        
        <button
          onClick={() => switchControlType('PointerLock')}
          className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            currentControl === 'PointerLock'
              ? 'bg-blue-600 text-white'
              : 'bg-white hover:bg-gray-100 text-black'
          }`}
        >
          Pointer Lock
        </button>
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

      {/* Instructions */}
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 rounded-lg p-4 max-w-xs">
        <h3 className="font-bold mb-2">Controls:</h3>
        <ul className="text-sm space-y-1">
          {currentControl === 'FirstPerson' && (
            <>
              <li>• Move mouse to look around</li>
              <li>• Click and drag to move</li>
              <li>• Your purchased items are displayed on cases</li>
            </>
          )}
          {currentControl === 'Orbit' && (
            <>
              <li>• Drag to rotate camera</li>
              <li>• Scroll to zoom in/out</li>
              <li>• Right-drag to pan</li>
            </>
          )}
          {currentControl === 'PointerLock' && (
            <>
              <li>• Click to lock mouse cursor</li>
              <li>• WASD to move</li>
              <li>• Mouse to look around</li>
            </>
          )}
        </ul>
      </div>

      {/* Three.js mount point */}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

export default ThreeGallery;