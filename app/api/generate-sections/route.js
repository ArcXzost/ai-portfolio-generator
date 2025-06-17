import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      return NextResponse.json({ error: 'Invalid API configuration' }, { status: 500 });
    }

    const { sections, resumeText, currentPortfolio, customizations, designData } = await req.json();
    
    if (!sections || !Array.isArray(sections) || sections.length === 0 || !resumeText) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    console.log(`Generating sections: ${sections.join(', ')}`);
    
    // Initialize the AI model
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" });
    
    // Create prompt for these sections
    const prompt = createMultiSectionPrompt(
      sections, 
      resumeText, 
      currentPortfolio, 
      customizations,
      designData
    );
    
    // Generate content using AI
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse the multi-section response
    const sectionResults = parseSectionResults(responseText, sections);
    
    if (sectionResults.length === 0) {
      return NextResponse.json({ 
        error: `Failed to parse AI response for sections: ${sections.join(', ')}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      sections: sectionResults
    });
    
  } catch (error) {
    console.error(`Section generation error:`, error);
    return NextResponse.json({ 
      error: error.message || 'An error occurred generating the sections',
    }, { status: 500 });
  }
}

// Parse results for multiple sections
function parseSectionResults(responseText, requestedSections) {
  const results = [];
  
  // For each requested section, try to find its HTML and CSS in the response
  for (const section of requestedSections) {
    // Look for section-specific markers with proper backtick handling
    const sectionStartRegex = new RegExp(`---${section}---[\\s\\S]*?\`\`\`html([\\s\\S]*?)\`\`\`[\\s\\S]*?\`\`\`css([\\s\\S]*?)\`\`\``, 'i');
    const match = responseText.match(sectionStartRegex);
    
    if (match && match[1] && match[2]) {
      results.push({
        name: section,
        html: match[1].trim(),
        css: match[2].trim()
      });
      continue;
    }
    
    // If no section markers, fall back to looking for general HTML/CSS blocks
    // This is a fallback for when there's only one section or the model didn't follow format
    if (requestedSections.length === 1) {
      const htmlMatch = responseText.match(/```html\s*([\s\S]*?)\s*```/);
      const cssMatch = responseText.match(/```css\s*([\s\S]*?)\s*```/);
      
      if (htmlMatch && cssMatch) {
        results.push({
          name: section,
          html: htmlMatch[1].trim(),
          css: cssMatch[1].trim()
        });
        break;
      }
    }
  }
  
  // Add debug logging if no results were found
  if (results.length === 0) {
    console.error("Failed to parse sections. Response text:", responseText.substring(0, 200) + "...");
  }
  
  return results;
}

// Create a prompt for multiple sections at once
function createMultiSectionPrompt(sections, resumeText, currentPortfolio, customizations, designData) {
  const theme = customizations?.theme || 'dark';
  const layout = customizations?.layout || 'modern';
  const colorScheme = customizations?.colorScheme || 'blue';
  const fontFamily = customizations?.fontFamily || 'sans-serif';
  
  // Base prompt for all sections
  let prompt = `
You are an expert web developer specializing in portfolio websites. I need you to generate ${sections.length > 1 ? 'multiple sections' : 'a section'} of a portfolio website based on this resume:

${resumeText.substring(0, 2000)}...

The website should follow these specifications:
- Theme: ${theme}
- Layout: ${layout}
- Color scheme: ${colorScheme}
- Font family: ${fontFamily}

${sections.length > 1 ? `I need you to generate the following sections: ${sections.join(', ')}` : `I need you to generate the ${sections[0]} section`}
`;

  // Add specific instructions for each section
  for (const section of sections) {
    prompt += `\n\n### SECTION: ${section.toUpperCase()} ###\n`;
    
    switch (section) {
      case 'layout-structure':
        prompt += `
Create the overall HTML structure for a portfolio website. Do not include the actual content sections yet. 
Just provide the base HTML with appropriate div containers, classes, and structure that will house all the future sections.
Focus on creating a clean, semantic layout with well-named classes.
`;
        break;
        
      case 'header':
        prompt += `
Create the header section including navigation. It should have:
- The person's name as the main title
- A professional title/role
- Navigation links to other sections of the portfolio
- Professional, clean design matching the ${theme} theme and ${colorScheme} color scheme
`;
        break;
        
      case 'about':
        prompt += `
Create an "About Me" section that:
- Introduces the person professionally
- Highlights their career focus and professional philosophy
- Presents their personality and working style
- Includes any personal details that might be relevant to employers
- Maintains the ${theme} theme and ${colorScheme} color scheme
`;
        break;
      
      case 'skills':
        prompt += `
Create a "Skills" section that:
- Lists technical skills from the resume
- Organizes them by category or proficiency
- Presents them in a visually appealing way (progress bars, tags, etc.)
- Maintains the ${theme} theme and ${colorScheme} color scheme
`;
        break;
      
      case 'projects':
        prompt += `
Create a "Projects" section that:
- Showcases 3-4 key projects from the resume
- Includes project titles, descriptions, and technologies used
- Uses a grid or card-based layout
- Maintains the ${theme} theme and ${colorScheme} color scheme
`;
        break;
      
      case 'experience':
        prompt += `
Create an "Experience" section that:
- Lists work experience from the resume
- Includes job titles, companies, dates, and key responsibilities
- Presents the information in a clean, chronological format
- Maintains the ${theme} theme and ${colorScheme} color scheme
`;
        break;
      
      case 'education':
        prompt += `
Create an "Education" section that:
- Lists educational background from the resume
- Includes degrees, institutions, dates, and any notable achievements
- Presents the information in a clean format
- Maintains the ${theme} theme and ${colorScheme} color scheme
`;
        break;
      
      case 'contact':
        prompt += `
Create a "Contact" section that:
- Includes contact information from the resume
- May have a simple contact form
- Includes social media links if appropriate
- Maintains the ${theme} theme and ${colorScheme} color scheme
`;
        break;
      
      case 'footer':
        prompt += `
Create a footer section that:
- Includes copyright information
- May have additional navigation links
- Has a clean, minimal design
- Maintains the ${theme} theme and ${colorScheme} color scheme
`;
        break;
      
      default:
        prompt += `Create a general section for ${section} that fits with the overall portfolio design.`;
    }
  }

  // If we already have some portfolio content, share it for context
  if (currentPortfolio && currentPortfolio.html) {
    prompt += `
\n\nHere's what we've generated so far for the portfolio. Make sure your sections integrate well with this:

HTML Structure:
\`\`\`html
${currentPortfolio.html.substring(0, 1000)}...
\`\`\`

CSS So Far:
\`\`\`css
${currentPortfolio.css.substring(0, 1000)}...
\`\`\`
`;
  }

  // Add design examples if available
  if (designData && designData.length > 0) {
    prompt += `
\n\nFor inspiration, here's a snippet from another portfolio website:

\`\`\`html
${designData[0].html.substring(0, 300)}...
\`\`\`

\`\`\`css
${designData[0].css.substring(0, 300)}...
\`\`\`
`;
  }

  // Add specific output format instructions for multiple sections
  if (sections.length > 1) {
    prompt += `
\n\nFor each section, provide the HTML and CSS separately with clear markers. Format your response like this:

---${sections[0]}---
\`\`\`html
<!-- HTML for the ${sections[0]} section -->
\`\`\`

\`\`\`css
/* CSS for the ${sections[0]} section */
\`\`\`

---${sections[1]}---
\`\`\`html
<!-- HTML for the ${sections[1]} section -->
\`\`\`

\`\`\`css
/* CSS for the ${sections[1]} section */
\`\`\`

And so on for each requested section. Make sure each section is clearly marked with the section name between triple dashes.
`;
  } else {
    // Format for a single section
    prompt += `
\n\nReturn both HTML and CSS code for this section. Format your response like this:

\`\`\`html
<!-- HTML for the ${sections[0]} section -->
\`\`\`

\`\`\`css
/* CSS for the ${sections[0]} section */
\`\`\`
`;
  }

  return prompt;
}