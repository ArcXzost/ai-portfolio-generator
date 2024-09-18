import { GoogleGenerativeAI } from "@google/generative-ai";
import pdf from 'pdf-parse';

function sanitizeCode(responseText) {
  // Match everything inside HTML tags or enclosed in triple backticks (```)
  const codeOnly = responseText.match(/```([a-z]+)?([\s\S]*?)```/g);

  // If valid code is found, extract the code without backticks and language tags
  if (codeOnly) {
    return codeOnly.map(codeBlock => codeBlock.replace(/```[a-z]*|```/g, '').trim()).join('\n');
  }

  // Return the original text if no code block is found
  return responseText;
}


// Updated POST method using the sanitization process
export async function POST(req) {
  try {
    const { apiKey, base64File } = await req.json();

    // Create Gemini instance
    const genAI = new GoogleGenerativeAI(apiKey);

    // Convert base64 to buffer
    const dataBuffer = Buffer.from(base64File, 'base64');

    // Parse PDF data
    const data = await pdf(dataBuffer);
    const pdfText = data.text;

    // Call Google Generative AI to generate resume content
    let resumeContent = await generateResumeContent(genAI, pdfText);
    resumeContent = sanitizeCode(resumeContent); // Sanitize resume content

    // Call Google Generative AI to generate HTML structure
    let htmlStructure = await generateHTMLStructure(genAI, resumeContent);
    htmlStructure = sanitizeCode(htmlStructure); // Sanitize HTML content

    // Call Google Generative AI to generate CSS styles
    let cssStyles = await generateCSSStyles(genAI, htmlStructure);
    cssStyles = sanitizeCode(cssStyles); // Sanitize CSS content

    return new Response(
      JSON.stringify({
        resumeContent,
        htmlStructure,
        cssStyles
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while processing your request' }), { status: 500 });
  }
}


async function generateResumeContent(genAI, pdfText) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
  Analyze the LinkedIn profile content provided below:

  ${pdfText}

  Using Jake's resume template, please extract and organize the key information into the following structured format:

  1. **Professional Summary**: A concise overview of the individual's professional background, including key achievements and career goals.

  2. **Work Experience**:
    - **Job Title** at **Company Name**, **Location** (Month/Year - Month/Year)
      - Brief description of responsibilities and accomplishments.
    - **Job Title** at **Company Name**, **Location** (Month/Year - Month/Year)
      - Brief description of responsibilities and accomplishments.
    - (Include additional roles as applicable)

  3. **Education**:
    - **Degree** in **Field of Study**, **Institution Name** (Month/Year - Month/Year)
    - (Include additional degrees or certifications as applicable)

  4. **Skills**:
    - List of relevant skills and proficiencies, such as technical skills, languages, or other competencies.

  5. **Projects** (if applicable):
    - **Project Title**: Brief description of the project, including objectives and outcomes.

  6. **Certifications** (if applicable):
    - **Certification Name**, **Issuing Organization** (Month/Year)

  7. **Awards & Honors** (if applicable):
    - **Award Name**, **Awarding Organization** (Month/Year)

  Ensure that the information is formatted clearly and professionally, aligning with Jake's resume style.`;
  const result = await model.generateContent(prompt);


  return result.response.text();
}

async function generateHTMLStructure(genAI, resumeContent) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
  You’re a skilled web designer specializing in creating modern and professional portfolio websites with a dark theme. Your unique design philosophy blends aesthetics with functionality, ensuring that each portfolio not only captivates the viewer but also effectively showcases the individual's skills and experiences.

  Your task is to generate the layout and content for a dark-themed portfolio website based on the resume information I provide. Here are the details I need you to consider while crafting this website:

  - Name:
  - Profession:
  - Key Skills:
  - Work Experience:
  - Projects:
  - Contact Information:
  Create a modern, semantic portfolio website HTML structure for this resume content:\n\n${resumeContent}\n\nUse semantic HTML5 tags (header, main, section, footer) with appropriate classes prefixed with 'ai-resume-'. Include a nav-bar for easy navigation across sections. Exclude any comments or explanations.`;
  const result = await model.generateContent(prompt);

  return result.response.text();
}

async function generateCSSStyles(genAI, htmlContent) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `
  You’re a skilled web designer specializing in creating modern and professional portfolio websites with a dark theme. Your unique design philosophy blends aesthetics with functionality, ensuring that each portfolio not only captivates the viewer but also effectively showcases the individual's skills and experiences.
  Create modern, responsive CSS styles for a dark AI-themed resume with the following HTML structure:\n\n${htmlContent}\n\n
  Follow these guidelines:
  1. Start with a CSS reset that targets all elements within .ai-resume-isolation.
  2. Use CSS variables with the prefix 'ai-resume-' for colors and common values.
  3. Style elements using classes prefixed with 'ai-resume-'.
  4. Use '!important' for all property declarations to override any potential global styles.
  5. Use high specificity selectors by always including .ai-resume-isolation in each rule.
  6. Set explicit values for all properties, don't rely on inheritance.
  7. Use 'rem' units for font sizes and spacing to maintain consistent scaling.
  8. Ensure the styles create a self-contained, dark-themed AI resume design. All items should have proper paddings and margins.
  9. Do not include any @import statements or external resource links.
  10. Ensure all styles are scoped to .ai-resume-isolation to prevent leaking.
  11. Style the skills section to display skills as tag-like cards. Use flexbox or grid for layout.
  12. Implement a subtle hover effect for interactive elements.
  13. Use gradients and shadows to add depth and visual interest.
  14. Ensure good contrast for readability.
  15. Implement responsive design for various screen sizes.
  16. Style list elements (ul, ol) for a more professional look. There should not be any bullets in the final look.
  Only return the CSS code without comments, explanations, or advice.`;

  const result = await model.generateContent(prompt);

  return result.response.text();
}