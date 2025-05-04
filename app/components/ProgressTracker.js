import React from 'react';

const GENERATION_STEPS = [
  { id: 'file', name: 'Resume File', icon: '📄' },
  { id: 'extract', name: 'Extract Content', icon: '🔍' },
  { id: 'search', name: 'Search Examples', icon: '🔎' },
  { id: 'scrape', name: 'Analyze Examples', icon: '📊' },
  { id: 'layout', name: 'Layout Structure', icon: '📐' },
  { id: 'header-about', name: 'Header & About', icon: '👤' },
  { id: 'skills-projects', name: 'Skills & Projects', icon: '🛠️' },
  { id: 'experience-education', name: 'Experience & Education', icon: '📈' },
  { id: 'contact-footer', name: 'Contact & Footer', icon: '📞' },
  { id: 'quality', name: 'Quality Check', icon: '✨' }
];

// Mapping between current stage text and step ID
const STAGE_TO_STEP = {
  'Starting portfolio generation...': 'file',
  'Reading resume file...': 'file',
  'Extracting text from PDF...': 'extract',
  'Extracting text from resume...': 'extract',
  'Searching for portfolio examples...': 'search',
  'Analyzing portfolio examples...': 'scrape',
  'Generating portfolio...': 'layout',
  'Generating layout structure...': 'layout',
  
  // Merged section mappings
  'Generating header section and about section...': 'header-about',
  'Generating header section...': 'header-about',
  'Generating about section...': 'header-about',
  
  'Generating skills section and projects section...': 'skills-projects',
  'Generating skills section...': 'skills-projects',
  'Generating projects section...': 'skills-projects',
  
  'Generating experience section and education section...': 'experience-education',
  'Generating experience section...': 'experience-education',
  'Generating education section...': 'experience-education',
  
  'Generating contact section and footer section...': 'contact-footer',
  'Generating contact section...': 'contact-footer',
  'Generating footer section...': 'contact-footer',
  
  // Quality check step
  'Quality checking and enhancing portfolio...': 'quality',
  'Finalizing portfolio...': 'quality',
  'Portfolio generation complete!': 'quality'
};

// Updated to accept simple mode prop
export default function ProgressTracker({ currentStage, progress, simple = false }) {
  // Determine current step based on stage
  const currentStepId = STAGE_TO_STEP[currentStage] || 'file';
  
  // Find active step index
  const activeIndex = GENERATION_STEPS.findIndex(step => step.id === currentStepId);
  
  // Simple view with just spinner and progress bar
  if (simple) {
    return (
      <div className="simple-progress-tracker">
        {/* Spinner/Loader */}
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
        
        {/* Current stage text */}
        <p className="current-stage">{currentStage}</p>
        
        {/* Progress bar */}
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-percentage">{progress}%</span>
        </div>
      </div>
    );
  }
  
  // Original detailed view
  return (
    <div className="progress-tracker">
      <div className="progress-steps">
        {GENERATION_STEPS.map((step, index) => {
          // Determine step status
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;
          
          return (
            <div 
              key={step.id} 
              className={`
                progress-step 
                ${isActive ? 'active' : ''} 
                ${isCompleted ? 'completed' : ''}
              `}
            >
              <div className="step-icon">
                {isCompleted ? '✅' : step.icon}
              </div>
              <div className="step-name">{step.name}</div>
              {index < GENERATION_STEPS.length - 1 && (
                <div className={`step-connector ${isCompleted ? 'completed' : ''}`}></div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="progress-details">
        <p className="current-stage">{currentStage}</p>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-percentage">{progress}%</span>
        </div>
      </div>
    </div>
  );
}