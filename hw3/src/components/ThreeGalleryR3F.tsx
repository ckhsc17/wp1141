'use client';

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  useGLTF, 
  Html, 
  Environment,
  Grid,
  KeyboardControls,
  useKeyboardControls
} from '@react-three/drei';
import * as THREE from 'three';

interface ThreeGalleryR3FProps {
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

// 展示櫃位置
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

// 鍵盤控制映射
const keyMap = [
  { name: 'forward', keys: ['KeyW'] },
  { name: 'backward', keys: ['KeyS'] },
  { name: 'leftward', keys: ['KeyA'] },
  { name: 'rightward', keys: ['KeyD'] },
];

// 古董模型組件
function AntiqueModel({ 
  filename, 
  position, 
  onNear 
}: { 
  filename: string; 
  position: [number, number, number]; 
  onNear: (name: string, pos: THREE.Vector3) => void;
}) {
  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(`${CDN_URL}/${filename}.glb`);
  
  // 標準化模型
  const normalizedScene = React.useMemo(() => {
    const clonedScene = scene.clone();
    
    // 計算包圍盒
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // 移動到中心
    clonedScene.position.sub(center);
    
    // 縮放
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 1;
    const scale = targetSize / maxDim;
    clonedScene.scale.setScalar(scale);
    
    return clonedScene;
  }, [scene]);
  
  // 浮動和旋轉動畫
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(time * 1.5 + position[0]) * 0.05;
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={normalizedScene} />
    </group>
  );
}

// 展示櫃組件
function DisplayCase({ position }: { position: [number, number, number] }) {
  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;
  const { scene } = useGLTF(`${CDN_URL}/display_case.glb`);
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position}
      scale={1}
    />
  );
}

// 主場景組件
function Scene({ onAntiqueNear }: { onAntiqueNear: (name: string | null, pos?: THREE.Vector3) => void }) {
  const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;
  const { scene: galleryScene } = useGLTF(`${CDN_URL}/vr_gallery.glb`);
  const { camera } = useThree();
  
  // 獲取購買的古董
  const getPurchasedItems = (): string[] => {
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
  };

  const purchasedItems = getPurchasedItems();

  // 檢測靠近展示櫃
  useFrame(() => {
    const cameraPos = camera.position;
    let nearestAntique: string | null = null;
    let nearestPos: THREE.Vector3 | undefined;
    let minDistance = Infinity;

    for (let i = 0; i < purchasedItems.length && i < 8; i++) {
      const displayPos = displayCasePositions[i];
      const distance = Math.sqrt(
        Math.pow(cameraPos.x - displayPos.x, 2) +
        Math.pow(cameraPos.z - displayPos.z, 2)
      );

      if (distance < 2.5 && distance < minDistance) {
        minDistance = distance;
        nearestAntique = purchasedItems[i];
        nearestPos = new THREE.Vector3(displayPos.x, 1.4, displayPos.z);
      }
    }

    onAntiqueNear(nearestAntique, nearestPos);
  });

  return (
    <>
      {/* 環境光照 */}
      <Environment preset="warehouse" />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      
      {/* 展覽館背景 */}
      <primitive object={galleryScene} />
      
      {/* 展示櫃 */}
      {displayCasePositions.map((pos, index) => (
        <DisplayCase 
          key={index} 
          position={[pos.x, 0.7, pos.z]} 
        />
      ))}
      
      {/* 古董模型 */}
      {purchasedItems.slice(0, 8).map((item, index) => (
        <AntiqueModel
          key={item}
          filename={item}
          position={[
            displayCasePositions[index].x,
            1.9, // 展示櫃表面高度
            displayCasePositions[index].z
          ]}
          onNear={(name, pos) => {}}
        />
      ))}
      
      {/* 地面網格（可選） */}
      <Grid 
        args={[20, 20]} 
        position={[0, 0, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#888888"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
    </>
  );
}

// 自定義控制組件
function CustomControls() {
  const { camera } = useThree();
  const [, get] = useKeyboardControls();
  
  useFrame((state, delta) => {
    const { forward, backward, leftward, rightward } = get();
    const speed = 5;
    
    const movement = new THREE.Vector3();
    
    if (forward) movement.z -= 1;
    if (backward) movement.z += 1;
    if (leftward) movement.x -= 1;
    if (rightward) movement.x += 1;
    
    if (movement.length() > 0) {
      movement.normalize().multiplyScalar(speed * delta);
      
      // 限制移動範圍
      const newPosition = camera.position.clone().add(movement);
      const bounds = 6;
      
      if (Math.abs(newPosition.x) <= bounds && Math.abs(newPosition.z) <= bounds) {
        camera.position.add(movement);
        camera.position.y = Math.max(1.7, camera.position.y); // 保持最低高度
      }
    }
  });
  
  return null;
}

// 載入中組件
function LoadingScreen() {
  return (
    <Html center>
      <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-lg">Loading 3D Gallery...</span>
      </div>
    </Html>
  );
}

const ThreeGalleryR3F: React.FC<ThreeGalleryR3FProps> = ({ isOpen, onClose }) => {
  const [nearbyAntique, setNearbyAntique] = useState<{name: string, position: THREE.Vector3} | null>(null);
  const [controlType, setControlType] = useState<'orbit' | 'custom'>('orbit');

  const handleAntiqueNear = (name: string | null, pos?: THREE.Vector3) => {
    if (name && pos) {
      setNearbyAntique({ name, position: pos });
    } else {
      setNearbyAntique(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* 控制按鈕 */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={onClose}
          className="bg-white hover:bg-gray-100 text-black p-3 rounded-full shadow-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <button
          onClick={() => setControlType(controlType === 'orbit' ? 'custom' : 'orbit')}
          className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
            controlType === 'orbit'
              ? 'bg-blue-600 text-white'
              : 'bg-green-600 text-white'
          }`}
        >
          {controlType === 'orbit' ? 'Orbit Mode' : 'Free Walk'}
        </button>
      </div>

      {/* 說明 */}
      <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 rounded-lg p-4 max-w-xs">
        <h3 className="font-bold mb-2">Controls:</h3>
        <ul className="text-sm space-y-1">
          {controlType === 'orbit' ? (
            <>
              <li>• Drag to rotate view</li>
              <li>• Scroll to zoom</li>
              <li>• WASD to move camera</li>
            </>
          ) : (
            <>
              <li>• WASD to walk around</li>
              <li>• Mouse to look around</li>
              <li>• Walk near cases for info</li>
            </>
          )}
        </ul>
      </div>

      {/* 古董資訊彈窗 */}
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

      {/* R3F Canvas */}
      <KeyboardControls map={keyMap}>
        <Canvas
          camera={{
            position: [0, 3, 3],
            fov: 75,
            near: 0.1,
            far: 1000
          }}
          shadows
          className="w-full h-full"
        >
          <Suspense fallback={<LoadingScreen />}>
            <Scene onAntiqueNear={handleAntiqueNear} />
            
            {controlType === 'orbit' ? (
              <OrbitControls
                target={[0, 1, 0]}
                minDistance={2}
                maxDistance={15}
                maxPolarAngle={Math.PI * 0.7}
                minPolarAngle={Math.PI * 0.1}
                enableDamping
                dampingFactor={0.1}
              />
            ) : (
              <CustomControls />
            )}
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};

export default ThreeGalleryR3F;