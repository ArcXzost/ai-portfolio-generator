import { Octokit } from "@octokit/rest";

export async function POST(req) {
  try {
    const { githubToken, html, css } = await req.json();

    if (!githubToken) {
      return new Response(JSON.stringify({ error: 'GitHub token is required' }), { status: 400 });
    }

    const octokit = new Octokit({ auth: githubToken });

    // Create a new repository
    const repo = await octokit.rest.repos.createForAuthenticatedUser({
      name: 'my-portfolio',
      auto_init: true,
      private: false
    });

    // Create index.html
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: repo.data.owner.login,
      repo: repo.data.name,
      path: 'index.html',
      message: 'Add portfolio HTML',
      content: Buffer.from(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Portfolio</title>
          <style>${css}</style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `).toString('base64')
    });

    // Enable GitHub Pages
    await octokit.rest.repos.createPagesSite({
      owner: repo.data.owner.login,
      repo: repo.data.name,
      source: {
        branch: 'main',
        path: '/'
      }
    });

    return new Response(JSON.stringify({
      url: `https://${repo.data.owner.login}.github.io/${repo.data.name}`
    }), { status: 200 });

  } catch (error) {
    console.error('Deployment Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to deploy to GitHub Pages',
      details: error.message
    }), { status: 500 });
  }
} 