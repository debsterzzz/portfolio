console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
// const navLinks = $$("nav a");
// let currentLink = navLinks.find(
//   (a) => a.host === location.host && a.pathname === location.pathname,
// );
// currentLink?.classList.add('current');
const BASE_PATH =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/' // Local server
    : '/portfolio/'; // GitHub Pages repo name
let pages = [
  { url: '', title: 'Home' },
  { url: 'contact/', title:'Contact'},
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title:'Resume'},
  { url: 'https://github.com/debsterzzz/portfolio', title:'GitHub'}
  // add the rest of your pages here
];
let nav = document.createElement('nav');
document.body.prepend(nav);
for (let p of pages) {
  let url = p.url;
  let title = p.title;
  url = !url.startsWith('http') ? BASE_PATH + url : url;
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  // Highlight current page
  a.classList.toggle(
    "current",
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in new tab
  a.toggleAttribute("target", a.host !== location.host);
  if (a.hasAttribute("target")) a.target = "_blank";

  // Add to nav
  nav.append(a);
};
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select id="color-scheme-select">
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
		</select>
	</label>`,
);
// Get a reference to the <select> element
const select = document.querySelector("label.color-scheme select");
select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
});
// Load saved preference (if any)
const savedScheme = localStorage.getItem("color-scheme");
if (savedScheme) {
  document.documentElement.style.setProperty("color-scheme", savedScheme);
  select.value = savedScheme;
}

// Listen for user changes
select.addEventListener("input", function (event) {
  const newScheme = event.target.value;
  document.documentElement.style.setProperty("color-scheme", newScheme);
  localStorage.setItem("color-scheme", newScheme);
});
export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
  throw new Error(`Failed to fetch projects: ${response.statusText}`);
}
console.log('Response object:', response);
const data = await response.json();
console.log('Loaded JSON data:', data);
return data;
  console.log(response);
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  // Your code will go here
  if(!containerElement) {
    throw new Error('containerElement not found in DOM');
  }
  containerElement.innerHTML = '';
    // Handle an empty or invalid projects array
  if (!Array.isArray(projects) || projects.length === 0) {
    containerElement.innerHTML = '<p>No projects available at this time.</p>';
    return;
  }

  // Validate the heading level (must be h1–h6)
  if (!/^h[1-6]$/.test(headingLevel)) {
    throw new Error('Invalid heading level. Use h1–h6.');
  }

  // Loop through each project object and create an <article>
  projects.forEach(project => {
  const article = document.createElement('article');
 // Handle missing properties gracefully
    const title = project.title || 'Untitled Project';
    const image = project.image || 'placeholder.jpg';
    const description = project.description || 'No description available.';

  article.innerHTML = `
    <${headingLevel}>${title}</${headingLevel}>
    <img src="${image}" alt="${title}">
    <p>${description}</p>
`;
containerElement.appendChild(article);
});
}
export async function fetchGitHubData(username) {
  // return statement here
  return await fetchJSON(`https://api.github.com/users/${username}`);
 
}