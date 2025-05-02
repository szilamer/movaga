#!/usr/bin/env node

/**
 * Project Structure Visualizer
 * 
 * This script generates a visual representation of the project structure
 * using React Flow. It creates an HTML file that can be opened in a browser
 * to view the project structure in a hierarchical graph.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const excludeDirs = ['.git', '.next', 'node_modules', '.cursor'];
const excludeFiles = ['.DS_Store'];
const outputFile = path.join(__dirname, '../public/project-structure.html');

// Colors and styling
const colors = {
  root: '#6366f1', // Indigo
  srcDir: '#8b5cf6', // Violet
  appDir: '#ec4899', // Pink
  componentDir: '#f97316', // Orange
  libDir: '#14b8a6', // Teal
  configFile: '#f59e0b', // Amber
  normalFile: '#64748b', // Slate
  normalDir: '#3b82f6', // Blue
};

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
  const basename = path.basename(itemPath);
  
  if (itemPath === '.') return colors.root;
  if (itemPath.startsWith('src')) return colors.srcDir;
  if (itemPath.includes('/app')) return colors.appDir;
  if (itemPath.includes('/components')) return colors.componentDir;
  if (itemPath.includes('/lib')) return colors.libDir;
  
  // Config and important files
  if ([
    'package.json', 'tsconfig.json', 'next.config.js', 
    'tailwind.config.js', 'tailwind.config.ts', 'postcss.config.js'
  ].includes(basename)) {
    return colors.configFile;
  }
  
  return fs.statSync(itemPath).isDirectory() ? colors.normalDir : colors.normalFile;
}

// Function to generate a unique node ID
function generateNodeId(itemPath) {
  return itemPath === '.' ? 'root' : itemPath.replace(/[\/\\. ]/g, '_');
}

// Function to generate the project structure data
function generateProjectStructure(rootDir) {
  const nodes = [];
  const edges = [];
  let nodeId = 0;
  
  function traverse(dir, parentId = null) {
    const relativePath = dir === '.' ? dir : dir;
    const currentId = generateNodeId(relativePath);
    const dirName = path.basename(dir) || 'Project Root';
    const isDir = dir === '.' || fs.statSync(dir).isDirectory();
    
    // Add node
    nodes.push({
      id: currentId,
      data: { 
        label: dirName,
        path: relativePath,
        isDirectory: isDir,
      },
      position: { x: 0, y: 0 }, // Will be calculated by React Flow
      style: {
        backgroundColor: getNodeColor(relativePath),
        color: '#ffffff',
        border: '1px solid #ffffff',
        borderRadius: 5,
        width: 150,
        padding: 10,
      }
    });
    
    // Add edge from parent
    if (parentId) {
      edges.push({
        id: `e${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#94a3b8' }
      });
    }
    
    // If it's a directory, traverse its contents
    if (isDir) {
      const items = fs.readdirSync(dir);
      
      items.forEach(item => {
        const itemPath = dir === '.' ? item : path.join(dir, item);
        
        if (!shouldIgnore(itemPath)) {
          traverse(itemPath, currentId);
        }
      });
    }
  }
  
  // Start traversal from root
  traverse(rootDir);
  
  return { nodes, edges };
}

try {
  // Generate project structure
  console.log('Analyzing project structure...');
  const { nodes, edges } = generateProjectStructure('.');
  
  // Create HTML file with React Flow
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Movaga Project Structure</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/reactflow@11.11.4/dist/reactflow.min.js"></script>
  <link href="https://unpkg.com/reactflow@11.11.4/dist/style.css" rel="stylesheet" />
  <style>
    body, html, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    }
    .controls {
      position: absolute;
      bottom: 20px;
      left: 20px;
      z-index: 10;
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .controls button {
      margin-right: 5px;
      padding: 5px 10px;
      background-color: #4f46e5;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .controls button:hover {
      background-color: #4338ca;
    }
    .legend {
      position: absolute;
      top: 20px;
      right: 20px;
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 10;
    }
    .legend-item {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }
    .legend-color {
      width: 20px;
      height: 20px;
      margin-right: 10px;
      border-radius: 3px;
    }
    .reactflow-node {
      font-size: 12px;
      border-radius: 3px;
      width: auto;
      min-width: 130px;
      padding: 3px 5px;
      text-align: center;
    }
    .info-panel {
      position: absolute;
      top: 20px;
      left: 20px;
      background-color: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      z-index: 10;
      max-width: 300px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const { useCallback, useState, useEffect } = React;
    const { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, useReactFlow } = ReactFlowRenderer;
    
    // Project structure data
    const initialNodes = ${JSON.stringify(nodes)};
    const initialEdges = ${JSON.stringify(edges)};
    
    // Legend data
    const legendItems = [
      { color: '${colors.root}', label: 'Project Root' },
      { color: '${colors.srcDir}', label: 'Source Directory' },
      { color: '${colors.appDir}', label: 'App Directory' },
      { color: '${colors.componentDir}', label: 'Components Directory' },
      { color: '${colors.libDir}', label: 'Library Directory' },
      { color: '${colors.configFile}', label: 'Config File' },
      { color: '${colors.normalFile}', label: 'Regular File' },
      { color: '${colors.normalDir}', label: 'Regular Directory' },
    ];
    
    // Flow component
    function Flow() {
      const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
      const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
      const [selectedNode, setSelectedNode] = useState(null);
      const reactFlow = useReactFlow();
      
      // Layout the graph using dagre when component mounts
      useEffect(() => {
        const layoutNodes = nodes.map((node, index) => ({
          ...node,
          position: { x: Math.random() * 800, y: Math.random() * 800 },
        }));
        
        setNodes(layoutNodes);
        
        // Center the view
        window.requestAnimationFrame(() => {
          reactFlow.fitView({ padding: 0.2 });
        });
      }, []);
      
      const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
      }, []);
      
      const handleFitView = () => {
        reactFlow.fitView({ padding: 0.2 });
      };
      
      return (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-right"
          nodesDraggable={true}
        >
          <Background color="#f1f5f9" gap={16} />
          <Controls />
          <MiniMap 
            nodeStrokeColor={(n) => n.style?.backgroundColor || '#eee'}
            nodeColor={(n) => n.style?.backgroundColor || '#eee'}
            nodeBorderRadius={2}
          />
          
          <div className="controls">
            <button onClick={handleFitView}>Fit View</button>
          </div>
          
          <div className="legend">
            <h3>Legend</h3>
            {legendItems.map((item, i) => (
              <div className="legend-item" key={i}>
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <div>{item.label}</div>
              </div>
            ))}
          </div>
          
          {selectedNode && (
            <div className="info-panel">
              <h3>{selectedNode.data.label}</h3>
              <p>Path: {selectedNode.data.path}</p>
              <p>Type: {selectedNode.data.isDirectory ? 'Directory' : 'File'}</p>
            </div>
          )}
        </ReactFlow>
      );
    }
    
    // Wrap Flow with ReactFlow provider
    function App() {
      return (
        <ReactFlowRenderer.ReactFlowProvider>
          <Flow />
        </ReactFlowRenderer.ReactFlowProvider>
      );
    }
    
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
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
  
  console.log(`Project structure visualization created at: ${outputFile}`);
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
  console.error('Error generating project structure visualization:', error);
} 