import { fetchJSON, renderProjects} from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// ---- State ----
let projects = [];
let query = "";
let selectedIndex = -1;
let pieData = []; // holds {label, value} derived from current project set

async function initProjects() {
  // Fetch the data first
  projects = await fetchJSON('../lib/projects.jason');

  // Make sure data was fetched successfully
  console.log('Fetched projects:', projects);

  // Select the container in your HTML
  const projectsContainer = document.querySelector('.projects');

  // Render the projects
  renderProjects(projects, projectsContainer, 'h2');
 // Step 4: Add dynamic count to the page title
  const titleElement = document.querySelector('.projects-title');
  if (titleElement && Array.isArray(projects)) {
   titleElement.textContent = `My ${projects.length} Favorite Projects`;
  }
  let rolledData = d3.rollups(
  projects,
  (v) => v.length,
  (d) => d.year,
);
 // Convert rolledData → [{ value, label }]
  let data = rolledData.map(([year, count]) => ({
    value: count,
    label: year
  }));

  console.log("Pie chart data:", data); // helpful debug

  // ✅ Now draw the pie using the real data instead of [1,2,3]
const searchInput = document.querySelector('.searchBar');

  updateUI();

  // Live search
  searchInput.addEventListener("input", (event) => {
    query = event.target.value.toLowerCase();
    updateUI();

  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query);
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects); // ✅ reactive update!
});
renderPieChart(projects);

}
// Call the async function
initProjects();

// ---- Core Reactive Update Function ----
function updateUI() {
  const visible = getVisibleProjects();
  renderProjects(visible, document.querySelector(".projects"), "h2");
  renderPieChart(visible);
}
// ---- Compute Visible Projects Based on BOTH Filters ----
function getVisibleProjects() {
  let filtered = projects.filter((project) => {
    let values = Object.values(project).join("\n").toLowerCase();
    return values.includes(query);
  });

  if (selectedIndex !== -1 && pieData[selectedIndex]) {
    let year = pieData[selectedIndex].label;
    filtered = filtered.filter(p => p.year === year);
  }

  return filtered;
}


function renderPieChart(projectsGiven) {
  // Select SVG and legend
  let svg = d3.select("#projects-pie-plot");
  let legend = d3.select(".legend");

  // ✅ Clear previous pie + legend
  svg.selectAll("path").remove();
  legend.selectAll("*").remove();

  // ✅ Compute rolled data (counts per year)
  let rolledData = d3.rollups(
    projectsGiven,
    v => v.length,
    d => d.year
  );

  pieData = rolledData.map(([year, count]) => ({
    label: year,
    value: count
  }));

  // ✅ Generate slices
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let sliceGenerator = d3.pie().value(d => d.value);
  let arcs = sliceGenerator(pieData).map(d => arcGenerator(d));

  // ✅ Color scale
  let colors = d3.scaleOrdinal(d3.schemeTableau10);

  arcs.forEach((arc, i) => {
  svg.append("path")
    .attr("d", arc)
    .attr("fill", colors(i))
    .attr("class", i === selectedIndex ? "selected" : "")
    .on("click", () => {
      selectedIndex = selectedIndex === i ? -1 : i; // toggle selection
      updateUI();
      // highlight selected pie slice
      svg.selectAll("path")
        .attr("class", (_, i) => (i === selectedIndex ? "selected" : ""));

      // highlight legend items
      legend.selectAll("li")
        .attr("class", (_, i) => (i === selectedIndex ? "selected" : ""));

      // ✅ Now filter projects below
      if (selectedIndex === -1) {
        renderProjects(projectsGiven, document.querySelector(".projects"), "h2");
      } else {
        let selectedYear = data[selectedIndex].label;
        let filtered = projectsGiven.filter(p => p.year === selectedYear);
        renderProjects(filtered, document.querySelector(".projects"), "h2");
      }
    });
  });


  legend.selectAll("*").remove();
  pieData.forEach((d, i) => {
  legend.append("li")
    .attr("style", `--color:${colors(i)}`)
    .attr("class", i === selectedIndex ? "selected" : "")
    .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
    .on("click", () => {
      selectedIndex = selectedIndex === i ? -1 : i;
      updateUI();
      svg.selectAll("path")
        .attr("class", (_, i) => (i === selectedIndex ? "selected" : ""));

      legend.selectAll("li")
        .attr("class", (_, i) => (i === selectedIndex ? "selected" : ""));

      if (selectedIndex === -1) {
        renderProjects(projectsGiven, document.querySelector(".projects"), "h2");
      } else {
        let selectedYear = data[selectedIndex].label;
        let filtered = projectsGiven.filter(p => p.year === selectedYear);
        renderProjects(filtered, document.querySelector(".projects"), "h2");
      }
    });
  }); 
}