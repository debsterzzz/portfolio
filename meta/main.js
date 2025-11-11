import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line), // or just +row.line
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}


function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit) // Group by commit hash
    .map(([commit, lines]) => {
      // Each commit group contains all modified lines
      let first = lines[0];

      // Extract shared commit metadata from the first line entry
      let { author, date, time, timezone, datetime } = first;

      // Build the commit object
      let ret = {
        id: commit,
        url: 'https://github.com/vis-society/lab-7/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        // Derived feature: convert commit time to decimal hours for plotting
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        // Derived feature: how many lines changed in this commit
        totalLines: lines.length,
      };

      // Store the raw line data but *hide* it from normal console output
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,   // Don’t show up when printed
        writable: false,     // Prevent accidental overwrites
        configurable: false, // Don’t allow redefining
      });

      return ret;
    });
}

function renderCommitInfo(data, commits) {
  // Create the dl element
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total LOC
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);

  // Add total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Add more stats as needed...
    // Number of files
  const numFiles = d3.group(data, d => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(numFiles);


  const workByPeriod = d3.rollups(
  data,
  (v) => v.length,
  (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' }));
  const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
  dl.append('dt').text('Time of day that most work is done')
  dl.append('dd').text(maxPeriod);

  const fileLengths = d3.rollups(
  data,
  (v) => d3.max(v, (v) => v.line),
  (d) => d.file,
 );
  const averageFileLength = d3.mean(fileLengths, (d) => d[1]);
  dl.append('dt').text('Average File Length');
  dl.append('dd').text(averageFileLength)
}



function renderTooltipContent(commit) {
  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id;

  document.getElementById('commit-date').textContent = commit.datetime?.toLocaleDateString('en', {
    dateStyle: 'full',
  });

  document.getElementById('commit-time').textContent = commit.datetime?.toLocaleTimeString('en', {
    timeStyle: 'short',
  });

  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function isCommitSelected(selection, commit, xScale, yScale) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);
  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
}

function renderSelectionCount(selection, commits, xScale, yScale) {
  const selected = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  const text = selected.length > 0 ? `${selected.length} commits selected` : `No commits selected`;
  document.querySelector("#selection-count").textContent = text;

  return selected;
}

function renderLanguageBreakdown(selection, commits, xScale, yScale) {
  const selectedCommits = selection
    ? commits.filter((d) => isCommitSelected(selection, d, xScale, yScale))
    : [];

  const container = document.getElementById("language-breakdown");
  container.innerHTML = "";

  if (selectedCommits.length === 0) return;

  const lines = selectedCommits.flatMap((d) => d.lines);

  const breakdown = d3.rollup(lines, (v) => v.length, (d) => d.type);

  for (const [lang, count] of breakdown) {
    const proportion = d3.format(".1~%")(count / lines.length);
    container.innerHTML += `<dt>${lang}</dt><dd>${count} lines (${proportion})</dd>`;
  }
}


function renderScatterPlot(data, commits) {
  // Put all the JS code of Steps inside this function
  const width = 1000;
  const height = 600;

  const svg = d3
  .select('#chart')
  .append('svg')
  .attr('viewBox', `0 0 ${width} ${height}`)
  .style('overflow', 'visible');

  const xScale = d3
  .scaleTime()
  .domain(d3.extent(commits, (d) => d.datetime))
  .range([40, width-10])
  .nice();

  const yScale = d3.scaleLinear().domain([0, 24]).range([height-30, 10]);
  
  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
  };

  // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

  // Add gridlines BEFORE the axes
  const gridlines = svg
  .append('g')
  .attr('class', 'gridlines')
  .attr('transform', `translate(${usableArea.left}, 0)`);

  // Create gridlines as an axis with no labels and full-width ticks
  gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // ✅ **Step 4.1 + 4.2: Radius scale (square root!)**
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

  const rScale = d3
    .scaleSqrt() // fixes area perception
    .domain([minLines, maxLines])
    .range([2, 40]); // adjust if dots feel too big/small

  // ✅ **Step 4.3: Sort commits so small dots stay on top**
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

  const dots = svg.append('g').attr('class', 'dots');

  dots
  .selectAll('circle')
  .data(sortedCommits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', (d) => rScale(d.totalLines))
  .attr("fill", "steelblue")
  .style('fill-opacity', 0.7) // Add transparency for overlapping dots
  .on('mouseenter', (event, commit) => {
    d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
    renderTooltipContent(commit);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
  })
  .on("mousemove", updateTooltipPosition)
  .on('mouseleave', (event) => {
    d3.select(event.currentTarget).style('fill-opacity', 0.7);
    updateTooltipVisibility(false);
  });



    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
  .axisLeft(yScale)
  .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

     // ✅ Brush (AFTER dots) + raise dots so hover still works
  const brush = d3.brush()
    .extent([[40, 10], [width - 10, height - 30]])
    .on("start brush end", (event) => {
      const selection = event.selection;
      d3.selectAll("circle").classed(
        "selected",
        commit => isCommitSelected(selection, commit, xScale, yScale)
      );
      renderSelectionCount(selection, commits, xScale, yScale);
      renderLanguageBreakdown(selection, commits, xScale, yScale);
    });

  svg.call(brush);
  svg.selectAll(".dots, .overlay ~ *").raise();
}
    



let data = await loadData();
let commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

