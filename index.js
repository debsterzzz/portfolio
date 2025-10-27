import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';
const projects = await fetchJSON('../lib/projects.jason');
const LatestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');
renderProjects(LatestProjects, projectsContainer)
async function loadGitHubProfile() {
const githubData = await fetchGitHubData('debsterzzz');
  console.log('GitHub data:', githubData);
const profileStats = document.querySelector('#profile-stats');
if (profileStats && githubData) {
    profileStats.innerHTML = `
      <div class="profile-card">
        <img src="${githubData.avatar_url}" alt="${githubData.login}" class="avatar">
        <h3><a href="${githubData.html_url}" target="_blank">${githubData.name || githubData.login}</a></h3>
        <p>${githubData.bio || 'No bio available.'}</p>

        <dl class="stats-grid">
          <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
          <dt>Followers</dt><dd>${githubData.followers}</dd>
          <dt>Following</dt><dd>${githubData.following}</dd>
          <dt>Location</dt><dd>${githubData.location || 'N/A'}</dd>
        </dl>
      </div>
    `;
  } else {
    console.error('Profile container not found or data missing.');
  }
}

loadGitHubProfile();