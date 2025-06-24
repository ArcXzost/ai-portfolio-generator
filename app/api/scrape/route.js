import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Helper function to validate URLs
async function validateUrl(url) {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      timeout: 5000
    });
    return response.ok;
  } catch (error) {
    console.error(`URL validation failed for ${url}:`, error.message);
    return false;
  }
}

// Fetch HTML content using fetch API
async function fetchPageContent(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return html;
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
}

// Extract relevant content using Cheerio
function extractRelevantSections(html) {
  try {
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, noscript, style, iframe, embed, object').remove();
    $('nav, header, footer, aside').remove();
    $('.ad, .advertisement, .popup, .modal').remove();
    $('[id*="ad"], [class*="ad"]').remove();
    
    // Extract main content areas
    const mainContent = $('main, [role="main"], .main, .content, .post, .article, article').html() || 
                       $('body').html();
    
    // Clean up the HTML
    const cleanedHtml = mainContent
      .replace(/\s+/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    
    return cleanedHtml;
  } catch (error) {
    console.error('Error extracting sections:', error);
    return html;
  }
}

// Extract CSS styles using Cheerio
function extractRelevantStyles(html) {
  try {
    const $ = cheerio.load(html);
    
    let styles = '';
    
    // Extract inline styles
    $('style').each((i, el) => {
      styles += $(el).html() + '\n';
    });
    
    // Extract CSS link references
    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        styles += `/* External CSS: ${href} */\n`;
      }
    });
    
    return styles;
  } catch (error) {
    console.error('Error extracting styles:', error);
    return '';
  }
}

export async function POST(req) {
  try {
    const { urls } = await req.json();
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    // Limit number of URLs to scrape
    const urlsToScrape = urls.slice(0, 5);

    // Validate URLs before scraping
    const validUrls = await Promise.all(
      urlsToScrape.map(async url => {
        const isValid = await validateUrl(url);
        return isValid ? url : null;
      })
    ).then(results => results.filter(url => url !== null));

    if (validUrls.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No valid URLs to scrape'
      });
    }

    // Process URLs sequentially to avoid overwhelming the target servers
    const results = [];
    for (const url of validUrls) {
      try {
        // Fetch HTML content
        const html = await fetchPageContent(url);
        
        // Extract relevant sections and styles
        const minimalHTML = extractRelevantSections(html);
        const minimalCSS = extractRelevantStyles(html);
        
        // Extract additional metadata using Cheerio
        const $ = cheerio.load(html);
        const title = $('title').text() || '';
        const description = $('meta[name="description"]').attr('content') || '';
        const keywords = $('meta[name="keywords"]').attr('content') || '';
        
        results.push({
          url,
          html: minimalHTML,
          css: minimalCSS,
          metadata: {
            title: title.trim(),
            description: description.trim(),
            keywords: keywords.trim()
          },
          success: true,
        });
        
        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Failed to scrape ${url}:`, error.message);
        results.push({
          url,
          success: false,
          error: error.message,
        });
      }
    }

    const successfulResults = results.filter(r => r.success);

    return NextResponse.json({
      success: true,
      data: successfulResults,
      count: successfulResults.length,
      method: 'cheerio'
    });

  } catch (error) {
    console.error('Scraping process failed:', error.message);
    return NextResponse.json({ 
      error: 'Scraping failed', 
      details: error.message 
    }, { status: 500 });
  }
}