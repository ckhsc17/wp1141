'use client';

import React, { useEffect, useRef } from 'react';

interface IframeViewerProps {
  iframeContent: string;
}

const IframeViewer: React.FC<IframeViewerProps> = ({ iframeContent }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && iframeContent) {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Create a temporary container to parse the iframe HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = iframeContent;
      
      // Find only the iframe element, ignore the description paragraph
      const iframe = tempDiv.querySelector('iframe');
      
      if (iframe) {
        // Clone just the iframe without the description
        const clonedIframe = iframe.cloneNode(true) as HTMLIFrameElement;
        clonedIframe.style.width = '100%';
        clonedIframe.style.height = '100%';
        clonedIframe.style.border = 'none';
        
        containerRef.current.appendChild(clonedIframe);
      }
    }
  }, [iframeContent]);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full relative"
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}
    />
  );
};

export default IframeViewer;