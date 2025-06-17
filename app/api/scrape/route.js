import { NextResponse } from 'next/server';
import { chromium } from 'playwright-core';
import chromiumBinary from '@sparticuz/chromium';

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

// Browser launch function with @sparticuz/chromium
async function getBrowserFromPool() {
  try {
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
  // Implementation for extracting relevant sections of HTML
  return html;
}

function extractRelevantStyles(css) {
  // Implementation for extracting relevant styles of CSS
  return css;
}

export async function POST(req) {
  let browser;
  
  try {
    const { urls } = await req.json();
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    // Limit number of URLs to scrape
    const urlsToScrape = urls.slice(0, 3); // Reduced for serverless limits

    // Get browser instance with @sparticuz/chromium
    browser = await getBrowserFromPool();

    // Validate URLs before scraping
    const validUrls = await Promise.all(
      urlsToScrape.map(async url => {
        const isValid = await validateUrl(url);
        return isValid ? url : null;
      })
    ).then(results => results.filter(url => url !== null));

    console.log('Valid URLs:', validUrls);

    if (validUrls.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No valid URLs to scrape'
      });
    }

    // Process URLs sequentially to avoid memory issues in serverless
    const results = [];
    for (const url of validUrls) {
      try {
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Set navigation timeout
        page.setDefaultNavigationTimeout(15000);
        
        // Navigate to the URL
        await page.goto(url, { 
          waitUntil: 'domcontentloaded',
          timeout: 15000 
        });

        // Get page content
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

        // Extract only necessary HTML and CSS
        const minimalHTML = extractRelevantSections(html);
        const minimalCSS = extractRelevantStyles(css);

        await context.close(); // Close context instead of just page
        
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
    // Always close browser
    if (browser) {
      returnBrowserToPool(browser);
    }
  }
}