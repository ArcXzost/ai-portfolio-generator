"use client"
import { useState, useEffect } from 'react'
import PortfolioPreview from './PortfolioPreview';
import LoadingSpinner from './LoadingSpinner';
import GitHubTokenInstructions from './GitHubTokenInstructions';
import ProgressTracker from './ProgressTracker';

export default function ResumeGenerator() {
  const [file, setFile] = useState(null)
  const [resumeData, setResumeData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState('preview')
  const [suggestion, setSuggestion] = useState('');
  const [customizations, setCustomizations] = useState({
    theme: 'dark',
    layout: 'modern',
    colorScheme: 'blue',
    fontFamily: 'sans-serif',
    showProfilePicture: true,
    showSocialLinks: true,
    showSkillsChart: true
  });
  const [showCustomization, setShowCustomization] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [editedHTML, setEditedHTML] = useState('');
  const [currentStage, setCurrentStage] = useState("");
  const [showCodeHolders, setShowCodeHolders] = useState(true);
  const [progress, setProgress] = useState(0); // Progress percentage
  const [originalCSS, setOriginalCSS] = useState('');
  const [currentView, setCurrentView] = useState("upload"); // Options: "upload", "generating", "preview"

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleGenerate = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setProgress(0);
    setCurrentStage("Preparing resume data...");
    setCurrentView("generating");
    
    try {
      if (!file) throw new Error('Please upload a resume file');
      
      // 1. Extract text from PDF
      setCurrentStage("Extracting text from resume...");
      setProgress(10);
      const base64File = await convertFileToBase64(file);
      
      // Extract text directly
      const extractResponse = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64File })
      });
      
      if (!extractResponse.ok) {
        const error = await extractResponse.json();
        throw new Error(error.error || 'Failed to extract text');
      }
      
      const { text: resumeText } = await extractResponse.json();
      
      // 2. Search for examples
      setCurrentStage("Searching for portfolio examples...");
      setProgress(20);
      
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: resumeText })
      });
      
      if (!searchResponse.ok) {
        const error = await searchResponse.json();
        throw new Error(error.error || 'Failed to search examples');
      }
      
      const searchData = await searchResponse.json();
      
      // 3. Scrape examples
      setCurrentStage("Analyzing portfolio examples...");
      setProgress(30);
      
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: searchData.urls })
      });
      
      if (!scrapeResponse.ok) {
        const error = await scrapeResponse.json();
        throw new Error(error.error || 'Failed to analyze examples');
      }
      
      const scrapeData = await scrapeResponse.json();
      
      // 4. Generate portfolio sections (2 at a time)
      setCurrentStage("Starting portfolio generation...");
      setProgress(40);

      // Define the sections to generate in pairs (except layout which is generated alone)
      const sectionPairs = [
        [{ name: 'layout-structure', displayName: 'layout structure' }], // Layout alone
        [{ name: 'header', displayName: 'header section' }, 
         { name: 'about', displayName: 'about section' }],
        [{ name: 'skills', displayName: 'skills section' },
         { name: 'projects', displayName: 'projects section' }],
        [{ name: 'experience', displayName: 'experience section' },
         { name: 'education', displayName: 'education section' }],
        [{ name: 'contact', displayName: 'contact section' },
         { name: 'footer', displayName: 'footer section' }]
      ];

      // Initialize the portfolio
      let portfolio = { html: '', css: '' };

      // Calculate progress increments
      const baseProgress = 40; // We start at 40%
      const remainingProgress = 50; // We have 50% left to go (leaving 10% for finalization)
      const progressPerPair = remainingProgress / sectionPairs.length;

      // Generate each section pair sequentially
      for (let i = 0; i < sectionPairs.length; i++) {
        const pair = sectionPairs[i];
        const pairProgress = Math.round(baseProgress + (i * progressPerPair));
        
        // Display the sections being generated
        const pairNames = pair.map(s => s.displayName).join(' and ');
        setCurrentStage(`Generating ${pairNames}...`);
        setProgress(pairProgress);
        
        // NEW: Create design summary for this specific pair of sections
        let designSummary = '';
        if (scrapeData.data && scrapeData.data.length > 0) {
          try {
            setCurrentStage(`Analyzing design examples for ${pairNames}...`);
            
            console.log('Making summarize request for sections:', pair.map(s => s.name));
            console.log('Scraped data count:', scrapeData.data.length);
            
            const summaryResponse = await fetch('/api/summarise-design', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                scrapedData: scrapeData.data, 
                sections: pair.map(s => s.name)
              })
            });
            
            console.log('Summary response status:', summaryResponse.status);
            console.log('Summary response ok:', summaryResponse.ok);
            
            if (summaryResponse.ok) {
              try {
                const summaryData = await summaryResponse.json();
                console.log('Summary data received:', summaryData); // Debug log
                
                designSummary = summaryData.summary || '';
                console.log(`Design summary created from ${summaryData.exampleCount || 0} examples for ${pairNames}`);
                console.log('Design Summary Preview:', designSummary.substring(0, 200) + '...');
              } catch (jsonError) {
                console.error('Failed to parse summary JSON:', jsonError);
                const responseText = await summaryResponse.text();
                console.error('Raw response:', responseText);
              }
            } else {
              // Log the error response
              const errorText = await summaryResponse.text();
              console.error('Summary response error:', summaryResponse.status, errorText);
            }
          } catch (error) {
            console.error('Failed to create design summary:', error);
            // Continue without summary if it fails
          }
        }
        
        // Update stage back to generation
        setCurrentStage(`Generating ${pairNames}...`);
        
        // Make API call to generate this section pair with summarized design data
        const sectionResponse = await fetch('/api/generate-sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sections: pair.map(s => s.name),
            resumeText: resumeText,
            currentPortfolio: portfolio,
            customizations,
            designSummary: designSummary // Pass summary instead of raw data
          })
        });
        
        if (!sectionResponse.ok) {
          const error = await sectionResponse.json();
          throw new Error(error.error || `Failed to generate ${pairNames}`);
        }
        
        const sectionResult = await sectionResponse.json();
        
        // Add these sections to our growing portfolio
        for (const section of sectionResult.sections) {
          portfolio.html += `\n<!-- ${section.name} section -->\n${section.html}`;
          portfolio.css += `\n/* ${section.name} styles */\n${section.css}`;
        }
      }

      // Final step - finalization and quality check
      setCurrentStage("Quality checking and enhancing portfolio...");
      setProgress(90);

      // Wrap the HTML in a container div if not already wrapped
      if (!portfolio.html.includes('class="ai-resume-isolation"')) {
        portfolio.html = `<div class="ai-resume-isolation">\n${portfolio.html}\n</div>`;
      }

      // Process the final portfolio (sanitizing, optimizing, scoping CSS)
      const finalizeResponse = await fetch('/api/finalize-portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: portfolio.html, css: portfolio.css })
      });

      if (!finalizeResponse.ok) {
        const error = await finalizeResponse.json();
        throw new Error(error.error || 'Failed to finalize portfolio');
      }

      const result = await finalizeResponse.json();

      // Show completion
      setCurrentStage("Portfolio generation complete!");
      setProgress(100);

      // Set the result data
      setResumeData({
        htmlStructure: result.html,
        cssStyles: result.css
      });
      setEditedHTML(result.html);
      setOriginalCSS(result.originalCss || result.css);

      // Important: Make sure isLoading is set to false FIRST
      setIsLoading(false);

      // IMPORTANT: Explicitly set the view AFTER setting isLoading to false
      // to ensure proper state sequence
      setTimeout(() => {
        setCurrentView("preview");
      }, 50);
      
    } catch (error) {
      console.error('Generation Error:', error);
      alert(`Error: ${error.message}`);
      setIsLoading(false);
      setCurrentView("upload");
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Update edited code when new content is generated
  useEffect(() => {
    if (resumeData) {
      setEditedHTML(resumeData.htmlStructure);
    }
  }, [resumeData]);

  // Auto-save changes
  useEffect(() => {
    if (resumeData) {
      setResumeData(prev => ({
        ...prev,
        htmlStructure: editedHTML,
        cssStyles: originalCSS
      }));
    }
  }, [editedHTML]);

  const handleSuggestion = async (suggestion) => {
    if (!suggestion.trim() || !resumeData) return;
    
    setIsLoading(true);
    setCurrentStage("Processing suggestion...");
    setProgress(20);
    
    try {
      const response = await fetch('/api/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentHTML: resumeData.htmlStructure,
          currentCSS: resumeData.cssStyles,
          suggestion
        }),
      });

      setProgress(60);
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get suggestions');
      }

      // Update the resume data with the suggestions
      setResumeData(prev => ({
        ...prev,
        htmlStructure: data.html,
        cssStyles: data.css
      }));
      
      // Update edited values to match new content
      setEditedHTML(data.html);
      
      setCurrentStage("Suggestion applied successfully!");
      setProgress(100);
      setSuggestion(''); // Clear suggestion input after successful application
    } catch (error) {
      console.error('Suggestion Error:', error);
      alert(`Failed to get suggestions: ${error.message}`);
      setCurrentStage("Suggestion failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomizationChange = (field, value) => {
    setCustomizations(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderCustomizationForm = () => (
    <div className={`customization-overlay ${showCustomization ? 'visible' : ''}`}>
      <div className="customization-content">
        <button
          className="close-button"
          onClick={() => setShowCustomization(false)}
        >
          &times;
        </button>
        <h3>Customize Your Portfolio</h3>
        <div className="form-group">
          <label>Theme:</label>
          <select
            value={customizations.theme}
            onChange={(e) => handleCustomizationChange('theme', e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="professional">Professional</option>
          </select>
        </div>

        <div className="form-group">
          <label>Layout:</label>
          <select
            value={customizations.layout}
            onChange={(e) => handleCustomizationChange('layout', e.target.value)}
          >
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        <div className="form-group">
          <label>Color Scheme:</label>
          <select
            value={customizations.colorScheme}
            onChange={(e) => handleCustomizationChange('colorScheme', e.target.value)}
          >
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
            <option value="red">Red</option>
          </select>
        </div>

        <div className="form-group">
          <label>Font Family:</label>
          <select
            value={customizations.fontFamily}
            onChange={(e) => handleCustomizationChange('fontFamily', e.target.value)}
          >
            <option value="sans-serif">Sans-serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={customizations.showProfilePicture}
              onChange={(e) => handleCustomizationChange('showProfilePicture', e.target.checked)}
            />
            Show Profile Picture
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={customizations.showSocialLinks}
              onChange={(e) => handleCustomizationChange('showSocialLinks', e.target.checked)}
            />
            Show Social Links
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={customizations.showSkillsChart}
              onChange={(e) => handleCustomizationChange('showSkillsChart', e.target.checked)}
            />
            Show Skills Chart
          </label>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showCustomization && !e.target.closest('.customization-content')) {
        setShowCustomization(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomization]);

  const handleDeployToGitHub = async () => {
    if (!githubToken || !resumeData) {
      alert('Please enter your GitHub token and generate the portfolio first');
      return;
    }

    try {
      setIsDeploying(true);
      setDeploymentStatus('Preparing files for deployment...');
      
      // Use the original unscoped CSS for deployment
      const cssToUse = originalCSS;
      
      const deployResponse = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: editedHTML,
          cssContent: cssToUse, // Use original CSS for deployment
          token: githubToken,
        }),
      });

      const data = await deployResponse.json();
      if (!deployResponse.ok) {
        throw new Error(data.error || 'Deployment failed');
      }

      setDeploymentStatus(`Deployment successful! Your portfolio is live at: ${data.url}`);

      // Open the deployed website in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Deployment Error:', error);
      setDeploymentStatus(`Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleGitHubAuth = () => {
    setIsAuthenticating(true);
    // Open auth in new window
    const authWindow = window.open('/api/auth', 'github-auth', 'width=500,height=600');

    // Focus the new window
    if (authWindow) {
      authWindow.focus();
    }
  };

  // Handle message from auth window
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'github-auth') {
        if (event.data.token) {
          setGithubToken(event.data.token);
        } else if (event.data.error) {
          alert(`GitHub authentication failed: ${event.data.error}`);
        }
        setIsAuthenticating(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="resume-generator">
      {currentView === "upload" && (
        <div className="upload-section">
          <form onSubmit={handleGenerate}>
            <input type="file" onChange={handleFileChange} accept=".pdf" />
            <div className="button-group">
              <button
                type="button"
                className="customize-button"
                onClick={() => setShowCustomization(!showCustomization)}
              >
                Customize
              </button>
              <button type="submit" disabled={isLoading || !file}>
                {isLoading ? 'Generating...' : 'Generate Portfolio'}
              </button>
            </div>
          </form>
          {renderCustomizationForm()}
        </div>
      )}
      
      {currentView === "generating" && (
        <div className="generation-section">
          <div className="spinner-container" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%', 
            padding: '20px 0'
          }}>
            <LoadingSpinner />
            <ProgressTracker currentStage={currentStage} progress={progress} />
          </div>
        </div>
      )}
      
      {currentView === "preview" && (
        <div className="preview-section">
          {/* Add loading overlay that appears when processing suggestions */}
          {isLoading && (
            <div className="suggestion-loading-overlay">
              <div className="spinner-container" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                textAlign: 'center',
                width: '100%', 
                padding: '20px 0'
              }}>
                <LoadingSpinner />
                <div className="suggestion-progress">
                  <p className="current-stage">{currentStage}</p>
                  <div className="progress-bar-container">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="upload-section">
          <form onSubmit={handleGenerate}>
            <input type="file" onChange={handleFileChange} accept=".pdf" />
            <div className="button-group">
              <button
                type="button"
                className="customize-button"
                onClick={() => setShowCustomization(!showCustomization)}
              >
                Customize
              </button>
              <button type="submit" disabled={isLoading || !file}>
                {isLoading ? 'Generating...' : 'Generate Portfolio'}
              </button>
            </div>
          </form>
          {renderCustomizationForm()}
          </div>
          <div className="preview-controls-container">
            <div className="preview-header">
              <button
                onClick={() => setViewMode('preview')}
                className={viewMode === 'preview' ? 'active' : ''}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={viewMode === 'code' ? 'active' : ''}
              >
                Code
              </button>
            </div>
          </div>

          {viewMode === 'preview' ? (
            <>
              <PortfolioPreview
                htmlStructure={resumeData.htmlStructure}
                cssStyles={originalCSS}
              />
            </>
          ) : (
            <div className="code-container" style={{ width: '100%' }}>
              {showCodeHolders && (
                <div>
                  <div className="code-section" style={{ width: '90%' }}>
                    <h4>HTML</h4>
                    <textarea
                      value={editedHTML}
                      onChange={(e) => setEditedHTML(e.target.value)}
                      className="code-editor"
                    />
                  </div>

                  <div className="code-section" style={{ width: '90%' }}>
                    <h4>CSS (Original/Unscoped)</h4>
                    <textarea
                      value={originalCSS}
                      onChange={(e) => setEditedCSS(e.target.value)}
                      className="code-editor"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="suggestion-box" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Suggest modifications..."
              disabled={isLoading}
            />
            <button
              onClick={() => handleSuggestion(suggestion)}
              disabled={isLoading || !suggestion.trim()}
            >
              Submit Suggestion
            </button>
          </div>
          
          {/* Keep the customization form */}
          {renderCustomizationForm()}
        </div>
      )}

      {resumeData && (
        <div className="github-deployment">
          <h3><center>Deploy to GitHub Pages</center></h3>
          <GitHubTokenInstructions />
          <div className="deployment-form">
            <button
              onClick={handleGitHubAuth}
              disabled={isAuthenticating || !!githubToken}
            >
              {githubToken ? 'Authenticated with GitHub' : 'Sign in with GitHub'}
            </button>
            {githubToken && (
              <button
                onClick={handleDeployToGitHub}
                disabled={isDeploying}
              >
                {isDeploying ? 'Deploying...' : 'Deploy to GitHub Pages'}
              </button>
            )}
          </div>
          {deploymentStatus && <p className="deployment-status">{deploymentStatus}</p>}
        </div>
      )}
    </div>
  )
}
