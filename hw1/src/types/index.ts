// ViewModels - 業務邏輯層
export interface PersonalInfo {
  name: string;
  title: string;
  description: string;
  location: string;
  profileImage?: string;
}

export interface Skill {
  name: string;
  level: number;
  category: 'frontend' | 'backend' | 'tools' | 'languages' | 'database' | 'ai' | 'devops';
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  period: string;
  description: string;
  technologies: string[];
  type: 'work' | 'education';
  logo?: string; // 新增 logo 欄位
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  aspectRatio?: 'wide' | 'tall' | 'square'; // 預設長寬比類型
  featured: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'achievement' | 'life' | 'career' | 'education';
  icon?: string; // 新增 icon 欄位
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface TravelDestination {
  id: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  visitDate: string;
  duration: string;
  highlights: string[];
  description: string;
  photos: TravelPhoto[];
}

export interface TravelPhoto {
  id: string;
  url: string;
  thumbnail: string;
  caption: string;
  location?: string;
}
