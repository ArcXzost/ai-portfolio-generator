import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req) {
  const { keywords } = await req.json();
  
  if (!keywords) {
    return NextResponse.json({ error: 'Keywords are required' }, { status: 400 });
  }

  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('Google API key is missing');
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const searchQuery = `
      Find 10 professional portfolio websites related to:
      ${keywords}
      
      Requirements:
      - Must be personal portfolio sites
      - Must have substantial HTML/CSS content
      - Must be publicly accessible
      - Prefer modern, well-designed sites
      
      Return only the URLs in JSON format.
    `;

    console.log('Sending search query:', searchQuery);

    const result = await model.generateContent(searchQuery);
    const responseText = result.response.text();

    // Clean the response text
    const cleanResponse = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const urls = JSON.parse(cleanResponse);

    if (!Array.isArray(urls)) {
      throw new Error('Invalid search results: Response format is incorrect');
    }

    // Filter and validate URLs
    const validUrls = urls
      .filter(url => 
        url.startsWith('http') && 
        !url.includes('linkedin.com') &&
        !url.includes('github.com')
      )
      .slice(0, 5); // Limit to top 5 results

    if (validUrls.length === 0) {
      throw new Error('No valid portfolio URLs found');
    }

    return NextResponse.json({
      success: true,
      urls: validUrls
    });
    
  } catch (error) {
    console.error('Search Error:', error);
    return NextResponse.json({ 
      error: 'Portfolio search failed',
      details: error.message
    }, { status: 500 });
  }
}