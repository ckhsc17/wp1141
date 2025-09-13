'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import AboutSection from '@/components/AboutSection';
import ExperienceSection from '@/components/ExperienceSection';
import ProjectsSection from '@/components/ProjectsSection';
import MilestonesSection from '@/components/MilestonesSection';
import TravelingSection from '@/components/TravelingSection';
import ConnectSection from '@/components/ConnectSection';
// import ThemeToggle from '@/components/ThemeToggle'; // 註解掉 theme toggle
import { PortfolioViewModel, NavigationViewModel, ScrollViewModel } from '@/viewModels';

export default function Home() {
  const [portfolioVM] = useState(() => PortfolioViewModel.getInstance());
  const [navigationVM] = useState(() => new NavigationViewModel());
  const [scrollVM] = useState(() => new ScrollViewModel());

  useEffect(() => {
    const handleScroll = () => {
      scrollVM.updateScroll(window.scrollY);
      
      // Update active section based on scroll position
      const sections = ['about', 'experience', 'projects', 'milestones', 'traveling', 'connect'];
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
    // 註解掉 dark mode classes，只保留暗色設定
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-primary to-background-secondary text-white transition-colors duration-300">
      <Navigation navigationVM={navigationVM} scrollVM={scrollVM} />
      {/* 註解掉 ThemeToggle */}
      {/* <ThemeToggle /> */}
      
      <main>
        <AboutSection portfolioVM={portfolioVM} />
        <ExperienceSection portfolioVM={portfolioVM} />
        <ProjectsSection portfolioVM={portfolioVM} />
        <MilestonesSection portfolioVM={portfolioVM} />
        <TravelingSection />
        <ConnectSection />
      </main>
    </div>
  );
}
