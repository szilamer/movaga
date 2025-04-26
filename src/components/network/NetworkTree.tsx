'use client';

import React, { useCallback } from 'react';
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

const NetworkTree: React.FC<NetworkTreeProps> = ({ data }) => {
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
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
              <div className="font-semibold text-gray-800">{member.name || 'Névtelen'}</div>
              <div className="text-sm text-gray-600">{member.email}</div>
              <div className="text-sm text-gray-600">
                Havi forgalom: {member.monthlySales.toLocaleString('hu-HU')} Ft
              </div>
              <div className="text-xs text-gray-500">
                Csatlakozott: {new Date(member.joinedAt).toLocaleDateString('hu-HU')}
              </div>
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

  return (
    <div style={{ width: '100%', height: '80vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default NetworkTree; 
