import React from 'react';
import { SocialLinks } from './SocialLinks';

export const ConnectSection: React.FC = () => {
  return (
    <section 
      id="connect" 
      className="min-h-screen bg-gray-900 text-white py-20 px-6"
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Section Header */}
        <div className="mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Let's <span className="text-blue-400">Connect</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            I'm always interested in hearing about new opportunities, 
            collaborations, or just having a chat about technology and innovation.
          </p>
        </div>

        {/* Contact Information */}
        <div className="mb-12">
          <div className="inline-flex items-center space-x-2 bg-gray-800 px-6 py-3 rounded-full mb-8">
            <span className="text-green-400">●</span>
            <span className="text-gray-300">Available for new opportunities</span>
          </div>
          
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold mb-4">Get In Touch</h3>
            <p className="text-gray-400 mb-6">
              Feel free to reach out through any of these platforms
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-12">
          <SocialLinks 
            className="justify-center"
            iconSize={32}
            showLabels={true}
            direction="horizontal"
          />
        </div>
        
        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-gray-500 text-sm">
            © 2025 Bo. Built with Next.js & Tailwind CSS
          </p>
        </div>
      </div>
    </section>
  );
};

export default ConnectSection;
