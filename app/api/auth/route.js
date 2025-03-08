import { Octokit } from "@octokit/rest";

export async function GET() {
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&scope=repo`;
  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl
    }
  });
} 