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
  { name: "JavaScript", level: 95, category: "languages" },
  { name: "TypeScript", level: 90, category: "languages" },
  { name: "React", level: 95, category: "frontend" },
  { name: "Next.js", level: 85, category: "frontend" },
  { name: "Vue.js", level: 80, category: "frontend" },
  { name: "Node.js", level: 85, category: "backend" },
  { name: "Python", level: 75, category: "languages" },
  { name: "Figma", level: 80, category: "tools" },
  { name: "Git", level: 90, category: "tools" },
  { name: "Docker", level: 70, category: "tools" }
];

export const experiences: Experience[] = [
  {
    id: "1",
    company: "Klaviyo",
    position: "Senior Frontend Engineer, Accessibility",
    period: "2024 — PRESENT",
    description: "Build and maintain critical components used to construct Klaviyo's frontend, across the whole product. Work closely with cross-functional teams, including developers, designers, and product managers, to implement and advocate for best practices in web accessibility.",
    technologies: ["JavaScript", "TypeScript", "React", "Storybook"],
    type: "work"
  },
  {
    id: "2",
    company: "Upstatement",
    position: "Lead Engineer",
    period: "2018 — 2024",
    description: "Build, style, and ship high-quality websites, design systems, mobile apps, and digital experiences for a diverse array of projects for clients including Harvard Business School, Everytown for Gun Safety, Pratt Institute, Koala Health, Vanderbilt University, The 19th News, and more. Provide leadership within engineering department through close collaboration, knowledge shares, and spearheading the adoption of new technologies.",
    technologies: ["JavaScript", "TypeScript", "React", "Vue.js", "Node.js"],
    type: "work"
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
