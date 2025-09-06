import React from 'react';
import { 
  FaGithub, 
  FaLinkedin, 
  FaInstagram, 
  FaFacebook, 
  FaYoutube,
  FaTwitter,
  FaEnvelope
} from 'react-icons/fa';

interface SocialIconProps {
  icon: string;
  size?: number;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  github: FaGithub,
  linkedin: FaLinkedin,
  instagram: FaInstagram,
  facebook: FaFacebook,
  youtube: FaYoutube,
  twitter: FaTwitter,
  email: FaEnvelope,
};

export const SocialIcon: React.FC<SocialIconProps> = ({ 
  icon, 
  size = 24, 
  className = "" 
}) => {
  const IconComponent = iconMap[icon.toLowerCase()];
  
  if (!IconComponent) {
    console.warn(`Icon not found for: ${icon}`);
    return null;
  }

  return (
    <IconComponent 
      size={size} 
      className={`transition-colors duration-200 ${className}`}
    />
  );
};

export default SocialIcon;
