'use client';

import React, { useCallback, useEffect, memo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface NetworkMember {
  id: string;
  name: string | null;
  email: string | null;
  monthlySales: number;
  joinedAt: Date;
  role: string;
  referralCount: number;
  children: NetworkMember[];
}

interface NetworkTreeProps {
  data: NetworkMember[];
}

const NetworkTree: React.FC<NetworkTreeProps> = memo(({ data }) => {
  // Rekurzív függvény a csomópontok és élek létrehozásához
  const createNodesAndEdges = useCallback((
    members: NetworkMember[],
    parentX: number = 0,
    parentY: number = 0,
    level: number = 0,
    parentId?: string
  ): { nodes: Node[]; edges: Edge[] } => {
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    const horizontalSpacing = 200;
    const verticalSpacing = 100;

    members.forEach((member, index) => {
      const x = parentX + (index - (members.length - 1) / 2) * horizontalSpacing;
      const y = parentY + verticalSpacing;

      // Csomópont létrehozása
      nodes.push({
        id: member.id,
        position: { x, y },
        data: {
          label: (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
              <div className="font-semibold text-gray-800">{member.name || 'Névtelen'}</div>
              <div className="text-sm text-gray-600">{member.email}</div>
              <div className="text-sm text-gray-600">
                Havi forgalom: {member.monthlySales.toLocaleString('hu-HU')} Ft
              </div>
              <div className="text-xs text-gray-500">
                Csatlakozott: {new Date(member.joinedAt).toLocaleDateString('hu-HU')}
              </div>
              {member.referralCount > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  Referáltak: {member.referralCount} fő
                </div>
              )}
            </div>
          ),
        },
        type: 'default',
      });

      // Él létrehozása a szülőhöz
      if (parentId) {
        edges.push({
          id: `${parentId}-${member.id}`,
          source: parentId,
          target: member.id,
          type: 'smoothstep',
        });
      }

      // Rekurzív hívás a gyerekekre
      if (member.children.length > 0) {
        const childrenResult = createNodesAndEdges(
          member.children,
          x,
          y,
          level + 1,
          member.id
        );
        nodes = [...nodes, ...childrenResult.nodes];
        edges = [...edges, ...childrenResult.edges];
      }
    });

    return { nodes, edges };
  }, []);

  // Kezdeti csomópontok és élek létrehozása
  const initialElements = createNodesAndEdges(data);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialElements.edges);

  // Frissítjük a csomópontokat és éleket, amikor az adatok változnak
  useEffect(() => {
    const newElements = createNodesAndEdges(data);
    setNodes(newElements.nodes);
    setEdges(newElements.edges);
  }, [data, createNodesAndEdges, setNodes, setEdges]);

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
});

NetworkTree.displayName = 'NetworkTree';

export default NetworkTree; 
