'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import AboutSection from '@/components/AboutSection';
import SkillsSection from '@/components/SkillsSection';
import ExperienceSection from '@/components/ExperienceSection';
import ProjectsSection from '@/components/ProjectsSection';
import MilestonesSection from '@/components/MilestonesSection';
import ConnectSection from '@/components/ConnectSection';
import { PortfolioViewModel, NavigationViewModel, ScrollViewModel } from '@/viewModels';

export default function Home() {
  const [portfolioVM] = useState(() => new PortfolioViewModel());
  const [navigationVM] = useState(() => new NavigationViewModel());
  const [scrollVM] = useState(() => new ScrollViewModel());

  useEffect(() => {
    const handleScroll = () => {
      scrollVM.updateScroll(window.scrollY);
      
      // Update active section based on scroll position
      const sections = ['about', 'skills', 'experience', 'projects', 'milestones', 'connect'];
      const scrollPosition = window.scrollY + 200;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetBottom = offsetTop + element.offsetHeight;
          
          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            navigationVM.setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [navigationVM, scrollVM]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-primary to-background-secondary text-white">
      <Navigation navigationVM={navigationVM} scrollVM={scrollVM} />
      
      <main>
        <AboutSection portfolioVM={portfolioVM} />
        <SkillsSection portfolioVM={portfolioVM} />
        <ExperienceSection portfolioVM={portfolioVM} />
        <ProjectsSection portfolioVM={portfolioVM} />
        <MilestonesSection portfolioVM={portfolioVM} />
        <ConnectSection />
      </main>
      
      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-gray-400 text-sm font-mono">
          Built with Next.js & Tailwind CSS
        </p>
      </footer>
    </div>
  );
}
