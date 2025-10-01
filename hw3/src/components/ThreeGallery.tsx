'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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
  const [isLoading, setIsLoading] = useState(false);

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

    // Camera
    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    camera.zoom = 1.5;
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

    // Controls (basic mouse controls)
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;
      
      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;
      
      camera.position.x += deltaX * 0.01;
      camera.position.y -= deltaY * 0.01;
      
      camera.lookAt(0, 0, 0);
      
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (event: WheelEvent) => {
      const scale = event.deltaY > 0 ? 1.1 : 0.9;
      camera.position.multiplyScalar(scale);
      camera.lookAt(0, 0, 0);
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
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
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
    };
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
        if (rendererRef.current && mountRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
          rendererRef.current.dispose();
        }
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg">Loading 3D Gallery...</span>
          </div>
        </div>
      )}

      {/* Instructions
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 rounded-lg p-4 max-w-xs">
        <h3 className="font-bold mb-2">Controls:</h3>
        <ul className="text-sm space-y-1">
          <li>• Drag to rotate camera</li>
          <li>• Scroll to zoom in/out</li>
          <li>• Your purchased items are displayed on cases</li>
        </ul>
      </div> */}

      {/* Three.js mount point */}
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
};

export default ThreeGallery;