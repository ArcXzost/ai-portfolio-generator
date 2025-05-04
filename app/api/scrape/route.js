import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

// Helper function to validate URLs
async function validateUrl(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok; // Returns true if the status is 2xx
  } catch (error) {
    console.error(`URL validation failed for ${url}:`, error.message);
    return false;
  }
}

// Placeholder functions for browser pool and extraction logic
async function getBrowserFromPool() {
  // Implementation for getting a browser from the pool
  return await chromium.launch();
}

function returnBrowserToPool(browser) {
  // Implementation for returning a browser to the pool
  browser.close();
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
  const { urls } = await req.json();
  
  if (!urls || !Array.isArray(urls)) {
    return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
  }

  // Limit number of URLs to scrape
  const urlsToScrape = urls.slice(0, 5);

  // Use browser pool instead of creating new browser for each request
  const browser = await getBrowserFromPool();

  try {
    // Validate URLs before scraping
    const validUrls = await Promise.all(
      urlsToScrape.map(async url => {
        const isValid = await validateUrl(url);
        return isValid ? url : null;
      })
    ).then(results => results.filter(url => url !== null));

    console.log('Valid URLs:', validUrls);

    // Process in parallel with concurrency limit
    const results = await Promise.all(
      validUrls.map(async (url) => {
        try {
          const page = await browser.newPage();
          await page.goto(url, { waitUntil: 'domcontentloaded' });

          const html = await page.content();
          const css = await page.evaluate(() => {
            const styles = Array.from(document.querySelectorAll('style'))
              .map(style => style.textContent)
              .join('\n');
            return styles;
          });

          // Extract only necessary HTML and CSS
          const minimalHTML = extractRelevantSections(html);
          const minimalCSS = extractRelevantStyles(css);

          await page.close();
          return {
            url,
            html: minimalHTML,
            css: minimalCSS,
            success: true,
          };
        } catch (error) {
          console.error(`Failed to scrape ${url}:`, error.message);
          return {
            url,
            success: false,
            error: error.message,
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: results.filter(r => r.success),
    });
  } finally {
    // Return browser to pool instead of closing
    returnBrowserToPool(browser);
  }
}