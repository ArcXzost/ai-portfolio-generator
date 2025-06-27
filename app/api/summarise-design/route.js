import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req) {
  try {
    console.log('Summarise-design API called');
    
    const { scrapedData, sections } = await req.json();
    console.log('Received sections:', sections);
    console.log('Received scraped data count:', scrapedData?.length || 0);
    
    if (!process.env.GOOGLE_API_KEY) {
      console.error('Missing Google API key');
      return NextResponse.json({ error: 'Invalid API configuration' }, { status: 500 });
    }
    
    // Filter and prepare data for the specific sections being generated
    const relevantData = scrapedData.map(site => {
      const relevantSections = {};
      
      // Only include sections that are being generated
      sections.forEach(sectionName => {
        if (site.sections && site.sections[sectionName]) {
          relevantSections[sectionName] = site.sections[sectionName];
        }
      });
      
      return {
        url: site.url,
        title: site.metadata?.title || 'Unknown',
        sections: relevantSections
      };
    }).filter(site => Object.keys(site.sections).length > 0);
    
    console.log('Relevant data count after filtering:', relevantData.length);
    
    if (relevantData.length === 0) {
      console.log('No relevant design examples found');
      const response = {
        success: true,
        summary: "No relevant design examples found for the requested sections.",
        exampleCount: 0
      };
      console.log('Returning response:', response); // Debug log
      return NextResponse.json(response);
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite-preview-06-17" });
    
    const dataToAnalyze = JSON.stringify(relevantData, null, 2);
    console.log('Data size being sent to AI:', dataToAnalyze.length, 'characters');
    
    const prompt = `
Analyze these portfolio website examples and create a concise summary with code patterns for sections: ${sections.join(', ')}.

Data from ${relevantData.length} websites:
${dataToAnalyze}

For each section type found, provide:
1. Common structural patterns
2. Key CSS classes and approaches
3. Layout strategies
4. Brief code snippets (max 2-3 lines)

Keep total response under 800 words with focus on actionable code patterns.
Format as JSON with this structure:
{
  "sectionName": {
    "patterns": ["pattern1", "pattern2"],
    "codeSnippets": ["<div class='...'", "display: flex;"],
    "layoutApproach": "description"
  }
}
`;
    
    console.log('Sending request to AI model...');
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    
    console.log('AI response received, length:', summary.length);
    console.log('Summary preview:', summary.substring(0, 100) + '...');
    
    const response = {
      success: true,
      summary: summary,
      exampleCount: relevantData.length
    };
    
    console.log('Returning response with summary length:', response.summary.length); // Debug log
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Design summarization error:', error);
    return NextResponse.json({ 
      error: 'Failed to summarize design examples',
      details: error.message 
    }, { status: 500 });
  }
}