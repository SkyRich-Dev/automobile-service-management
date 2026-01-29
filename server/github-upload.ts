import { Octokit } from '@octokit/rest'
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

async function pushWithToken() {
  try {
    const octokit = await getUncachableGitHubClient();
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    const accessToken = await getAccessToken();
    const repoName = 'automobile-service-management';
    
    // Use GIT_ASKPASS to provide credentials without modifying .git/config
    const askpassScript = '/tmp/git-askpass.sh';
    fs.writeFileSync(askpassScript, `#!/bin/bash\necho "${accessToken}"`, { mode: 0o700 });
    
    const pushUrl = `https://${user.login}@github.com/${user.login}/${repoName}.git`;
    
    console.log('Pushing to GitHub...');
    const result = execSync(
      `GIT_ASKPASS=${askpassScript} git push ${pushUrl} HEAD:main --force`,
      { 
        stdio: 'pipe',
        encoding: 'utf-8',
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
      }
    );
    
    console.log(result);
    console.log(`\nSuccessfully pushed to: https://github.com/${user.login}/${repoName}`);
    
    // Clean up
    fs.unlinkSync(askpassScript);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

pushWithToken();
