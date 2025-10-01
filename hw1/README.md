# Personal Portfolio Website
https://bowenchen.vercel.app

A modern, responsive personal portfolio website built with Next.js, TypeScript, Tailwind CSS, and Framer Motion, following MVVM architecture principles. Intended to be neat and informative, letting people get to know important parts of me with a quick glance but can also find out more if they are interested. 

*The theme toggle and 3D toggle are currently in "coming soon" mode - they are visually present with beautiful hover effects but the actual functionality is still in development. The complete code architecture is available in the repo for future implementation.

## Features

- **Modern Design**: Clean, professional design inspired by top developer portfolios
- **Responsive**: Fully responsive design that works on all devices
- **Smooth Animations**: Beautiful animations and transitions using Framer Motion
- **MVVM Architecture**: Clean separation of concerns with ViewModels managing business logic
- **TypeScript**: Full type safety throughout the application
- **Optimized Performance**: Built with Next.js for optimal performance and SEO

## Sections

- **About**: Introduction with personal information and core technologies
- **Skills**: Technical skills organized by category with proficiency levels
- **Experience**: Professional work experience and education timeline
- **Projects**: Featured and other noteworthy projects with live demos
- **Milestones**: Personal achievements and life experiences with timeline
- **Traveling**: Interactive world map showcasing travel destinations and photo galleries
- **Connect**: Contact information and social links

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Maps**: React Simple Maps (for travel section)
- **Image Gallery**: React Image Gallery (for travel photos)
- **Country Flags**: React Country Flag (for travel destinations)
- **Architecture**: MVVM (Model-View-ViewModel)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd personal-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── api/            # API routes
│       └── content/    # Content API endpoints
├── components/          # React components (Views)
│   ├── Navigation.tsx           # Main navigation with smooth scrolling
│   ├── AboutSection.tsx         # About section with dynamic description
│   ├── SkillsSection.tsx        # Skills with category filtering
│   ├── ExperienceSection.tsx    # Work experience timeline
│   ├── ProjectsSection.tsx      # Featured projects with icons
│   ├── MilestonesSection.tsx    # Personal milestones timeline with links
│   ├── TravelingSection.tsx     # Interactive world map with travel photos
│   ├── ConnectSection.tsx       # Contact information
│   ├── SocialIcon.tsx           # Social media icons
│   ├── SocialLinks.tsx          # Social links component
│   ├── ThemeToggle.tsx          # Theme switching (coming soon)
│   ├── ThreeDContainer.tsx      # 3D experience container (coming soon)
│   └── ThreeDToggle.tsx         # 3D mode toggle (coming soon)
├── contexts/           # React context providers
│   ├── ThemeContext.tsx        # Theme management
│   └── ThreeDContext.tsx       # 3D mode state management
├── viewModels/         # Business logic layer (MVVM)
│   └── index.ts        # Portfolio ViewModel with data management
├── data/               # Mock data and content
│   ├── mockData.ts     # All application data
│   └── description.txt # About section description
└── types/              # TypeScript type definitions
    └── index.ts        # All interface definitions
```

## MVVM Architecture

This project follows the MVVM (Model-View-ViewModel) pattern:

- **Models**: Data structures and types (`src/types/`)
- **Views**: React components (`src/components/`)
- **ViewModels**: Business logic and state management (`src/viewModels/`)

## Customization

### Personal Information

Update the mock data in `src/data/mockData.ts` with your own information:

- Personal details
- Skills and technologies
- Work experience
- Projects
- Social links

### Styling

The design system is configured in `tailwind.config.js`. You can customize:

- Color palette
- Typography
- Spacing
- Animations

### Content

Each section can be customized by modifying the corresponding component in `src/components/`.

## Deployment

### Vercel 
This project is optimized for deployment on Vercel, which automates the CI/CD flow with small effort

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Design inspiration from various developer portfolios
- Icons and animations from Framer Motion
- Color palette inspired by modern design systems
