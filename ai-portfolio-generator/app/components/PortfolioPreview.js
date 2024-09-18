import React, { useRef, useEffect } from 'react';

const PortfolioPreview = ({ htmlStructure, cssStyles }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear previous content
      containerRef.current.innerHTML = '';

      // Create and append style element
      const styleElement = document.createElement('style');
      styleElement.textContent = cssStyles;
      containerRef.current.appendChild(styleElement);

      // Create and append content element
      const contentElement = document.createElement('div');
      contentElement.innerHTML = htmlStructure;
      containerRef.current.appendChild(contentElement);
    }
  }, [htmlStructure, cssStyles]);

  return (
    <div className="portfolio-preview-container">
      <div ref={containerRef} className="ai-resume-isolation" />
    </div>
  );
};

export default PortfolioPreview;