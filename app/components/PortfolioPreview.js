import React from 'react';

const PortfolioPreview = ({ htmlStructure, cssStyles }) => {
  return (
    <div className="preview-container">
      <style>{`
        .ai-resume-isolation {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: auto;
        }
        ${cssStyles}
      `}</style>
      <div 
        className="ai-resume-isolation"
        dangerouslySetInnerHTML={{ __html: htmlStructure }}
      />
    </div>
  );
};

export default PortfolioPreview;