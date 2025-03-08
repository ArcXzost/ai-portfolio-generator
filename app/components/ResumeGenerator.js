"use client"
import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import PortfolioPreview from '@/app/components/PortfolioPreview';
import LoadingSpinner from './LoadingSpinner';
// import { Octokit } from "@octokit/rest";
import GitHubTokenInstructions from './GitHubTokenInstructions';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export default function ResumeGenerator() {
  const [file, setFile] = useState(null)
  // const [apiKey, setApiKey] = useState('')/
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
  const [isEditing, setIsEditing] = useState(false);
  const [editedHTML, setEditedHTML] = useState('');
  const [editedCSS, setEditedCSS] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  // const handleApiKeyChange = (event) => {
  //   setApiKey(event.target.value)
  // }

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(event.target.result)
      reader.onerror = (error) => reject(error)
      reader.readAsDataURL(file)
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    if (!file) {
      alert('Please select a file')
      setIsLoading(false)
      return
    }

    try {
      let base64File = await convertToBase64(file)
      base64File = base64File.substring(base64File.indexOf(',') + 1)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64File,
          customizations
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setResumeData(data)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred while processing your request')
    } finally {
      setIsLoading(false)
    }
  }

  // Update edited code when new content is generated
  useEffect(() => {
    if (resumeData) {
      setEditedHTML(resumeData.htmlStructure);
      setEditedCSS(resumeData.cssStyles);
    }
  }, [resumeData]);

  // Auto-save changes
  useEffect(() => {
    if (resumeData) {
      setResumeData(prev => ({
        ...prev,
        htmlStructure: editedHTML,
        cssStyles: editedCSS
      }));
    }
  }, [editedHTML, editedCSS]);

  const handleSuggestion = async (suggestion) => {
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
    } catch (error) {
      console.error('Suggestion Error:', error);
      alert(`Failed to get suggestions: ${error.message}`);
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

    setIsDeploying(true);
    setDeploymentStatus('');

    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubToken,
          html: resumeData.htmlStructure,
          css: resumeData.cssStyles
        }),
      });

      const data = await response.json();
      if (!response.ok) {
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
    <div>
      <form onSubmit={handleSubmit}>
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
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>
      {renderCustomizationForm()}
      
      {isLoading && <LoadingSpinner />}

      {!isLoading && resumeData && (
        <div className="preview-section">
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
          
          {viewMode === 'preview' ? (
            <>
              <PortfolioPreview 
                htmlStructure={resumeData.htmlStructure} 
                cssStyles={resumeData.cssStyles} 
              />
            </>
          ) : (
            <div className="code-container" style={{ width: '100%' }}>
              <div className="code-section" style={{ width: '90%' }}>
                <h4>HTML</h4>
                <textarea
                  value={editedHTML}
                  onChange={(e) => setEditedHTML(e.target.value)}
                  className="code-editor"
                />
              </div>
              
              <div className="code-section" style={{ width: '90%' }}>
                <h4>CSS</h4>
                <textarea
                  value={editedCSS}
                  onChange={(e) => setEditedCSS(e.target.value)}
                  className="code-editor"
                />
              </div>
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
