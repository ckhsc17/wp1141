# Personal Portfolio Website

A modern, responsive personal portfolio website built with Next.js, TypeScript, Tailwind CSS, and Framer Motion, following MVVM architecture principles.

## Features

- **Modern Design**: Clean, professional design inspired by top developer portfolios
- **Responsive**: Fully responsive design that works on all devices
- **Smooth Animations**: Beautiful animations and transitions using Framer Motion
- **MVVM Architecture**: Clean separation of concerns with ViewModels managing business logic
- **TypeScript**: Full type safety throughout the application
- **Optimized Performance**: Built with Next.js for optimal performance and SEO

## Sections

- **About**: Introduction with personal information and core technologies
- **Skills**: Technical skills organized by category
- **Experience**: Professional work experience and education
- **Projects**: Featured and other noteworthy projects
- **Milestones**: Personal achievements and life experiences
- **Connect**: Contact information and social links

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **UI Components**: Material UI (optional)
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
│   └── page.tsx        # Home page
├── components/          # React components (Views)
│   ├── Navigation.tsx
│   ├── AboutSection.tsx
│   ├── ExperienceSection.tsx
│   └── ProjectsSection.tsx
├── viewModels/         # Business logic layer
│   └── index.ts
├── data/               # Mock data and models
│   └── mockData.ts
└── types/              # TypeScript type definitions
    └── index.ts
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

The site can be deployed to any platform that supports Next.js:

- Vercel (recommended)
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Design inspiration from various developer portfolios
- Icons and animations from Framer Motion
- Color palette inspired by modern design systems
