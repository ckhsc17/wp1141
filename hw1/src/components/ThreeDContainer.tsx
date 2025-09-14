'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, Stars, Sphere, Plane, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useThreeD } from '@/contexts/ThreeDContext';
import { personalInfo, experiences, projects, skills, milestones, socialLinks } from '@/data/mockData';

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

// GLTF 星球組件
const GLTFPlanet: React.FC<{
  modelPath: string;
  position: [number, number, number];
  scale?: number;
  onClick: () => void;
  isActive: boolean;
  title: string;
  content: string;
  color: string;
}> = ({ modelPath, position, scale = 1, onClick, isActive, title, content, color }) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // 載入 GLTF 模型
  const { scene } = useGLTF(modelPath);
  
  // 複製場景以避免多次使用同一模型的問題
  const clonedScene = scene.clone();

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group 
      ref={groupRef}
      position={position}
      scale={[scale, scale, scale]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* GLTF 模型 */}
      <primitive object={clonedScene} />
      
      {/* 星球光環 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[scale * 1.2, scale * 1.4, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isActive ? 0.4 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 星球標籤 */}
      <Html
        position={[0, scale + 0.8, 0]}
        center
        distanceFactor={12}
        occlude
      >
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-3 text-white text-center pointer-events-none border border-white/20">
          <div className="font-bold text-base">{title}</div>
          <div className="text-sm text-gray-300 mt-1">{content}</div>
        </div>
      </Html>
      
      {/* 粒子效果 */}
      {(hovered || isActive) && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={100}
              array={new Float32Array(300).map(() => (Math.random() - 0.5) * scale * 4)}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.03}
            color={color}
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}
    </group>
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
  textureUrl?: string;
}> = ({ position, color, size, title, content, onClick, isActive, textureUrl }) => {
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
        {textureUrl ? (
          <meshStandardMaterial
            map={new THREE.TextureLoader().load(textureUrl)}
            transparent
            opacity={0.9}
            emissive={hovered || isActive ? color : '#000000'}
            emissiveIntensity={hovered || isActive ? 0.1 : 0}
          />
        ) : (
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.8}
            emissive={hovered || isActive ? color : '#000000'}
            emissiveIntensity={hovered || isActive ? 0.2 : 0}
            roughness={0.3}
            metalness={0.1}
          />
        )}
      </Sphere>
      
      {/* 星球光環 - 更精緻的效果 */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 1.2, size * 1.4, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isActive ? 0.4 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* 星球標籤 */}
      <Html
        position={[0, size + 0.8, 0]}
        center
        distanceFactor={12}
        occlude
      >
        <div className="bg-black/90 backdrop-blur-sm rounded-lg p-3 text-white text-center pointer-events-none border border-white/20">
          <div className="font-bold text-base">{title}</div>
          <div className="text-sm text-gray-300 mt-1">{content}</div>
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
            size={0.03}
            color={color}
            transparent
            opacity={0.8}
            sizeAttenuation
          />
        </points>
      )}
    </group>
  );
};

// 弧形地表（只在點擊星球時顯示）
const CurvedGround: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <group position={[0, -10, 0]}>
      {/* 主要地表球體 - 調整弧度 */}
      <Sphere args={[15, 64, 32, 0, Math.PI * 2, 0, Math.PI / 3]}>
        <meshStandardMaterial
          color="#2a2a3e"
          transparent
          opacity={0.4}
          wireframe={false}
        />
      </Sphere>
      
      {/* 地表線框 */}
      <Sphere args={[15.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 3]}>
        <meshBasicMaterial
          color="#4a90e2"
          transparent
          opacity={0.3}
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
const CameraController: React.FC<{ currentSection: string; isLanded: boolean }> = ({ currentSection, isLanded }) => {
  const { camera } = useThree();
  
  useEffect(() => {
    if (isLanded) {
      // 著陸視角 - 更接近地面
      camera.position.lerp(new THREE.Vector3(0, 2, 5), 0.05);
      camera.lookAt(0, 0, 0);
    } else {
      // 宇宙航行視角
      const positions: Record<string, [number, number, number]> = {
        about: [0, 0, 15],
        experience: [10, 3, 12],
        projects: [-10, 3, 12],
        skills: [0, 8, 15],
        milestones: [8, -3, 12],
        traveling: [-8, -3, 12],
        connect: [0, -8, 15],
      };

      const targetPosition = positions[currentSection] || [0, 0, 15];
      camera.position.lerp(new THREE.Vector3(...targetPosition), 0.05);
      camera.lookAt(0, 0, 0);
    }
  }, [currentSection, isLanded, camera]);

  return null;
};

// 主要3D場景
const ThreeDScene: React.FC<{ currentSection: string }> = ({ currentSection }) => {
  const { setCurrentSection } = useThreeD();
  const [isLanded, setIsLanded] = useState(false);

  // 根據 mockData 定義星球
  const sections = [
    { 
      id: 'about', 
      title: '關於我', 
      content: personalInfo.title, 
      position: [0, 0, 0] as [number, number, number], 
      color: '#4a90e2', 
      size: 1.5,
      useGLTF: true,
      modelPath: '/models/earth/scene.gltf' // 修正的 GLTF 模型路徑
    },
    { 
      id: 'experience', 
      title: '工作經驗', 
      content: `${experiences.length} 項經驗`, 
      position: [8, 4, 0] as [number, number, number], 
      color: '#f39c12', 
      size: 1.2,
      useGLTF: false,
      textureUrl: '/images/textures/mars.jpg' // 預留圖片位置
    },
    { 
      id: 'projects', 
      title: '專案作品', 
      content: `${projects.length} 項專案`, 
      position: [-8, 4, 0] as [number, number, number], 
      color: '#e74c3c', 
      size: 1.3,
      useGLTF: false,
      textureUrl: '/images/textures/jupiter.jpg' // 預留圖片位置
    },
    { 
      id: 'skills', 
      title: '技能專長', 
      content: `${skills.length} 項技能`, 
      position: [0, 8, 0] as [number, number, number], 
      color: '#2ecc71', 
      size: 1.0,
      useGLTF: false,
      textureUrl: '/images/textures/venus.jpg' // 預留圖片位置
    },
    { 
      id: 'milestones', 
      title: '重要里程碑', 
      content: `${milestones.length} 個里程碑`, 
      position: [6, -4, 0] as [number, number, number], 
      color: '#9b59b6', 
      size: 0.9,
      useGLTF: false,
      textureUrl: '/images/textures/saturn.jpg' // 預留圖片位置
    },
    { 
      id: 'traveling', 
      title: '旅行足跡', 
      content: '世界地圖', 
      position: [-6, -4, 0] as [number, number, number], 
      color: '#1abc9c', 
      size: 0.9,
      useGLTF: false,
      textureUrl: '/images/textures/neptune.jpg' // 預留圖片位置
    },
    { 
      id: 'connect', 
      title: '聯絡方式', 
      content: `${socialLinks.length} 個平台`, 
      position: [0, -8, 0] as [number, number, number], 
      color: '#34495e', 
      size: 0.8,
      useGLTF: false,
      textureUrl: '/images/textures/mercury.jpg' // 預留圖片位置
    }
  ];

  const handlePlanetClick = (sectionId: string) => {
    setCurrentSection(sectionId);
    setIsLanded(true);
    // 3秒後回到宇宙視角
    setTimeout(() => setIsLanded(false), 3000);
  };

  // 地表上的旗子 - 根據不同 section 顯示不同內容
  const getFlagsForSection = (sectionId: string) => {
    switch (sectionId) {
      case 'experience':
        return experiences.slice(0, 4).map((exp, index) => ({
          position: [index * 2 - 3, 0, 8] as [number, number, number],
          color: '#f39c12',
          title: exp.company,
          icon: '🏢'
        }));
      case 'projects':
        return projects.map((project, index) => ({
          position: [index * 3 - 1.5, 0, 8] as [number, number, number],
          color: '#e74c3c',
          title: project.title,
          icon: '🚀'
        }));
      case 'skills':
        return skills.slice(0, 6).map((skill, index) => ({
          position: [(index % 3) * 2 - 2, 0, 6 + Math.floor(index / 3) * 2] as [number, number, number],
          color: '#2ecc71',
          title: skill.name,
          icon: '⚡'
        }));
      default:
        return [
          { position: [2, 0, 8] as [number, number, number], color: '#4a90e2', title: '技術能力', icon: '⚡' },
          { position: [-2, 0, 8] as [number, number, number], color: '#e74c3c', title: '專案經驗', icon: '🚀' },
          { position: [4, 0, 6] as [number, number, number], color: '#2ecc71', title: '學習成果', icon: '📚' },
          { position: [-4, 0, 6] as [number, number, number], color: '#f39c12', title: '創新思維', icon: '💡' },
          { position: [0, 0, 9] as [number, number, number], color: '#9b59b6', title: '團隊合作', icon: '🤝' },
          { position: [3, 0, 4] as [number, number, number], color: '#1abc9c', title: '問題解決', icon: '🔧' },
        ];
    }
  };

  const flags = isLanded ? getFlagsForSection(currentSection) : [];

  return (
    <>
      {/* 深藍色星空背景 */}
      <color attach="background" args={['#0a0e1a']} />
      
      {/* 星空環境 */}
      <Stars radius={150} depth={80} count={8000} factor={6} saturation={0} fade speed={0.5} />
      
      {/* 光照設置 */}
      <ambientLight intensity={0.3} />
      <pointLight position={[20, 20, 20]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-20, -20, -20]} intensity={0.8} color="#4a90e2" />
      <directionalLight position={[0, 50, 0]} intensity={0.5} color="#ffffff" />
      
      {/* 宇宙粒子 */}
      <SpaceParticles />
      
      {/* 軌道控制器 - 允許拖拽旋轉 */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        maxDistance={50}
        minDistance={5}
        autoRotate={!isLanded}
        autoRotateSpeed={0.5}
      />
      
      {/* 相機控制 */}
      <CameraController currentSection={currentSection} isLanded={isLanded} />
      
      {/* 弧形地表 - 只在著陸時顯示 */}
      <CurvedGround visible={isLanded} />
      
      {/* 星球（代表各個section） */}
      {sections.map((section) => (
        section.useGLTF ? (
          <GLTFPlanet
            key={section.id}
            modelPath={section.modelPath!}
            position={section.position}
            scale={section.size}
            onClick={() => handlePlanetClick(section.id)}
            isActive={currentSection === section.id}
            title={section.title}
            content={section.content}
            color={section.color}
          />
        ) : (
          <Planet
            key={section.id}
            position={section.position}
            color={section.color}
            size={section.size}
            title={section.title}
            content={section.content}
            onClick={() => handlePlanetClick(section.id)}
            isActive={currentSection === section.id}
            textureUrl={section.textureUrl}
          />
        )
      ))}
      
      {/* 地表上的旗子 - 只在著陸時顯示 */}
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
          position: [0, 0, 15], 
          fov: 60,
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
      
      {/* 3D 控制提示 */}
      <div className="absolute bottom-4 left-4 text-white/70 text-sm">
        <div>🖱️ 拖拽旋轉視角</div>
        <div>🪐 點擊星球探索</div>
        <div>🔍 滾輪縮放</div>
      </div>
    </div>
  );
};

export default ThreeDContainer;
