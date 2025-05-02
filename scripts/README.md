# Project Structure Visualization Scripts

This directory contains scripts for visualizing the structure of the Movaga project.

## Available Scripts

### 1. ReactFlow Visualizer

The ReactFlow visualizer creates an interactive graph representation of your project structure using React Flow.

**Usage:**
```bash
npm run visualize
```

or directly:
```bash
node scripts/project-structure-visualizer.js
```

This will generate an HTML file at `public/project-structure.html` and attempt to open it in your default browser.

**Features:**
- Color-coded nodes by file/directory type
- Draggable nodes for better organization
- Interactive controls (zoom, pan)
- File/directory details on hover
- Legend for color reference

### 2. D3.js Tree Visualizer

The D3.js tree visualizer creates a collapsible tree view of your project structure.

**Usage:**
```bash
npm run visualize:d3
```

or directly:
```bash
node scripts/project-structure-d3.js
```

This will generate an HTML file at `public/d3-structure.html` and attempt to open it in your default browser.

**Features:**
- Collapsible tree view
- Color-coded nodes by file/directory type
- Interactive zoom and pan
- Expand/collapse controls
- File path details on hover
- Legend for color reference

### 3. Simple HTML Visualizer (Recommended)

If you experience issues with the other visualizers, this simple HTML-based visualizer provides a lightweight alternative that works in any browser without advanced JavaScript features.

**Usage:**
```bash
npm run visualize:html
```

or directly:
```bash
node scripts/project-structure-html.js
```

This will generate an HTML file at `public/simple-structure.html` and attempt to open it in your default browser.

**Features:**
- Simple folder/file tree view
- Color-coded icons by file/directory type
- Expand/collapse folders with a click
- Search functionality with highlighting
- Keyboard shortcuts (Ctrl+F or Cmd+F for search)
- Directories sorted before files
- Enhanced usability with hover effects

## Configuration

All scripts can be configured by editing the respective files:

- Excluded directories: Update the `excludeDirs` array
- Excluded files: Update the `excludeFiles` array
- Colors: Modify the `colors` object to change the color scheme

## Notes

- The generated HTML files can be shared or deployed as static files
- The visualizations are generated on-demand and reflect the current state of the project
- Large project structures may take longer to render
- The Simple HTML Visualizer is recommended for the most reliable experience

## Requirements

No additional dependencies are required as the scripts use CDN-hosted libraries. 