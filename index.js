import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';
const projects = await fetchJSON('./lib/projects.json');
const LatestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
renderProjects(LatestProjects, projectsContainer)
async function loadGitHubProfile() {
  const githubData = await fetchGitHubData('debsterzzz');
  console.log('GitHub data:', githubData);

  const profileStats = document.querySelector('#profile-stats');
  if (profileStats && githubData) {
    profileStats.innerHTML = `
      <dl class="stats-grid">
        <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
        <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
        <dt>Followers</dt><dd>${githubData.followers}</dd>
        <dt>Following</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  }
}

loadGitHubProfile();