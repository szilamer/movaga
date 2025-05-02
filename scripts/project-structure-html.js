#!/usr/bin/env node

/**
 * Project Structure Visualizer - Simple HTML Version
 * 
 * This script generates a visual representation of the project structure
 * using basic HTML and CSS. It creates an HTML file that can be opened in any browser.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const excludeDirs = ['.git', '.next', 'node_modules', '.cursor'];
const excludeFiles = ['.DS_Store'];
const outputFile = path.join(__dirname, '../public/simple-structure.html');

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

// Generate HTML for the directory structure
function generateHtmlStructure(rootDir, currentIndent = 0) {
  let html = '';
  const isDir = rootDir === '.' || fs.statSync(rootDir).isDirectory();
  const basename = path.basename(rootDir) || 'Project Root';
  const color = getNodeColor(rootDir);
  
  // Generate the HTML for this node
  const iconType = isDir ? 'folder' : 'file';
  const padding = currentIndent * 20;
  
  html += `<div class="node" style="padding-left: ${padding}px;">
    <div class="node-content" onclick="toggleFolder(this)" data-is-folder="${isDir}">
      <span class="icon ${iconType}" style="background-color: ${color};"></span>
      <span class="name">${basename}</span>
      <span class="path">${rootDir}</span>
    </div>`;
  
  // If it's a directory, process its contents
  if (isDir) {
    html += `<div class="children" ${currentIndent === 0 ? '' : 'style="display: none;"'}>`;
    
    const items = fs.readdirSync(rootDir);
    const sortedItems = items.sort((a, b) => {
      const aIsDir = fs.statSync(rootDir === '.' ? a : path.join(rootDir, a)).isDirectory();
      const bIsDir = fs.statSync(rootDir === '.' ? b : path.join(rootDir, b)).isDirectory();
      
      // Directories first, then files, both alphabetically
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b);
    });
    
    sortedItems.forEach(item => {
      const itemPath = rootDir === '.' ? item : path.join(rootDir, item);
      
      if (!shouldIgnore(itemPath)) {
        try {
          html += generateHtmlStructure(itemPath, currentIndent + 1);
        } catch (error) {
          console.error(`Error processing ${itemPath}:`, error.message);
        }
      }
    });
    
    html += '</div>';
  }
  
  html += '</div>';
  
  return html;
}

try {
  // Generate project structure
  console.log('Analyzing project structure for HTML visualization...');
  const structureHtml = generateHtmlStructure('.');
  
  // Create HTML file
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movaga Project Structure</title>
  <style>
    body {
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f8fafc;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      padding: 20px;
    }
    h1 {
      color: #1e293b;
      text-align: center;
      margin-bottom: 30px;
    }
    .tree-container {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px;
      max-height: 80vh;
      overflow: auto;
    }
    .node {
      margin: 2px 0;
    }
    .node-content {
      display: flex;
      align-items: center;
      padding: 5px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    .node-content:hover {
      background-color: #f1f5f9;
    }
    .icon {
      width: 18px;
      height: 18px;
      display: inline-block;
      border-radius: 3px;
      margin-right: 8px;
      position: relative;
    }
    .icon.folder:after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 8px;
      background-color: rgba(255, 255, 255, 0.7);
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E") no-repeat center center / contain;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E") no-repeat center center / contain;
    }
    .icon.file:after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background-color: rgba(255, 255, 255, 0.7);
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3C/svg%3E") no-repeat center center / contain;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'%3E%3C/path%3E%3Cpolyline points='14 2 14 8 20 8'%3E%3C/polyline%3E%3C/svg%3E") no-repeat center center / contain;
    }
    .name {
      font-size: 14px;
      margin-right: 10px;
      white-space: nowrap;
    }
    .path {
      font-size: 12px;
      color: #64748b;
      margin-left: auto;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background-color: #f8fafc;
    }
    .legend-item {
      display: flex;
      align-items: center;
    }
    .legend-color {
      width: 15px;
      height: 15px;
      border-radius: 3px;
      margin-right: 8px;
    }
    .legend-label {
      font-size: 13px;
    }
    .controls {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    button {
      background-color: #4f46e5;
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    button:hover {
      background-color: #4338ca;
    }
    .search-container {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
    }
    .search-container input {
      flex-grow: 1;
      padding: 8px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      font-size: 14px;
    }
    .filtered-out {
      display: none !important;
    }
    .highlight {
      background-color: #fef3c7;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Movaga Project Structure</h1>
    
    <div class="search-container">
      <input type="text" id="searchInput" placeholder="Search files and directories..." />
      <button onclick="searchStructure()">Search</button>
      <button onclick="resetSearch()">Reset</button>
    </div>
    
    <div class="controls">
      <button onclick="expandAll()">Expand All</button>
      <button onclick="collapseAll()">Collapse All</button>
    </div>
    
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color" style="background-color: #6366f1;"></div>
        <div class="legend-label">Project Root</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #8b5cf6;"></div>
        <div class="legend-label">Source Directory</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #ec4899;"></div>
        <div class="legend-label">App Directory</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #f97316;"></div>
        <div class="legend-label">Components Directory</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #14b8a6;"></div>
        <div class="legend-label">Library Directory</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #f59e0b;"></div>
        <div class="legend-label">Config File</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #3b82f6;"></div>
        <div class="legend-label">Regular Directory</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background-color: #64748b;"></div>
        <div class="legend-label">Regular File</div>
      </div>
    </div>
    
    <div class="tree-container">
      ${structureHtml}
    </div>
  </div>
  
  <script>
    // Toggle folder expansion
    function toggleFolder(element) {
      const isFolder = element.getAttribute('data-is-folder') === 'true';
      if (isFolder) {
        const children = element.parentNode.querySelector('.children');
        if (children) {
          children.style.display = children.style.display === 'none' ? 'block' : 'none';
        }
      }
    }
    
    // Expand all folders
    function expandAll() {
      document.querySelectorAll('.children').forEach(el => {
        el.style.display = 'block';
      });
    }
    
    // Collapse all folders
    function collapseAll() {
      document.querySelectorAll('.children').forEach((el, index) => {
        // Keep the root level expanded
        if (index > 0) {
          el.style.display = 'none';
        }
      });
    }
    
    // Search functionality
    function searchStructure() {
      resetSearch(); // Clear previous search
      
      const searchTerm = document.getElementById('searchInput').value.toLowerCase();
      if (!searchTerm) return;
      
      const nodes = document.querySelectorAll('.node-content');
      let hasMatch = false;
      
      nodes.forEach(node => {
        const name = node.querySelector('.name').textContent.toLowerCase();
        const path = node.querySelector('.path').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || path.includes(searchTerm)) {
          // Highlight this node
          if (name.includes(searchTerm)) {
            const nameEl = node.querySelector('.name');
            nameEl.innerHTML = nameEl.textContent.replace(
              new RegExp(searchTerm, 'gi'),
              match => \`<span class="highlight">\${match}</span>\`
            );
          }
          
          // Ensure this node and all its parents are visible
          let current = node;
          while (current) {
            if (current.classList.contains('children')) {
              current.style.display = 'block';
            }
            current = current.parentElement;
          }
          
          hasMatch = true;
        }
      });
      
      if (!hasMatch) {
        alert('No matches found for: ' + searchTerm);
      }
    }
    
    // Reset search
    function resetSearch() {
      // Remove all highlights
      document.querySelectorAll('.highlight').forEach(el => {
        const parent = el.parentNode;
        parent.textContent = parent.textContent;
      });
      
      // Reset the search input
      document.getElementById('searchInput').value = '';
      
      // Show all nodes again
      document.querySelectorAll('.node').forEach(el => {
        el.classList.remove('filtered-out');
      });
    }
    
    // Add keyboard shortcut for search
    document.addEventListener('keydown', function(event) {
      // Ctrl+F or Cmd+F
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        document.getElementById('searchInput').focus();
      }
    });
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
  
  console.log(`Simple HTML project structure visualization created at: ${outputFile}`);
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
  console.error('Error generating HTML project structure visualization:', error);
} 