'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars, Sky, Sphere, Plane, Points } from '@react-three/drei';
import * as THREE from 'three';
import { useThreeD } from '@/contexts/ThreeDContext';

// 宇宙粒子效果
const SpaceParticles: React.FC = () => {
  const count = 200;
  const mesh = useRef<THREE.InstancedMesh>(null);

  const particles = React.useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
        ],
        speed: Math.random() * 0.005 + 0.001,
      });
    }
    return temp;
  }, []);

  useFrame(() => {
    if (mesh.current) {
      particles.forEach((particle, i) => {
        const matrix = new THREE.Matrix4();
        particle.position[1] += particle.speed;
        if (particle.position[1] > 50) particle.position[1] = -50;
        
        matrix.setPosition(
          particle.position[0],
          particle.position[1],
          particle.position[2]
        );
        mesh.current!.setMatrixAt(i, matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.05]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
    </instancedMesh>
  );
};

// 星球組件
const Planet: React.FC<{
  position: [number, number, number];
  color: string;
  size: number;
  title: string;
  content: string;
  onClick: () => void;
  isActive: boolean;
}> = ({ position, color, size, title, content, onClick, isActive }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[size, 32, 32]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.8}
          emissive={hovered || isActive ? color : '#000000'}
          emissiveIntensity={hovered || isActive ? 0.2 : 0}
        />
      </Sphere>
      
      {/* 星球光環 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.5, size * 1.8, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isActive ? 0.3 : 0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 星球標籤 */}
      <Html
        position={[0, size + 0.5, 0]}
        center
        distanceFactor={15}
        occlude
      >
        <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 text-white text-center pointer-events-none">
          <div className="font-bold text-sm">{title}</div>
          <div className="text-xs text-gray-300 mt-1">{content}</div>
        </div>
      </Html>
      
      {/* 粒子效果 */}
      {(hovered || isActive) && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={100}
              array={new Float32Array(300).map(() => (Math.random() - 0.5) * size * 4)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.02}
            color={color}
            transparent
            opacity={0.6}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
};

// 弧形地表
const CurvedGround: React.FC = () => {
  return (
    <group position={[0, -20, 0]}>
      {/* 主要地表球體 */}
      <Sphere args={[20, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]}>
        <meshStandardMaterial
          color="#1a1a2e"
          transparent
          opacity={0.3}
          wireframe={false}
        />
      </Sphere>
      
      {/* 地表線框 */}
      <Sphere args={[20.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}>
        <meshBasicMaterial
          color="#4a90e2"
          transparent
          opacity={0.2}
          wireframe
        />
      </Sphere>
    </group>
  );
};

// 旗子組件
const Flag: React.FC<{
  position: [number, number, number];
  color: string;
  title: string;
  icon: string;
}> = ({ position, color, title, icon }) => {
  const flagRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (flagRef.current && flagRef.current.children[1]) {
      const flag = flagRef.current.children[1];
      if (flag) {
        flag.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.1;
      }
    }
  });

  return (
    <group
      ref={flagRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* 旗杆 */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
      
      {/* 旗子 */}
      <Plane
        position={[0.2, 0.8, 0]}
        args={[0.4, 0.25]}
        rotation={[0, 0, 0]}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </Plane>
      
      {/* 旗子標籤 */}
      <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={10}
        occlude
      >
        <div className={`
          bg-black/80 backdrop-blur-sm rounded px-2 py-1 text-white text-xs
          transition-all duration-200 pointer-events-none
          ${hovered ? 'scale-110' : 'scale-100'}
        `}>
          {icon} {title}
        </div>
      </Html>
    </group>
  );
};

// 相機控制器
const CameraController: React.FC<{ currentSection: string }> = ({ currentSection }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    const positions: Record<string, [number, number, number]> = {
      about: [0, 0, 10],
      experience: [8, 2, 8],
      projects: [-8, 2, 8],
      skills: [0, 5, 10],
      milestones: [5, -2, 10],
      traveling: [-5, -2, 10],
      connect: [0, -5, 10],
    };

    const targetPosition = positions[currentSection] || [0, 0, 10];
    
    // 平滑移動相機
    const animateCamera = () => {
      camera.position.lerp(new THREE.Vector3(...targetPosition), 0.05);
      camera.lookAt(0, 0, 0);
    };

    const interval = setInterval(animateCamera, 16);
    return () => clearInterval(interval);
  }, [currentSection, camera]);

  return null;
};

// 主要3D場景
const ThreeDScene: React.FC<{ currentSection: string }> = ({ currentSection }) => {
  const { setCurrentSection } = useThreeD();

  const sections = [
    { id: 'about', title: '關於我', content: '個人介紹', position: [0, 0, 0] as [number, number, number], color: '#4a90e2', size: 1.2 },
    { id: 'experience', title: '工作經驗', content: '職業生涯', position: [6, 3, 0] as [number, number, number], color: '#f39c12', size: 1.0 },
    { id: 'projects', title: '專案作品', content: '作品集', position: [-6, 3, 0] as [number, number, number], color: '#e74c3c', size: 1.1 },
    { id: 'skills', title: '技能專長', content: '技術能力', position: [0, 6, 0] as [number, number, number], color: '#2ecc71', size: 0.9 },
    { id: 'milestones', title: '重要里程碑', content: '成就時刻', position: [4, -3, 0] as [number, number, number], color: '#9b59b6', size: 0.8 },
    { id: 'traveling', title: '旅行足跡', content: '世界地圖', position: [-4, -3, 0] as [number, number, number], color: '#1abc9c', size: 0.8 },
    { id: 'connect', title: '聯絡方式', content: '取得聯繫', position: [0, -6, 0] as [number, number, number], color: '#34495e', size: 0.7 }
  ];

  const flags = [
    { position: [2, 0, 8] as [number, number, number], color: '#4a90e2', title: '技術能力', icon: '⚡' },
    { position: [-2, 0, 8] as [number, number, number], color: '#e74c3c', title: '專案經驗', icon: '🚀' },
    { position: [4, 0, 6] as [number, number, number], color: '#2ecc71', title: '學習成果', icon: '📚' },
    { position: [-4, 0, 6] as [number, number, number], color: '#f39c12', title: '創新思維', icon: '💡' },
    { position: [0, 0, 9] as [number, number, number], color: '#9b59b6', title: '團隊合作', icon: '🤝' },
    { position: [3, 0, 4] as [number, number, number], color: '#1abc9c', title: '問題解決', icon: '🔧' },
  ];

  return (
    <>
      {/* 環境設置 */}
      <Sky sunPosition={[100, 20, 100]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* 光照 */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a90e2" />
      
      {/* 宇宙粒子 */}
      <SpaceParticles />
      
      {/* 相機控制 */}
      <CameraController currentSection={currentSection} />
      
      {/* 弧形地表 */}
      <CurvedGround />
      
      {/* 星球（代表各個section） */}
      {sections.map((section) => (
        <Planet
          key={section.id}
          position={section.position}
          color={section.color}
          size={section.size}
          title={section.title}
          content={section.content}
          onClick={() => setCurrentSection(section.id)}
          isActive={currentSection === section.id}
        />
      ))}
      
      {/* 地表上的旗子 */}
      {flags.map((flag, index) => (
        <Flag
          key={index}
          position={flag.position}
          color={flag.color}
          title={flag.title}
          icon={flag.icon}
        />
      ))}
    </>
  );
};

// 主要3D容器組件
const ThreeDContainer: React.FC = () => {
  const { currentSection } = useThreeD();

  return (
    <div className="fixed inset-0 w-full h-full bg-black">
      <Canvas
        camera={{ 
          position: [0, 0, 10], 
          fov: 75,
          near: 0.1,
          far: 1000
        }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
      >
        <ThreeDScene currentSection={currentSection} />
      </Canvas>
    </div>
  );
};

export default ThreeDContainer;
