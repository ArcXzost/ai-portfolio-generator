import { NextResponse } from 'next/server';

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect('/?error=missing_code');
  }

  try {
    // Exchange code for access token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description);
    }

    // Store the token in localStorage and close the window
    const html = `
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'github-auth', token: '${data.access_token}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Auth Error:', error);
    const html = `
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'github-auth', error: '${error.message}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  }
} 