import { useState, useEffect, useRef } from 'react';

export default function PortfolioPreview({ htmlStructure, cssStyles }) {
  const iframeRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  
  // Function to apply content to iframe
  const applyContent = () => {
    if (!iframeRef.current) return;
    
    try {
      // Get iframe document
      const iframeDoc = iframeRef.current.contentDocument || 
                        iframeRef.current.contentWindow?.document;
      
      if (!iframeDoc) {
        console.error("Couldn't access iframe document");
        return;
      }
      
      // Create a complete HTML document with styles
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Portfolio Preview</title>
            <style>
              /* Reset default margin and padding */
              body, html {
                margin: 0;
                padding: 0;
                height: 100%;
              }
              
              /* Apply portfolio CSS */
              ${cssStyles || '/* No styles generated yet */'}
            </style>
          </head>
          <body>
            ${htmlStructure || '<div style="text-align:center;padding:20px;">No content generated yet</div>'}
          </body>
        </html>
      `;
      
      // Clear existing content and write new content
      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();
      
      console.log("Applied content to preview");
      setLoaded(true);
      
    } catch (err) {
      console.error("Error updating preview:", err);
    }
  };

  // Apply content when the iframe loads initially
  const handleIframeLoad = () => {
    applyContent();
  };
  
  // Update content when props change or on initial load
  useEffect(() => {
    if (loaded) {
      applyContent();
    }
  }, [htmlStructure, cssStyles, loaded]);

  // Multiple attempts to apply the content to handle edge cases
  useEffect(() => {
    // Initial application
    if (iframeRef.current) {
      // Try immediately if iframe is already available
      applyContent();
      
      // Retry after short delays to catch timing issues
      const attempts = [50, 100, 500, 1000, 2000];
      
      attempts.forEach(delay => {
        setTimeout(() => {
          if (htmlStructure && cssStyles) {
            applyContent();
          }
        }, delay);
      });
    }
  }, [htmlStructure, cssStyles]);

  return (
    <div className="portfolio-preview">
      <iframe
        ref={iframeRef}
        title="Portfolio Preview"
        className="preview-iframe"
        onLoad={handleIframeLoad}
        sandbox="allow-same-origin allow-scripts"
        style={{
          width: '100%',
          height: '600px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#fff'
        }}
      />
    </div>
  );
}