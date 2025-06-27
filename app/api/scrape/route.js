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

// Extract relevant content using Cheerio with null checks
function extractRelevantSections(html) {
  try {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, noscript, style, iframe, embed, object').remove();
    $('nav, header, footer, aside').remove();
    $('.ad, .advertisement, .popup, .modal').remove();
    $('[id*="ad"], [class*="ad"]').remove();
    
    // Try multiple selectors to find main content
    let mainContent = null;
    
    // Try main content selectors in order of preference
    const selectors = [
      'main',
      '[role="main"]',
      '.main',
      '.content',
      '.post',
      '.article',
      'article',
      '#content',
      '#main',
      '.container',
      'body'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        mainContent = element.html();
        if (mainContent && mainContent.trim().length > 0) {
          break;
        }
      }
    }
    
    // Fallback to body if nothing found
    if (!mainContent) {
      mainContent = $('body').html() || html;
    }
    
    // Ensure mainContent is a string
    if (!mainContent || typeof mainContent !== 'string') {
      return html;
    }
    
    // Clean up the HTML
    const cleanedHtml = mainContent
      .replace(/\s+/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
    
    return cleanedHtml;
  } catch (error) {
    console.error('Error extracting sections:', error);
    return html || '';
  }
}

// Extract CSS styles using Cheerio with null checks
function extractRelevantStyles(html) {
  try {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const $ = cheerio.load(html);
    
    let styles = '';
    
    // Extract inline styles
    $('style').each((i, el) => {
      const styleContent = $(el).html();
      if (styleContent) {
        styles += styleContent + '\n';
      }
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

// NEW: Extract relevant sections as structured JSON
function extractSectionSpecificData(html) {
  try {
    if (!html || typeof html !== 'string') {
      return {};
    }

    const $ = cheerio.load(html);
    const sections = {};
    
    // Header patterns
    const headerSelectors = ['header', '.header', '#header', 'nav', '.nav', '.navbar'];
    for (const selector of headerSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        sections.header = {
          html: element.html().substring(0, 400),
          classes: element.attr('class') || '',
          structure: extractStructurePattern(element)
        };
        break;
      }
    }
    
    // About sections
    const aboutSelectors = ['.about', '#about', '[class*="about"]', '.intro', '.profile'];
    for (const selector of aboutSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        sections.about = {
          html: element.html().substring(0, 400),
          classes: element.attr('class') || '',
          structure: extractStructurePattern(element)
        };
        break;
      }
    }
    
    // Skills sections
    const skillsSelectors = ['.skills', '#skills', '.technologies', '.tech-stack', '[class*="skill"]'];
    for (const selector of skillsSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        sections.skills = {
          html: element.html().substring(0, 400),
          classes: element.attr('class') || '',
          structure: extractStructurePattern(element)
        };
        break;
      }
    }
    
    // Projects sections
    const projectsSelectors = ['.projects', '#projects', '.portfolio', '.work', '[class*="project"]'];
    for (const selector of projectsSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        sections.projects = {
          html: element.html().substring(0, 400),
          classes: element.attr('class') || '',
          structure: extractStructurePattern(element)
        };
        break;
      }
    }
    
    // Experience sections
    const experienceSelectors = ['.experience', '#experience', '.work-history', '[class*="experience"]'];
    for (const selector of experienceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        sections.experience = {
          html: element.html().substring(0, 400),
          classes: element.attr('class') || '',
          structure: extractStructurePattern(element)
        };
        break;
      }
    }
    
    return sections;
  } catch (error) {
    console.error('Error extracting section data:', error);
    return {};
  }
}

// Helper to extract structural patterns
function extractStructurePattern(element) {
  const $ = cheerio;
  const tagName = element.get(0).tagName;
  const children = element.children().length;
  const hasGrid = element.hasClass('grid') || element.css('display') === 'grid';
  const hasFlex = element.hasClass('flex') || element.css('display') === 'flex';
  
  return {
    tag: tagName,
    children: children,
    layout: hasGrid ? 'grid' : hasFlex ? 'flex' : 'block',
    pattern: `${tagName} with ${children} children (${hasGrid ? 'grid' : hasFlex ? 'flex' : 'block'} layout)`
  };
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

    console.log('Valid URLs to scrape:', validUrls);

    if (validUrls.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No valid URLs to scrape'
      });
    }

    // Process URLs sequentially
    const results = [];
    for (const url of validUrls) {
      try {
        console.log(`Scraping: ${url}`);
        
        // Fetch HTML content
        const html = await fetchPageContent(url);
        
        if (!html) {
          throw new Error('No HTML content received');
        }
        
        // Extract section-specific structured data
        const sectionData = extractSectionSpecificData(html);
        const minimalCSS = extractRelevantStyles(html);
        
        // Extract additional metadata using Cheerio
        const $ = cheerio.load(html);
        const title = $('title').text() || '';
        const description = $('meta[name="description"]').attr('content') || '';
        
        results.push({
          url,
          sections: sectionData, // Structured section data instead of full HTML
          css: minimalCSS.substring(0, 500), // Limit CSS size
          metadata: {
            title: title.trim(),
            description: description.trim()
          },
          success: true,
        });
        
        console.log(`Successfully scraped: ${url}`);
        
        // Add small delay between requests
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

    console.log(`Scraping completed: ${successfulResults.length}/${validUrls.length} successful`);
    console.log('Sample scraped data structure:', JSON.stringify(successfulResults[0], null, 2));

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