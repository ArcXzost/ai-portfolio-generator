import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const SECTION_HTML_LIMIT = 2000;
const SECTION_TEXT_LIMIT = 600;
const MAX_EXTERNAL_STYLESHEETS = 2;
const EXTERNAL_CSS_CHAR_LIMIT = 3000;

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
async function extractRelevantStyles(html, baseUrl) {
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
        styles += `/* Inline style block ${i + 1} */\n${styleContent}\n`;
      }
    });

    // Extract external stylesheet content (limit to avoid huge payloads)
    const externalLinks = [];
    $('link[rel="stylesheet"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          externalLinks.push(absoluteUrl);
        } catch (err) {
          console.warn(`Failed to resolve stylesheet URL ${href} from ${baseUrl}:`, err.message);
        }
      }
    });

    const limitedLinks = externalLinks.slice(0, MAX_EXTERNAL_STYLESHEETS);
    for (const link of limitedLinks) {
      try {
        const response = await fetch(link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Accept': 'text/css,*/*;q=0.1'
          }
        });

        if (response.ok) {
          const css = await response.text();
          styles += `/* External CSS from ${link} */\n${css.substring(0, EXTERNAL_CSS_CHAR_LIMIT)}\n`;
        } else {
          console.warn(`Failed to fetch CSS from ${link}: ${response.status}`);
        }
      } catch (error) {
        console.warn(`Error fetching external stylesheet ${link}:`, error.message);
      }
    }

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

    const captureSection = (element) => {
      if (!element || element.length === 0) return null;
      const outerHtml = $.html(element);
      const textContent = element.text().replace(/\s+/g, ' ').trim();
      return {
        html: outerHtml ? outerHtml.substring(0, SECTION_HTML_LIMIT) : '',
        text: textContent ? textContent.substring(0, SECTION_TEXT_LIMIT) : '',
        classes: element.attr('class') || '',
        id: element.attr('id') || '',
        structure: extractStructurePattern($, element)
      };
    };

    // Layout / overall structure (fallbacks ensure we capture something meaningful)
    const layoutCandidates = ['main', 'body > div', 'body'];
    for (const selector of layoutCandidates) {
      const element = $(selector).first();
      if (element.length > 0) {
        const layoutData = captureSection(element);
        if (layoutData) {
          layoutData.structure.selector = selector;
          sections['layout-structure'] = layoutData;
          break;
        }
      }
    }
    
    // Header patterns
    const headerSelectors = ['header', '.header', '#header', 'nav', '.nav', '.navbar'];
    for (const selector of headerSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const headerData = captureSection(element);
        if (headerData) {
          headerData.structure.selector = selector;
          sections.header = headerData;
        }
        break;
      }
    }
    
    // About sections
    const aboutSelectors = ['.about', '#about', '[class*="about"]', '.intro', '.profile'];
    for (const selector of aboutSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const aboutData = captureSection(element);
        if (aboutData) {
          aboutData.structure.selector = selector;
          sections.about = aboutData;
        }
        break;
      }
    }
    
    // Skills sections
    const skillsSelectors = ['.skills', '#skills', '.technologies', '.tech-stack', '[class*="skill"]'];
    for (const selector of skillsSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const skillsData = captureSection(element);
        if (skillsData) {
          skillsData.structure.selector = selector;
          sections.skills = skillsData;
        }
        break;
      }
    }
    
    // Projects sections
    const projectsSelectors = ['.projects', '#projects', '.portfolio', '.work', '[class*="project"]'];
    for (const selector of projectsSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const projectsData = captureSection(element);
        if (projectsData) {
          projectsData.structure.selector = selector;
          sections.projects = projectsData;
        }
        break;
      }
    }
    
    // Experience sections
    const experienceSelectors = ['.experience', '#experience', '.work-history', '[class*="experience"]'];
    for (const selector of experienceSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const experienceData = captureSection(element);
        if (experienceData) {
          experienceData.structure.selector = selector;
          sections.experience = experienceData;
        }
        break;
      }
    }

    const educationSelectors = ['.education', '#education', '[class*="education"]'];
    for (const selector of educationSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const educationData = captureSection(element);
        if (educationData) {
          educationData.structure.selector = selector;
          sections.education = educationData;
        }
        break;
      }
    }

    const contactSelectors = ['.contact', '#contact', '[class*="contact"]', 'form[action*="contact"]'];
    for (const selector of contactSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const contactData = captureSection(element);
        if (contactData) {
          contactData.structure.selector = selector;
          sections.contact = contactData;
        }
        break;
      }
    }

    const footerSelectors = ['footer', '.footer', '#footer'];
    for (const selector of footerSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const footerData = captureSection(element);
        if (footerData) {
          footerData.structure.selector = selector;
          sections.footer = footerData;
        }
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
function extractStructurePattern($, element) {
  if (!element || element.length === 0) {
    return {
      tag: 'div',
      children: 0,
      layout: 'unknown',
      pattern: 'No structure information'
    };
  }

  const node = element.get(0);
  const tagName = (node && (node.tagName || node.name)) ? (node.tagName || node.name) : 'div';
  const children = element.children().length;
  const classAttr = element.attr('class') || '';
  const inlineStyle = element.attr('style') || '';
  const hasGrid = classAttr.includes('grid') || inlineStyle.includes('grid') || element.find('[class*="grid"]').length > 0;
  const hasFlex = classAttr.includes('flex') || inlineStyle.includes('flex') || element.find('[class*="flex"]').length > 0;

  return {
    tag: tagName,
    children,
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
  const minimalCSS = await extractRelevantStyles(html, url);
        
        // Extract additional metadata using Cheerio
        const $ = cheerio.load(html);
        const title = $('title').text() || '';
        const description = $('meta[name="description"]').attr('content') || '';
        
        results.push({
          url,
          sections: sectionData, // Structured section data instead of full HTML
          css: minimalCSS.substring(0, 4000), // Provide richer CSS context with a safe limit
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