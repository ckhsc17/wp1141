import { PersonalInfo, Skill, Experience, Project, Milestone, SocialLink, TravelDestination } from '@/types';

// Mock data based on the provided image
export const personalInfo: PersonalInfo = {
  name: "Bowen Chen",
  title: "Fullstack Engineer",
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
    position: "Fullstack Engineer, New Course Selection System",
    period: "June 2025 — PRESENT",
    description: "Fullstack Engineer using TypeScript, applying layered architecture. Deal with Prisma data migration to systematically manage schema changes.",
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
    title: "Open Ticket",
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
    title: "First time being a live sound engineer",
    description: "Experienced my first role as a live sound engineer, managing audio for live performances",
    date: "2024",
    type: "career",
    icon: "FaRocket"
  },
  {
    id: "13",
    title: "Composed my first novel",
    description: "Completed my debut novel, exploring creative writing and storytelling",
    date: "2025",
    type: "achievement",
    icon: "FaBlog",
    link: "/files/novel.pdf"
  },
  {
    id: "14",
    title: "Directed my first stage play",
    description: "Successfully directed my first theatrical production, combining creativity with leadership",
    date: "2025",
    type: "achievement",
    icon: "FaPlay",
    link: "https://www.youtube.com/watch?v=vyMCwqeGdqo"
  },
  {
    id: "15",
    title: "First light dance performance",
    description: "Performed my first light dance, combining technology and artistic expression",
    date: "2025",
    type: "achievement",
    icon: "FaRocket",
    link: "https://www.youtube.com/watch?v=YH_QWUGwiGA"
  },
  {
    id: "16",
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
    url: "https://www.instagram.com/bohua19/",
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
        url: "/images/travel/iceland/1.JPG",
        thumbnail: "/images/travel/iceland/1.JPG",
        caption: "Stunning Icelandic landscape with dramatic skies",
        location: "Iceland"
      },
      {
        id: "iceland-2", 
        url: "/images/travel/iceland/2.JPG",
        thumbnail: "/images/travel/iceland/2.JPG",
        caption: "Exploring Iceland's unique geological formations",
        location: "Iceland"
      },
      {
        id: "iceland-3",
        url: "/images/travel/iceland/3.JPG", 
        thumbnail: "/images/travel/iceland/3.JPG",
        caption: "International workcamp team and beautiful scenery",
        location: "Iceland"
      }
    ],
    links: [
      {
        type: "vlog",
        title: "Iceland Adventure Vlog",
        url: "https://www.youtube.com/watch?v=your-iceland-vlog",
        description: "Watch my Iceland workcamp experience"
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
        url: "/images/travel/nepal/1.jpg",
        thumbnail: "/images/travel/nepal/1.jpg", 
        caption: "Breathtaking view of the Himalayan mountains",
        location: "Nepal"
      },
      {
        id: "nepal-2",
        url: "/images/travel/nepal/2.jpg",
        thumbnail: "/images/travel/nepal/2.jpg",
        caption: "Volunteer work and community engagement",
        location: "Nepal"
      },
      {
        id: "nepal-3",
        url: "/images/travel/nepal/3.jpg",
        thumbnail: "/images/travel/nepal/3.jpg", 
        caption: "Cultural experiences and local interactions",
        location: "Nepal"
      },
      {
        id: "nepal-4",
        url: "/images/travel/nepal/4.JPG",
        thumbnail: "/images/travel/nepal/4.JPG", 
        caption: "Beautiful mountain scenery and adventure",
        location: "Nepal"
      }
    ],
    links: [
      {
        type: "album",
        title: "Nepal Photo Album",
        url: "https://photos.google.com/your-nepal-album",
        description: "Complete photo collection from Nepal"
      }
    ]
  },
  {
    id: "austria",
    country: "Austria",
    coordinates: { lng: 13.3333, lat: 47.3333 },
    visitDate: "2024", 
    duration: "1 week",
    highlights: [
      "Alpine mountain exploration",
      "Classical music heritage",
      "Historic architecture tour",
      "Local cuisine experience",
      "Cultural immersion"
    ],
    description: "A wonderful journey through Austria's alpine beauty and rich cultural heritage. Explored historic cities, enjoyed classical music performances, and experienced the breathtaking mountain landscapes.",
    photos: [
      {
        id: "austria-1",
        url: "/images/travel/austria/1.jpg",
        thumbnail: "/images/travel/austria/1.jpg",
        caption: "Beautiful Austrian alpine scenery",
        location: "Austria"
      },
      {
        id: "austria-2", 
        url: "/images/travel/austria/2.JPG",
        thumbnail: "/images/travel/austria/2.JPG",
        caption: "Historic architecture and city views",
        location: "Austria"
      },
      {
        id: "austria-3",
        url: "/images/travel/austria/3.JPG",
        thumbnail: "/images/travel/austria/3.JPG",
        caption: "Mountain adventures and outdoor activities",
        location: "Austria"
      }
    ]
  },
  {
    id: "italy",
    country: "Italy",
    coordinates: { lng: 12.4964, lat: 41.9028 },
    visitDate: "2024", 
    duration: "10 days",
    highlights: [
      "Venice canal exploration",
      "Milan fashion and design",
      "Renaissance art and culture",
      "Italian cuisine discovery",
      "Historic landmarks tour"
    ],
    description: "An incredible journey through Italy's most iconic cities. From the romantic canals of Venice to the fashion capital Milan, experiencing the perfect blend of history, art, cuisine, and modern Italian culture.",
    photos: [
      {
        id: "italy-milan-1",
        url: "/images/travel/italy/milano/1.JPG",
        thumbnail: "/images/travel/italy/milano/1.JPG",
        caption: "Milan's stunning architecture and fashion district",
        location: "Milan, Italy"
      },
      {
        id: "italy-milan-2", 
        url: "/images/travel/italy/milano/2.JPG",
        thumbnail: "/images/travel/italy/milano/2.JPG",
        caption: "Exploring Milan's cultural landmarks",
        location: "Milan, Italy"
      },
      {
        id: "italy-milan-3",
        url: "/images/travel/italy/milano/3.JPG",
        thumbnail: "/images/travel/italy/milano/3.JPG",
        caption: "Milan city life and modern attractions",
        location: "Milan, Italy"
      },
      {
        id: "italy-venice-1",
        url: "/images/travel/italy/venice/1.JPG",
        thumbnail: "/images/travel/italy/venice/1.JPG",
        caption: "Romantic Venice canals and gondolas",
        location: "Venice, Italy"
      },
      {
        id: "italy-venice-2", 
        url: "/images/travel/italy/venice/2.JPG",
        thumbnail: "/images/travel/italy/venice/2.JPG",
        caption: "Historic Venice architecture and bridges",
        location: "Venice, Italy"
      },
      {
        id: "italy-venice-3",
        url: "/images/travel/italy/venice/3.JPG",
        thumbnail: "/images/travel/italy/venice/3.JPG",
        caption: "Venice's unique charm and waterways",
        location: "Venice, Italy"
      }
    ],
    links: [
      {
        type: "album",
        title: "Italy Photo Collection",
        url: "https://photos.google.com/your-italy-album",
        description: "Complete Italy travel photo album"
      }
    ]
  },
  {
    id: "japan",
    country: "Japan",
    coordinates: { lng: 139.6917, lat: 35.6895 },
    visitDate: "2023-2024", 
    duration: "Multiple trips",
    highlights: [
      "Tokyo urban exploration",
      "Osaka & Kyoto cultural heritage",
      "Fukuoka local experiences",
      "Traditional and modern fusion",
      "Japanese cuisine journey"
    ],
    description: "Multiple amazing trips across Japan, from the bustling streets of Tokyo to the traditional temples of Kyoto, the culinary delights of Osaka, and the warm hospitality of Fukuoka. Each region offered unique cultural experiences.",
    photos: [
      {
        id: "japan-fukuoka-1",
        url: "/images/travel/japan/fukuoka/3.jpg",
        thumbnail: "/images/travel/japan/fukuoka/3.jpg",
        caption: "Fukuoka local culture and delicious food",
        location: "Fukuoka, Japan"
      },
      {
        id: "japan-osaka-1", 
        url: "/images/travel/japan/osaka_kyoto/1.JPG",
        thumbnail: "/images/travel/japan/osaka_kyoto/1.JPG",
        caption: "Osaka and Kyoto traditional architecture",
        location: "Osaka/Kyoto, Japan"
      },
      {
        id: "japan-osaka-2",
        url: "/images/travel/japan/osaka_kyoto/2.JPG",
        thumbnail: "/images/travel/japan/osaka_kyoto/2.JPG",
        caption: "Temple visits and cultural experiences",
        location: "Osaka/Kyoto, Japan"
      },
      {
        id: "japan-osaka-3",
        url: "/images/travel/japan/osaka_kyoto/3.JPG",
        thumbnail: "/images/travel/japan/osaka_kyoto/3.JPG",
        caption: "Japanese gardens and scenic beauty",
        location: "Osaka/Kyoto, Japan"
      }
    ],
    comingSoonPhotos: [
      "Tokyo adventures - Coming Soon",
      "Hokkaido winter experiences - Coming Soon",
      "More Fukuoka memories - Coming Soon"
    ],
    links: [
      {
        type: "vlog",
        title: "Japan Travel Series",
        url: "https://www.youtube.com/playlist?list=your-japan-playlist",
        description: "Complete Japan travel vlog series"
      }
    ]
  },
  {
    id: "uk",
    country: "United Kingdom",
    coordinates: { lng: -0.1276, lat: 51.5074 },
    visitDate: "2024", 
    duration: "2 weeks",
    highlights: [
      "London historical landmarks",
      "British cultural immersion",
      "Countryside exploration",
      "Academic exchange program",
      "Traditional afternoon tea"
    ],
    description: "A fascinating exploration of British culture and history. From London's iconic landmarks to the beautiful countryside, experiencing the perfect blend of tradition and modernity in the United Kingdom.",
    photos: [
      {
        id: "uk-1",
        url: "/images/travel/u.k./1.JPG",
        thumbnail: "/images/travel/u.k./1.JPG",
        caption: "London's iconic landmarks and city life",
        location: "London, UK"
      },
      {
        id: "uk-2", 
        url: "/images/travel/u.k./2.JPG",
        thumbnail: "/images/travel/u.k./2.JPG",
        caption: "British countryside and scenic views",
        location: "United Kingdom"
      },
      {
        id: "uk-3",
        url: "/images/travel/u.k./3.JPG",
        thumbnail: "/images/travel/u.k./3.JPG",
        caption: "Historic architecture and cultural sites",
        location: "United Kingdom"
      },
      {
        id: "uk-4",
        url: "/images/travel/u.k./4.JPG",
        thumbnail: "/images/travel/u.k./4.JPG",
        caption: "Exploring British heritage and traditions",
        location: "United Kingdom"
      }
    ]
  },
  {
    id: "philippines",
    country: "Philippines",
    coordinates: { lng: 121.7740, lat: 12.8797 },
    visitDate: "2024", 
    duration: "1 week",
    highlights: [
      "Tropical island paradise",
      "Beach and marine activities",
      "Local Filipino culture",
      "Island hopping adventures",
      "Tropical cuisine experience"
    ],
    description: "A tropical paradise adventure in the beautiful Philippines. Enjoyed pristine beaches, crystal-clear waters, warm Filipino hospitality, and explored the stunning natural beauty of the islands.",
    photos: [
      {
        id: "philippines-1",
        url: "/images/travel/philippines/1.JPG",
        thumbnail: "/images/travel/philippines/1.JPG",
        caption: "Beautiful Philippine beaches and islands",
        location: "Philippines"
      }
    ],
    comingSoonPhotos: [
      "More island adventures - Coming Soon"
    ]
  },
  {
    id: "taiwan",
    country: "Taiwan",
    coordinates: { lng: 120.9605, lat: 23.6978 },
    visitDate: "2016 & 2019", 
    duration: "Multiple cycling trips",
    highlights: [
      "Round-island cycling adventures",
      "East coast scenic routes",
      "Night market exploration",
      "Mountain and coastal views",
      "Local culture discovery"
    ],
    description: "Completed two epic round-island cycling journeys, covering over 1000km each time. Experienced Taiwan's diverse landscapes from bustling cities to serene coastlines, mountain ranges, and traditional villages.",
    photos: [],
    comingSoonPhotos: [
      "Round-island cycling photos - Coming Soon",
      "East coast scenic routes - Coming Soon",
      "Night market adventures - Coming Soon"
    ],
    links: [
      {
        type: "blog",
        title: "Taiwan Cycling Adventures",
        url: "https://your-blog.com/taiwan-cycling",
        description: "Detailed blog about round-island cycling"
      }
    ]
  },
  {
    id: "singapore",
    country: "Singapore",
    coordinates: { lng: 103.8198, lat: 1.3521 },
    visitDate: "2024", 
    duration: "3 days",
    highlights: [
      "Marina Bay modern architecture",
      "Gardens by the Bay",
      "Multicultural food scene",
      "Urban exploration",
      "Southeast Asian gateway"
    ],
    description: "A quick but memorable visit to the Lion City. Experienced Singapore's incredible urban planning, diverse culinary scene, and impressive modern architecture in this Southeast Asian metropolis.",
    photos: [],
    comingSoonPhotos: [
      "Marina Bay photos - Coming Soon",
      "Gardens by the Bay - Coming Soon",
      "Singapore food adventure - Coming Soon"
    ]
  },
  {
    id: "hong_kong",
    country: "Hong Kong",
    coordinates: { lng: 114.1694, lat: 22.3193 },
    visitDate: "2024", 
    duration: "4 days",
    highlights: [
      "Victoria Harbour skyline",
      "Dim sum culinary tour",
      "Peak tram adventure",
      "Traditional markets",
      "East meets West culture"
    ],
    description: "A vibrant exploration of Hong Kong's unique blend of Eastern and Western cultures. From the stunning Victoria Harbour views to authentic dim sum experiences and bustling traditional markets.",
    photos: [],
    comingSoonPhotos: [
      "Victoria Harbour skyline - Coming Soon",
      "Dim sum adventures - Coming Soon",
      "Traditional market exploration - Coming Soon"
    ]
  }
];
