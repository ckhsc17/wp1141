import { PersonalInfo, Skill, Experience, Project, Milestone, SocialLink, TravelDestination } from '@/types';

// Mock data based on the provided image
export const personalInfo: PersonalInfo = {
  name: "Bowen Chen",
  title: "Backend Engineer",
  description: "description.txt",
  location: "Taipei, Taiwan",
  profileImage: "/images/profile.jpg"
};

export const skills: Skill[] = [
  { name: "TypeScript", level: 95, category: "frontend" },
  { name: "Python", level: 90, category: "languages" },
  { name: "FastAPI", level: 85, category: "backend" },
  { name: "Go", level: 80, category: "languages" },
  { name: "React", level: 95, category: "frontend" },
  { name: "Vue.js", level: 85, category: "frontend" },
  { name: "Next.js", level: 90, category: "frontend" },
  { name: "Kubernetes", level: 85, category: "devops" },
  { name: "Docker", level: 90, category: "devops" },
  { name: "Terraform", level: 80, category: "devops" },
  { name: "AWS", level: 85, category: "tools" },
  { name: "GCP", level: 80, category: "tools" },
  { name: "PostgreSQL", level: 85, category: "database" },
  { name: "Redis", level: 80, category: "database" },
  { name: "Prisma", level: 90, category: "database" },
  { name: "Atlas", level: 75, category: "tools" },
  { name: "Machine Learning", level: 80, category: "ai" }
];

export const experiences: Experience[] = [
  {
    id: "1",
    company: "LINE Taiwan",
    position: "Backend Developer, OAV (Official Account Verification)",
    period: "July 2025 — PRESENT",
    description: "Backend developer using Go, applying clean architecture and running scrum development framework. Setting up Terraform to maintain and track infra resources on private cloud in the team. Applying Kubernetes to GitHub workflow.",
    technologies: ["Go", "Terraform", "Kubernetes", "GitHub Actions", "Clean Architecture", "Scrum"],
    type: "work",
    logo: "/images/companies/line.png"
  },
  {
    id: "2",
    company: "Forward Alliance",
    position: "Fullstack Engineer",
    period: "September 2025 — PRESENT",
    description: "Fullstack engineer using Next.js, applying layered architecture. Deal with service and database query optimization.",
    technologies: ["Next.js", "TypeScript", "Database Optimization", "Layered Architecture"],
    type: "work",
    logo: "/images/companies/fa.png"
  },
  {
    id: "3",
    company: "National Taiwan University",
    position: "Backend Engineer, New Course Selection System",
    period: "June 2025 — PRESENT",
    description: "Backend engineer using TypeScript, applying layered architecture. Deal with Prisma data migration to systematically manage schema changes.",
    technologies: ["TypeScript", "Jenkins", "Prisma", "Database Migration", "Layered Architecture"],
    type: "work",
    logo: "/images/companies/ntu.png"
  },
  {
    id: "4",
    company: "Academia Sinica",
    position: "AI Engineer, Taide_med (Medical QA system)",
    period: "March 2025 — June 2025",
    description: "Applying RAG & RLHF to improve model medical response accuracy, reducing human resource cost.",
    technologies: ["RAG", "RLHF", "Machine Learning", "Medical AI", "Natural Language Processing"],
    type: "work",
    logo: "/images/companies/aca.png"
  }
];

export const projects: Project[] = [
  {
    id: "1",
    title: "DOGTOR APP",
    description: "A comprehensive, customized Flutter education app for proactive learning, launching soon on App Store. Full-stack application using Flutter as frontend and FastAPI as backend, deployed on GCP with Cloud Run & Cloud SQL. Features AI-powered question generation using prompt engineering and model cross-validation, personalized recommendations with RAG customization, and TextCNN for topic classification to optimize token costs.",
    technologies: ["Flutter", "FastAPI", "GCP", "Cloud Run", "Cloud SQL", "AI", "RAG", "TextCNN", "Prompt Engineering"],
    liveUrl: "https://testflight.apple.com/join/4DPcds6h",
    githubUrl: "https://github.com/DOGTOR-LEARNING/dogtor_app",
    imageUrl: "/images/projects/DOGTOR.png",
    featured: true
  },
  {
    id: "2",
    title: "TicketEase",
    description: "A full-stack ticketing system with advanced seat selection and concurrency control. Built with Next.js frontend, FastAPI backend, and Supabase cloud database. Features include user authentication, CI/CD deployment on GCP using Dockerfile and cloudbuild.yaml, optimized SQL schema with indexing for enhanced performance, and sophisticated seat selection concurrency control for improved user experience.",
    technologies: ["Next.js", "FastAPI", "Supabase", "GCP", "CI/CD", "Docker", "SQL", "Authentication"],
    liveUrl: "https://www.youtube.com/watch?v=M3Gjyj0CihU",
    githubUrl: "https://github.com/Ocean1029/NTU-Database-Management",
    imageUrl: "/images/projects/TicktEase.png",
    aspectRatio: "tall",
    featured: true
  }
];

export const milestones: Milestone[] = [
  {
    id: "1",
    title: "Became a 5-dan Go player",
    description: "Achieved 5-dan rank in Go (Weiqi), demonstrating strategic thinking and pattern recognition skills",
    date: "2015",
    type: "achievement",
    icon: "FaChessBoard"
  },
  {
    id: "2", 
    title: "Completed first round-island cycling trip",
    description: "Successfully completed my first cycling journey around Taiwan, covering over 1000km",
    date: "2016",
    type: "life",
    icon: "FaBicycle"
  },
  {
    id: "3",
    title: "Completed second round-island cycling trip", 
    description: "Accomplished my second round-island cycling adventure, further exploring Taiwan's beauty",
    date: "2019",
    type: "life",
    icon: "FaRoute"
  },
  {
    id: "4",
    title: "Joined the Humanities and Social Science Program",
    description: "Embarked on interdisciplinary studies combining technology with humanities perspectives",
    date: "2020", 
    type: "education",
    icon: "FaGraduationCap"
  },
  {
    id: "5",
    title: "Became the president of CK English Debate Club",
    description: "Led the English Debate Club, developing leadership and public speaking skills",
    date: "2021",
    type: "career",
    icon: "FaMicrophone"
  },
  {
    id: "6",
    title: "World Volunteer Club's visit to Nepal",
    description: "Participated in international volunteer work in Nepal, contributing to community development",
    date: "2023",
    type: "life", 
    icon: "FaGlobeAsia"
  },
  {
    id: "7",
    title: "International workcamp's visit to Iceland",
    description: "Joined international workcamp program in Iceland, experiencing cross-cultural collaboration",
    date: "2023",
    type: "life",
    icon: "FaMountain"
  },
  {
    id: "8",
    title: "Association Information Department",
    description: "Served in the Information Department, managing digital communications and tech infrastructure",
    date: "2024",
    type: "career",
    icon: "FaLaptopCode"
  },
  {
    id: "9", 
    title: "Committee member of NTUPA (Public Address)",
    description: "Contributed as committee member for NTU Public Address, organizing campus events and communications",
    date: "2024",
    type: "career",
    icon: "FaBullhorn"
  },
  {
    id: "10",
    title: "President of NTU Guitar Club Education Department",
    description: "Led the Education Department of NTU Guitar Club, organizing workshops and teaching programs",
    date: "2024", 
    type: "career",
    icon: "FaGuitar"
  },
  {
    id: "11",
    title: "President of NTU Information Management Student Association",
    description: "Served as president of the IM Student Association, representing student interests and organizing activities",
    date: "2024",
    type: "career",
    icon: "FaUsers"
  },
  {
    id: "12",
    title: "Market Department of SITCON",
    description: "Joined SITCON's Market Department, promoting tech conferences and community engagement",
    date: "2025",
    type: "career", 
    icon: "FaRocket"
  }
];

export const socialLinks: SocialLink[] = [
  {
    platform: "GitHub",
    url: "https://github.com/ckhsc17",
    icon: "github"
  },
  {
    platform: "LinkedIn",
    url: "https://www.linkedin.com/in/bowen-chen-a18491217/",
    icon: "linkedin"
  },
  {
    platform: "Instagram",
    url: "https://instagram.com/bchiang7",
    icon: "instagram"
  },
  {
    platform: "Facebook",
    url: "https://www.facebook.com/chen.po.hua.384674/",
    icon: "facebook"
  }
];

export const travelDestinations: TravelDestination[] = [
  {
    id: "iceland",
    country: "Iceland",
    coordinates: { lng: -19.0208, lat: 64.9631 },
    visitDate: "2023",
    duration: "2 weeks",
    highlights: [
      "International workcamp experience",
      "Northern Lights observation",
      "Blue Lagoon geothermal spa",
      "Golden Circle tour",
      "Cultural exchange with locals"
    ],
    description: "An unforgettable international workcamp experience in the land of fire and ice. Participated in community projects while exploring Iceland's stunning natural wonders including waterfalls, geysers, and volcanic landscapes.",
    photos: [
      {
        id: "iceland-1",
        url: "/images/travel/iceland/northern-lights.jpg",
        thumbnail: "/images/travel/iceland/northern-lights-thumb.jpg",
        caption: "Magical Northern Lights dancing in the Arctic sky",
        location: "Reykjavik"
      },
      {
        id: "iceland-2", 
        url: "/images/travel/iceland/blue-lagoon.jpg",
        thumbnail: "/images/travel/iceland/blue-lagoon-thumb.jpg",
        caption: "Relaxing in the famous Blue Lagoon",
        location: "Grindavik"
      },
      {
        id: "iceland-3",
        url: "/images/travel/iceland/workcamp.jpg", 
        thumbnail: "/images/travel/iceland/workcamp-thumb.jpg",
        caption: "International workcamp team building",
        location: "Reykjavik"
      }
    ]
  },
  {
    id: "nepal",
    country: "Nepal", 
    coordinates: { lng: 84.1240, lat: 28.3949 },
    visitDate: "2023",
    duration: "3 weeks",
    highlights: [
      "World Volunteer Club mission",
      "Community development projects",
      "Himalayan mountain views", 
      "Local school teaching",
      "Cultural immersion"
    ],
    description: "A meaningful volunteer experience with World Volunteer Club, contributing to community development in rural Nepal. Engaged in educational projects while experiencing the warmth of Nepalese culture and the majesty of the Himalayas.",
    photos: [
      {
        id: "nepal-1",
        url: "/images/travel/nepal/himalayas.jpg",
        thumbnail: "/images/travel/nepal/himalayas-thumb.jpg", 
        caption: "Breathtaking view of the Himalayan mountains",
        location: "Kathmandu Valley"
      },
      {
        id: "nepal-2",
        url: "/images/travel/nepal/volunteer-work.jpg",
        thumbnail: "/images/travel/nepal/volunteer-work-thumb.jpg",
        caption: "Teaching local children at community school",
        location: "Rural Nepal"
      },
      {
        id: "nepal-3",
        url: "/images/travel/nepal/temple.jpg",
        thumbnail: "/images/travel/nepal/temple-thumb.jpg", 
        caption: "Ancient Buddhist temple in Kathmandu",
        location: "Kathmandu"
      }
    ]
  },
  {
    id: "taiwan",
    country: "Taiwan",
    coordinates: { lng: 120.9605, lat: 23.6978 },
    visitDate: "2016 & 2019", 
    duration: "Multiple trips",
    highlights: [
      "Round-island cycling adventures",
      "East coast scenic routes",
      "Night market exploration",
      "Mountain and coastal views",
      "Local culture discovery"
    ],
    description: "Completed two epic round-island cycling journeys, covering over 1000km each time. Experienced Taiwan's diverse landscapes from bustling cities to serene coastlines, mountain ranges, and traditional villages.",
    photos: [
      {
        id: "taiwan-1",
        url: "/images/travel/taiwan/cycling-coast.jpg",
        thumbnail: "/images/travel/taiwan/cycling-coast-thumb.jpg",
        caption: "Cycling along Taiwan's stunning east coast",
        location: "Hualien"
      },
      {
        id: "taiwan-2", 
        url: "/images/travel/taiwan/night-market.jpg",
        thumbnail: "/images/travel/taiwan/night-market-thumb.jpg",
        caption: "Exploring vibrant night markets",
        location: "Taipei"
      },
      {
        id: "taiwan-3",
        url: "/images/travel/taiwan/mountain-view.jpg",
        thumbnail: "/images/travel/taiwan/mountain-view-thumb.jpg",
        caption: "Panoramic mountain views from cycling route",
        location: "Central Mountains"
      }
    ]
  }
];
