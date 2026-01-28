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

async function pushToGitHub() {
  try {
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);
    
    const repoName = 'automobile-service-management';
    const repoDescription = 'Enterprise Automobile Car & Bike Service Management System with Django REST Framework backend and React frontend';
    
    let repo;
    try {
      const { data: existingRepo } = await octokit.repos.get({
        owner: user.login,
        repo: repoName,
      });
      repo = existingRepo;
      console.log(`Repository already exists: ${repo.html_url}`);
    } catch (error: any) {
      if (error.status === 404) {
        const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
          name: repoName,
          description: repoDescription,
          private: false,
          auto_init: false,
        });
        repo = newRepo;
        console.log(`Created new repository: ${repo.html_url}`);
      } else {
        throw error;
      }
    }
    
    const accessToken = await getAccessToken();
    const remoteUrl = `https://${user.login}:${accessToken}@github.com/${user.login}/${repoName}.git`;
    
    try {
      execSync('git remote remove origin', { stdio: 'pipe' });
    } catch (e) {
    }
    
    execSync(`git remote add origin ${remoteUrl}`, { stdio: 'pipe' });
    
    try {
      execSync('git branch -M main', { stdio: 'pipe' });
    } catch (e) {
    }
    
    console.log('Pushing to GitHub...');
    execSync('git push -u origin main --force', { stdio: 'inherit' });
    
    console.log(`\nSuccessfully pushed to: ${repo.html_url}`);
    return repo.html_url;
    
  } catch (error) {
    console.error('Error pushing to GitHub:', error);
    throw error;
  }
}

pushToGitHub();
