import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_TOTAL_CONTEXT_CHARS = 24000;
const MAX_SITES_ANALYZED = 4;
const HTML_SECTION_LIMIT = 1500;
const TEXT_SECTION_LIMIT = 500;
const CSS_SAMPLE_LIMIT = 2500;
const CSS_SAMPLE_FALLBACK_LIMIT = 1500;

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
        sections: relevantSections,
        cssSample: site.css || ''
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

    const buildDataset = (siteCount, htmlLimit, textLimit, cssLimit) => {
      return relevantData.slice(0, siteCount).map(site => {
        const truncatedSections = {};
        Object.entries(site.sections).forEach(([sectionName, sectionData]) => {
          if (!sectionData) return;
          truncatedSections[sectionName] = {
            ...sectionData,
            html: sectionData.html ? sectionData.html.substring(0, htmlLimit) : '',
            text: sectionData.text ? sectionData.text.substring(0, textLimit) : '',
          };
        });

        return {
          url: site.url,
          title: site.title,
          sections: truncatedSections,
          cssSample: site.cssSample ? site.cssSample.substring(0, cssLimit) : ''
        };
      });
    };

    let siteCount = Math.min(relevantData.length, MAX_SITES_ANALYZED);
    let htmlLimit = HTML_SECTION_LIMIT;
    let textLimit = TEXT_SECTION_LIMIT;
    let cssLimit = CSS_SAMPLE_LIMIT;
    let dataToAnalyze = '';
    let truncatedData = [];

    while (siteCount > 0) {
      truncatedData = buildDataset(siteCount, htmlLimit, textLimit, cssLimit);
      dataToAnalyze = JSON.stringify(truncatedData, null, 2);
      if (dataToAnalyze.length <= MAX_TOTAL_CONTEXT_CHARS) {
        break;
      }

      if (cssLimit > CSS_SAMPLE_FALLBACK_LIMIT) {
        cssLimit = Math.max(CSS_SAMPLE_FALLBACK_LIMIT, cssLimit - 500);
        continue;
      }

      if (htmlLimit > 900) {
        htmlLimit = Math.max(900, htmlLimit - 200);
        continue;
      }

      if (textLimit > 300) {
        textLimit = Math.max(300, textLimit - 100);
        continue;
      }

      siteCount -= 1;
    }

    if (dataToAnalyze.length > MAX_TOTAL_CONTEXT_CHARS) {
      // Final safeguard: trim string directly if still over limit
      dataToAnalyze = dataToAnalyze.substring(0, MAX_TOTAL_CONTEXT_CHARS);
      console.warn('Design summary dataset trimmed to max context size.');
    }

    console.log('Data size being sent to AI:', dataToAnalyze.length, 'characters');
    
    const prompt = `
Analyze these portfolio website examples and create a concise summary with code patterns for sections: ${sections.join(', ')}.

Data from ${truncatedData.length || relevantData.length} websites (content truncated as needed to fit model context):
${dataToAnalyze}

For each section type found, provide:
1. Common structural patterns
2. Key CSS classes, responsive behaviors, and layout techniques (reference cssSample when available)
3. Layout strategies and accessibility considerations
4. Brief HTML and CSS code snippets (max 2-3 lines each) directly derived from the provided data
5. Notes on how to adapt the pattern when limited examples are available (infer best practices if necessary)

Keep total response under 800 words with focus on actionable code patterns.
Format as JSON with this structure:
{
  "sectionName": {
    "patterns": ["pattern1", "pattern2"],
    "codeSnippets": ["<div class='...'>", "display: flex;"],
    "layoutApproach": "description",
    "responsiveNotes": "key adjustments for mobile/tablet"
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