import { NextResponse } from 'next/server';

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

// Dynamic browser launch function
async function getBrowserFromPool() {
  try {
    // Dynamic imports to avoid bundling issues
    const { chromium } = await import('playwright-core');
    const chromiumBinary = (await import('@sparticuz/chromium')).default;
    
    const executablePath = await chromiumBinary.executablePath();
    
    const browser = await chromium.launch({
      args: chromiumBinary.args,
      executablePath: executablePath,
      headless: true,
    });
    
    return browser;
  } catch (error) {
    console.error('Browser launch error:', error);
    throw error;
  }
}

function returnBrowserToPool(browser) {
  if (browser) {
    browser.close();
  }
}

function extractRelevantSections(html) {
  return html;
}

function extractRelevantStyles(css) {
  return css;
}

export async function POST(req) {
  let browser;
  
  try {
    const { urls } = await req.json();
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    const urlsToScrape = urls.slice(0, 3);

    // Get browser instance
    browser = await getBrowserFromPool();

    // Validate URLs
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

    // Process URLs sequentially
    const results = [];
    for (const url of validUrls) {
      try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        page.setDefaultNavigationTimeout(15000);
        
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });

        const html = await page.content();
        const css = await page.evaluate(() => {
          try {
            const styles = Array.from(document.querySelectorAll('style'))
              .map(style => style.textContent || '')
              .join('\n');
            return styles;
          } catch (e) {
            return '';
          }
        });

        const minimalHTML = extractRelevantSections(html);
        const minimalCSS = extractRelevantStyles(css);

        await context.close();
        
        results.push({
          url,
          html: minimalHTML,
          css: minimalCSS,
          success: true,
        });
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
      count: successfulResults.length
    });

  } catch (error) {
    console.error('Scraping process failed:', error.message);
    return NextResponse.json({ 
      error: 'Scraping failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    if (browser) {
      returnBrowserToPool(browser);
    }
  }
}