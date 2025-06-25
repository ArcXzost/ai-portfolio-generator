import { NextResponse } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { html, css } = await req.json();
    
    if (!html || !css) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    // 1. First sanitize the output
    const sanitized = sanitizeOutput(html, css);
    
    // 2. Then run an AI quality check to fix common issues
    const qualityChecked = await runQualityCheck(sanitized.html, sanitized.css);
    
    return NextResponse.json({
      success: true,
      html: qualityChecked.html || sanitized.html,
      css: qualityChecked.css || sanitized.css,
      originalCss: qualityChecked.originalCss || sanitized.originalCss
    });
    
  } catch (error) {
    console.error('Error finalizing portfolio:', error);
    return NextResponse.json({ 
      error: 'Failed to finalize portfolio',
      details: error.message
    }, { status: 500 });
  }
}

// New function to run AI quality check on the generated portfolio
async function runQualityCheck(html, css) {
  if (!process.env.GOOGLE_API_KEY) {
    console.warn('AI quality check skipped: No Google API Key');
    return { html, css };
  }
  
  try {
    console.log('Running AI quality check...');
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
    
    // Create a detailed prompt for the quality check
    const prompt = `
You are a web development expert specializing in portfolio website quality assurance. 
I need you to review and fix the following HTML and CSS for a portfolio website.

COMMON ISSUES TO FIX:
1. Remove any instructional text that appears in the content (e.g., "{/* Consider adding an icon here */}")
2. Remove any placeholder comments that suggest adding content (e.g., "TODO: Replace with actual data")
3. Fix any incomplete or broken elements
4. Ensure image paths use proper placeholders (e.g., "https://placehold.co/600x400")
5. Make sure the HTML is visually complete without "lorem ipsum" text
6. Check that all sections are properly styled and visually appealing
7. Ensure all links have proper href attributes (even if placeholder)
8. Check for and fix layout issues or unbalanced elements

HTML to review:
\`\`\`html
${html}
\`\`\`

CSS to review:
\`\`\`css
${css}
\`\`\`

Please fix any issues found and return only the cleaned-up HTML and CSS without any explanations or summary.
If you find any instructional text mixed in with actual content, remove it while keeping the real content.

Return your response in this exact format:
\`\`\`html
(fixed HTML here)
\`\`\`

\`\`\`css
(fixed CSS here)
\`\`\`
`;
    
    // Generate content using AI
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract HTML and CSS from the response
    const htmlMatch = responseText.match(/```html\s*([\s\S]*?)\s*```/);
    const cssMatch = responseText.match(/```css\s*([\s\S]*?)\s*```/);
    
    if (!htmlMatch || !cssMatch) {
      console.warn('AI quality check: Could not extract HTML or CSS from response');
      return { html, css };
    }
    
    const fixedHtml = htmlMatch[1] || html;
    const fixedCss = cssMatch[1] || css;
    
    console.log('AI quality check completed successfully');
    
    // Re-scope the fixed CSS
    const fixedScopedCss = scopeCSS(fixedCss, '.ai-resume-isolation');
    
    return {
      html: fixedHtml,
      css: fixedScopedCss,
      originalCss: fixedCss
    };
  } catch (error) {
    console.error('AI quality check error:', error);
    // Fall back to the original if there's an error
    return { html, css };
  }
}

// Sanitize and scope the output
function sanitizeOutput(html, css) {
  html = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'span', 'a', 'img', 'ul', 'ol', 'li', 'section', 'header', 'footer', 'main', 'article', 'nav', 'button', 'form', 'input', 'textarea', 'br', 'hr', 'strong', 'em', 'i', 'b'],
    ALLOWED_ATTRS: ['class', 'id', 'href', 'src', 'alt', 'style', 'target', 'rel', 'placeholder', 'type', 'value', 'name', 'for', 'title'],
  });

  html = html.replace(/Built using.*?<\/p>/g, '');
  html = html.replace(/<!--.*?-->/g, '');

  css = css.replace(/\/\*.*?\*\//g, '');
  
  // Store the original unscoped CSS
  const originalCss = css;
  
  // Scope the CSS for preview purposes
  const scopedCss = scopeCSS(css, '.ai-resume-isolation');

  return { 
    html, 
    css: scopedCss,
    originalCss
  };
}

// CSS scoping function
function scopeCSS(css, scopeSelector) {
  if (!css || !scopeSelector) return css;
  
  // Create isolated CSS
  let isolatedCss = '';
  
  // Parse the CSS into manageable chunks
  const rules = css.split('}');
  
  for (let rule of rules) {
    if (!rule.trim()) continue;
    
    // Find the selector part and the declaration part
    const parts = rule.split('{');
    if (parts.length !== 2) continue;
    
    const selectors = parts[0].split(',');
    const declaration = parts[1];
    
    // Process each selector in the rule
    const scopedSelectors = selectors.map(selector => {
      selector = selector.trim();
      
      // Skip empty selectors
      if (!selector) return '';
      
      // Handle special cases
      if (selector.startsWith('@')) return selector;
      if (selector === ':root') return `${scopeSelector}`;
      if (/^(html|body)(\s|,|$)/.test(selector)) return scopeSelector;
      
      // For element selectors like 'h1', 'p', 'div' - make them more specific
      if (/^[a-zA-Z]+$/.test(selector)) {
        return `${scopeSelector} ${selector}`;
      }
      
      // For class/id/attribute selectors, we have two options:
      if (/^[a-zA-Z]+[.#\[]/.test(selector)) {
        // Element with class/id/attribute - add scope
        return `${scopeSelector} ${selector}`;
      } else if (/^[.#\[]/.test(selector)) {
        // Pure class/id/attribute selector
        return `${scopeSelector} ${selector}`;
      } else {
        // Complex selector - add scope
        return `${scopeSelector} ${selector}`;
      }
    });
    
    // Reconstruct the CSS rule
    isolatedCss += scopedSelectors.join(', ') + ' {' + declaration + '}\n';
  }
  
  // Handle @media queries
  let atRules = '';
  const mediaRegex = /@media[^{]+\{([\s\S]+?\})\s*\}/g;
  let match;
  
  while ((match = mediaRegex.exec(css)) !== null) {
    const mediaContent = match[1];
    atRules += match[0].replace(mediaContent, scopeCSS(mediaContent, scopeSelector));
  }
  
  return isolatedCss + atRules;
}