'use client';

import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import AboutSection from '@/components/AboutSection';
import ExperienceSection from '@/components/ExperienceSection';
import ProjectsSection from '@/components/ProjectsSection';
import { PortfolioViewModel, NavigationViewModel, ScrollViewModel } from '@/viewModels';

export default function Home() {
  const [portfolioVM] = useState(() => new PortfolioViewModel());
  const [navigationVM] = useState(() => new NavigationViewModel());
  const [scrollVM] = useState(() => new ScrollViewModel());

  useEffect(() => {
    const handleScroll = () => {
      scrollVM.updateScroll(window.scrollY);
      
      // Update active section based on scroll position
      const sections = ['about', 'experience', 'projects', 'milestones', 'connect'];
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
        <ExperienceSection portfolioVM={portfolioVM} />
        <ProjectsSection portfolioVM={portfolioVM} />
        
        {/* Milestones Section Placeholder */}
        <section id="milestones" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-4">
              <span className="text-primary-400 font-mono text-lg mr-2">04.</span>
              Life Milestones
            </h2>
            <div className="w-20 h-1 bg-primary-400 mx-auto mb-8"></div>
            <p className="text-gray-400">
              Interesting life experiences and achievements coming soon...
            </p>
          </div>
        </section>
        
        {/* Connect Section Placeholder */}
        <section id="connect" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 mb-4">
              <span className="text-primary-400 font-mono text-lg mr-2">05.</span>
              What's Next?
            </h2>
            <h3 className="text-2xl font-bold text-gray-100 mb-6">
              Get In Touch
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
              Although I'm not currently looking for any new opportunities, my inbox is always open. 
              Whether you have a question or just want to say hi, I'll try my best to get back to you!
            </p>
            <button className="px-8 py-3 bg-transparent border-2 border-primary-400 text-primary-400 rounded font-mono text-sm hover:bg-primary-400/10 transition-all duration-300">
              Say Hello
            </button>
          </div>
        </section>
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
