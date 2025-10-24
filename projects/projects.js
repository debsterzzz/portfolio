import { fetchJSON, renderProjects } from '../global.js';
async function initProjects() {
  // Fetch the data first
  const projects = await fetchJSON('../lib/projects.json');

  // Make sure data was fetched successfully
  console.log('Fetched projects:', projects);

  // Select the container in your HTML
  const projectsContainer = document.querySelector('.projects');

  // Render the projects
  renderProjects(projects, projectsContainer, 'h2');
}

// Call the async function
initProjects();