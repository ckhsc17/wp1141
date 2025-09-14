import React from 'react';
import { SocialIcon } from './SocialIcon';
import { socialLinks } from '@/data/mockData';
import { analytics } from '@/utils/analytics';

interface SocialLinksProps {
  className?: string;
  iconSize?: number;
  showLabels?: boolean;
  direction?: 'horizontal' | 'vertical';
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  className = "",
  iconSize = 24,
  showLabels = false,
  direction = 'horizontal'
}) => {
  const containerClass = direction === 'horizontal' 
    ? 'flex items-center space-x-4' 
    : 'flex flex-col space-y-4';

  return (
    <div className={`${containerClass} ${className}`}>
      {socialLinks.map((link, index) => (
        <a
          key={index}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
          aria-label={`Visit ${link.platform}`}
          onClick={() => analytics.trackExternalLink(link.platform, link.url)}
        >
          <SocialIcon 
            icon={link.icon} 
            size={iconSize}
            className="group-hover:scale-110 transition-transform duration-200"
          />
          {showLabels && (
            <span className="text-sm font-medium">
              {link.platform}
            </span>
          )}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
