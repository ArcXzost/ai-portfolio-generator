import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    const { currentHTML, currentCSS, suggestion } = await req.json();
    
    if (!process.env.GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'Invalid API configuration' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
    You're a web designer reviewing suggested modifications for a portfolio website. Here's the current HTML and CSS:

    HTML:
    ${currentHTML}

    CSS:
    ${currentCSS}

    Suggestion:
    ${suggestion}

    Strict Rules:
    1. Do not include any global tags (html, body, head, etc.)
    2. All content must be wrapped in a div with class "ai-resume-isolation"
    3. Use only the following JSON format:
    {
      "html": "<modified HTML code>",
      "css": "<modified CSS code>"
    }
    4. Do not include any markdown syntax or code blocks
    5. Ensure all CSS is scoped to .ai-resume-isolation
    6. Maintain the existing theme and layout
    7. Do not add any new sections unless explicitly requested
    8. Validate all HTML and CSS before returning
    9. If the suggestion is invalid or unclear, return the original HTML and CSS

    Return only the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean the response text
    const cleanResponse = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return new Response(cleanResponse, { status: 200 });
  } catch (error) {
    console.error('Suggestion Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to get suggestions',
      details: error.message
    }), { status: 500 });
  }
}