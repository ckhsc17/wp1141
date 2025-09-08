import { PersonalInfo, Skill, Experience, Project, Milestone, SocialLink } from '@/types';

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
  { name: "Prisma", level: 90, category: "tools" },
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
    description: "A comprehensive Flutter education app for medical learning, launching soon on App Store TestFlight. Full-stack application using Flutter as frontend and FastAPI as backend, deployed on GCP with Cloud Run & Cloud SQL. Features AI-powered question generation using prompt engineering and model cross-validation, personalized recommendations with RAG customization, and TextCNN for topic classification to optimize token costs.",
    technologies: ["Flutter", "FastAPI", "GCP", "Cloud Run", "Cloud SQL", "AI", "RAG", "TextCNN", "Prompt Engineering"],
    liveUrl: "https://testflight.apple.com/",
    githubUrl: "",
    imageUrl: "/images/projects/DOGTOR.png",
    featured: true
  },
  {
    id: "2",
    title: "TicketEase",
    description: "A full-stack ticketing system with advanced seat selection and concurrency control. Built with Next.js frontend, FastAPI backend, and Supabase cloud database. Features include user authentication, CI/CD deployment on GCP using Dockerfile and cloudbuild.yaml, optimized SQL schema with indexing for enhanced performance, and sophisticated seat selection concurrency control for improved user experience.",
    technologies: ["Next.js", "FastAPI", "Supabase", "GCP", "CI/CD", "Docker", "SQL", "Authentication"],
    liveUrl: "https://ticketease-demo.com/",
    githubUrl: "https://github.com/username/ticketease",
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
