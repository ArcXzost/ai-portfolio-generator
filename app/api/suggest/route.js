import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import DOMPurify from 'isomorphic-dompurify';

function sanitizeOutput(html, css) {
  html = html.replace(/```html/g, '').replace(/```/g, '').trim();
  css = css.replace(/```css/g, '').replace(/```/g, '').trim();

  html = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'p', 'h1', 'h2', 'h3', 'span', 'a', 'img', 'ul', 'li', 'section', 'header', 'footer'],
    ALLOWED_ATTRS: ['class', 'id', 'href', 'src', 'alt', 'style'],
  });

  html = html.replace(/Built using.*?<\/p>/g, '');
  html = html.replace(/<!--.*?-->/g, '');

  css = css.replace(/\/\*.*?\*\//g, '');
  
  // Store the original unscoped CSS
  const originalCss = css;
  
  // Optimize CSS before returning
  const optimizedCss = optimizeCss(css);
  
  // Scope the CSS for preview purposes
  const scopedCss = scopeCSS(optimizedCss, '.ai-resume-isolation');

  return { 
    html, 
    css: scopedCss,
    originalCss: optimizedCss  // Include the unscoped version
  };
}

// Implement CSS optimization
function optimizeCss(css) {
  // Remove comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Remove whitespace
  css = css.replace(/\s+/g, ' ')
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*:\s*/g, ':');
  
  return css;
}

function scopeCSS(css, scopeSelector = '.ai-resume-isolation') {
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
      
      // Balanced approach for class/id/attribute selectors
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

export async function POST(req) {
  try {
    // Get API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Invalid API configuration' }, { status: 500 });
    }
    
    const { currentHTML, currentCSS, suggestion } = await req.json();
    
    if (!currentHTML || !currentCSS || !suggestion) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro-exp-03-25' });
    
    const prompt = `
      You are a helpful portfolio website design assistant. The user has a portfolio website 
      and wants to make the following changes: "${suggestion}".
      
      Current HTML:
      \`\`\`html
      ${currentHTML}
      \`\`\`
      
      Current CSS:
      \`\`\`css
      ${currentCSS}
      \`\`\`
      
      Please modify the HTML and CSS according to the user's suggestion. Make the smallest changes
      necessary to implement their request, while preserving the overall design and structure.
      
      Return the full updated HTML and CSS in this format:
      
      HTML:
      \`\`\`html
      (updated HTML code here)
      \`\`\`
      
      CSS:
      \`\`\`css
      (updated CSS code here)
      \`\`\`
    `;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract HTML and CSS from the response
    const htmlMatch = responseText.match(/```html\s*([\s\S]*?)\s*```/);
    const cssMatch = responseText.match(/```css\s*([\s\S]*?)\s*```/);
    
    if (!htmlMatch || !cssMatch) {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }
    
    const html = htmlMatch[1];
    const css = cssMatch[1];
    
    // Sanitize and process the output
    const sanitized = sanitizeOutput(html, css);
    
    return NextResponse.json({
      success: true,
      html: sanitized.html,
      css: sanitized.css,
      originalCss: sanitized.originalCss
    });
    
  } catch (error) {
    console.error('Suggestion Error:', error);
    return NextResponse.json({ 
      error: 'An error occurred processing your suggestion',
      details: error.message
    }, { status: 500 });
  }
}