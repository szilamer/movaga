#!/usr/bin/env node

/**
 * Project Structure Visualizer using D3.js
 * 
 * This script generates a visualization of the project structure
 * as a collapsible tree diagram using D3.js.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const excludeDirs = ['.git', '.next', 'node_modules', '.cursor'];
const excludeFiles = ['.DS_Store'];
const outputFile = path.join(__dirname, '../public/d3-structure.html');

// Function to check if path should be ignored
function shouldIgnore(itemPath) {
  const basename = path.basename(itemPath);
  if (fs.statSync(itemPath).isDirectory()) {
    return excludeDirs.includes(basename);
  }
  return excludeFiles.includes(basename);
}

// Function to get the color for a node based on its path
function getNodeColor(itemPath) {
  if (itemPath === '.') return '#6366f1'; // Root - Indigo
  if (itemPath.startsWith('src')) return '#8b5cf6'; // Src - Violet
  if (itemPath.includes('/app')) return '#ec4899'; // App - Pink
  if (itemPath.includes('/components')) return '#f97316'; // Components - Orange
  if (itemPath.includes('/lib')) return '#14b8a6'; // Lib - Teal
  
  // Config files
  const basename = path.basename(itemPath);
  if (['package.json', 'tsconfig.json', 'next.config.js', 'tailwind.config.js', 'tailwind.config.ts', 'postcss.config.js'].includes(basename)) {
    return '#f59e0b'; // Config - Amber
  }
  
  return fs.statSync(itemPath).isDirectory() ? '#3b82f6' : '#64748b'; // Blue for dirs, Slate for files
}

// Function to generate the hierarchical project structure
function generateProjectStructure(rootDir) {
  function traverseDirectory(dir) {
    const stats = fs.statSync(dir);
    const isDirectory = stats.isDirectory();
    const basename = path.basename(dir);
    const name = dir === '.' ? 'Project Root' : basename;
    
    const node = {
      name,
      path: dir,
      children: [],
      color: getNodeColor(dir)
    };
    
    if (isDirectory) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = dir === '.' ? item : path.join(dir, item);
        
        if (!shouldIgnore(itemPath)) {
          try {
            const childNode = traverseDirectory(itemPath);
            node.children.push(childNode);
          } catch (error) {
            console.error(`Error processing ${itemPath}:`, error.message);
          }
        }
      });
    }
    
    return node;
  }
  
  return traverseDirectory(rootDir);
}

try {
  // Generate project structure
  console.log('Analyzing project structure for D3 visualization...');
  const data = generateProjectStructure('.');
  
  // Create HTML file with D3.js visualization
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movaga Project Structure (D3)</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      overflow: hidden;
      width: 100%;
      height: 100vh;
    }
    .node circle {
      stroke-width: 1.5px;
    }
    .node text {
      font-size: 12px;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    }
    .link {
      fill: none;
      stroke: #ccc;
      stroke-width: 1.5px;
    }
    .info-panel {
      position: absolute;
      top: 20px;
      left: 20px;
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      font-size: 14px;
      z-index: 100;
    }
    .legend {
      position: absolute;
      top: 20px;
      right: 20px;
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 100;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
      font-size: 12px;
    }
    .legend-color {
      width: 15px;
      height: 15px;
      margin-right: 8px;
      border-radius: 2px;
    }
    .controls {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 100;
    }
    button {
      background-color: #4f46e5;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
      margin-right: 5px;
    }
    button:hover {
      background-color: #4338ca;
    }
    #tooltip {
      position: absolute;
      background-color: rgba(255, 255, 255, 0.9);
      padding: 5px 10px;
      border-radius: 3px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      pointer-events: none;
      font-size: 12px;
      display: none;
      z-index: 200;
    }
  </style>
</head>
<body>
  <div id="tooltip"></div>
  <div class="info-panel">
    <h3>Movaga Project Structure</h3>
    <p>Click on nodes to expand/collapse. Hover for details.</p>
  </div>
  <div class="legend">
    <h3>Legend</h3>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #6366f1;"></div>
      <div>Project Root</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #8b5cf6;"></div>
      <div>Source Directory</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #ec4899;"></div>
      <div>App Directory</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #f97316;"></div>
      <div>Components Directory</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #14b8a6;"></div>
      <div>Library Directory</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #f59e0b;"></div>
      <div>Config File</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #3b82f6;"></div>
      <div>Regular Directory</div>
    </div>
    <div class="legend-item">
      <div class="legend-color" style="background-color: #64748b;"></div>
      <div>Regular File</div>
    </div>
  </div>
  <div class="controls">
    <button id="expandAll">Expand All</button>
    <button id="collapseAll">Collapse All</button>
    <button id="resetZoom">Reset View</button>
  </div>
  <svg id="tree-container" width="100%" height="100%"></svg>

  <script>
    // For debugging
    console.log("D3 visualization script starting");
    
    // Load project structure data
    const data = ${JSON.stringify(data)};
    console.log("Data loaded:", data);
    
    // Set up the dimensions and margins
    const margin = {top: 80, right: 120, bottom: 80, left: 120};
    const width = window.innerWidth - margin.left - margin.right;
    const height = window.innerHeight - margin.top - margin.bottom;
    
    // Create a SVG container
    const svg = d3.select("#tree-container")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);
      
    const g = svg.append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Create a zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Create a tree layout
    const tree = d3.tree()
      .size([height, width - 160]);
    
    // Convert the data into a hierarchy
    const root = d3.hierarchy(data);
    console.log("Hierarchy created:", root);
    
    // Initial position of the root node
    root.x0 = height / 2;
    root.y0 = 0;
    
    // Initialize the counter for generating unique IDs
    let i = 0;
    
    // Collapse all nodes initially except the root
    if (root.children) {
      root.children.forEach(collapse);
    }
    
    // Initial update to render the tree
    update(root);
    
    // Function to collapse a node
    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }
    
    // Function to update the tree
    function update(source) {
      console.log("Updating tree from source:", source);
      
      // Compute the new tree layout
      const treeData = tree(root);
      
      // Get the nodes and links from the hierarchy
      const nodes = treeData.descendants();
      const links = treeData.links();
      
      console.log("Nodes count:", nodes.length);
      console.log("Links count:", links.length);
      
      // Normalize for fixed-depth
      nodes.forEach(d => {
        d.y = d.depth * 180;
      });
      
      // Update the nodes
      const node = g.selectAll(".node")
        .data(nodes, d => d.id || (d.id = ++i));
      
      // Enter new nodes at the parent's previous position
      const nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => "translate(" + source.y0 + "," + source.x0 + ")")
        .on("click", function(event, d) {
          // Toggle children on click
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          update(d);
        })
        .on("mouseover", function(event, d) {
          const tooltip = d3.select("#tooltip");
          tooltip.style("display", "block")
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 30) + "px")
            .html("<strong>" + d.data.name + "</strong><br/>Path: " + d.data.path);
        })
        .on("mouseout", function() {
          d3.select("#tooltip").style("display", "none");
        });
      
      // Add Circle for the nodes
      nodeEnter.append("circle")
        .attr("r", 6)
        .style("fill", d => d._children ? d.data.color : "#fff")
        .style("stroke", d => d.data.color);
      
      // Add labels for the nodes
      nodeEnter.append("text")
        .attr("dy", ".35em")
        .attr("x", d => d.children || d._children ? -13 : 13)
        .attr("text-anchor", d => d.children || d._children ? "end" : "start")
        .text(d => d.data.name);
      
      // Update the node attributes
      const nodeUpdate = nodeEnter.merge(node);
      
      nodeUpdate.transition()
        .duration(750)
        .attr("transform", d => "translate(" + d.y + "," + d.x + ")");
      
      // Update the node attributes and style
      nodeUpdate.select("circle")
        .attr("r", 6)
        .style("fill", d => d._children ? d.data.color : "#fff")
        .style("stroke", d => d.data.color);
      
      // Remove any exiting nodes
      const nodeExit = node.exit().transition()
        .duration(750)
        .attr("transform", d => "translate(" + source.y + "," + source.x + ")")
        .remove();
      
      // On exit reduce the node circles size to 0
      nodeExit.select("circle")
        .attr("r", 1e-6);
      
      // On exit reduce the opacity of text labels
      nodeExit.select("text")
        .style("fill-opacity", 1e-6);
      
      // Update the links
      const link = g.selectAll(".link")
        .data(links, d => d.target.id);
      
      // Enter any new links at the parent's previous position
      const linkEnter = link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", d => {
          const o = {x: source.x0, y: source.y0};
          return diagonal(o, o);
        });
      
      // Update links
      linkEnter.merge(link).transition()
        .duration(750)
        .attr("d", d => diagonal(d.source, d.target));
      
      // Remove any exiting links
      link.exit().transition()
        .duration(750)
        .attr("d", d => {
          const o = {x: source.x, y: source.y};
          return diagonal(o, o);
        })
        .remove();
      
      // Store the old positions for transition
      nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
      
      // Creates a curved (diagonal) path from parent to the child nodes
      function diagonal(s, d) {
        return \`M \${s.y} \${s.x}
                C \${(s.y + d.y) / 2} \${s.x},
                  \${(s.y + d.y) / 2} \${d.x},
                  \${d.y} \${d.x}\`;
      }
    }
    
    // Handle control buttons
    document.getElementById('expandAll').addEventListener('click', () => {
      expandAll(root);
      update(root);
    });
    
    document.getElementById('collapseAll').addEventListener('click', () => {
      if (root.children) {
        root.children.forEach(collapse);
        update(root);
      }
    });
    
    document.getElementById('resetZoom').addEventListener('click', () => {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.translate(margin.left, margin.top)
      );
    });
    
    function expandAll(d) {
      if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      if (d.children) d.children.forEach(expandAll);
    }
    
    // Center the view initially
    svg.call(
      zoom.transform,
      d3.zoomIdentity.translate(margin.left, margin.top)
    );
    
    console.log("D3 visualization script completed");
  </script>
</body>
</html>
  `;
  
  // Create directory if it doesn't exist
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the HTML file
  fs.writeFileSync(outputFile, htmlContent);
  
  console.log(`D3.js project structure visualization created at: ${outputFile}`);
  console.log('Open this file in your browser to view the project structure.');
  
  // Try to open the file in the default browser
  try {
    const openCommand = process.platform === 'win32' ? 'start' : 
                        process.platform === 'darwin' ? 'open' : 'xdg-open';
    execSync(`${openCommand} ${outputFile}`);
  } catch (error) {
    console.log('Unable to open the file automatically. Please open it manually.');
  }
} catch (error) {
  console.error('Error generating D3 project structure visualization:', error);
} 