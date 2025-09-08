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
    title: "Build a Spotify Connected App",
    description: "A web app for visualizing personalized Spotify data. View your top artists, top tracks, recently played tracks, and detailed audio information about each track. Create and save new playlists of recommended tracks based on your existing playlists and more.",
    technologies: ["React", "Styled Components", "Express", "Spotify API", "Heroku"],
    liveUrl: "https://spotify-profile.herokuapp.com/",
    githubUrl: "https://github.com/bchiang7/spotify-profile",
    featured: true
  },
  {
    id: "2",
    title: "Halcyon Theme",
    description: "A minimal, dark blue theme for VS Code, Sublime Text, Atom, iTerm, and more. Available on Visual Studio Marketplace, Package Control, Atom Package Manager, and npm.",
    technologies: ["VS Code", "Sublime Text", "Atom", "iTerm2", "Hyper"],
    liveUrl: "https://halcyon-theme.netlify.app/",
    githubUrl: "https://github.com/bchiang7/halcyon-theme",
    featured: true
  }
];

export const milestones: Milestone[] = [
  {
    id: "1",
    title: "Graduated from Northeastern University",
    description: "Received Bachelor's degree in Computer Science with a focus on Human-Computer Interaction",
    date: "2018",
    type: "education"
  },
  {
    id: "2",
    title: "First Open Source Contribution",
    description: "Made my first contribution to a major open source project, leading to regular contributions",
    date: "2019",
    type: "achievement"
  },
  {
    id: "3",
    title: "Korok Seeds Discovery",
    description: "In my spare time, I'm usually climbing, reading, hanging out with my wife and two cats, or running around Hyrule searching for Korok seeds",
    date: "Ongoing",
    type: "life"
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
