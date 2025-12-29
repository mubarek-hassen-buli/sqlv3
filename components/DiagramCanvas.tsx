"use client";

import React, { useCallback, useMemo, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useDiagramStore } from '@/store/diagram.store';
import { RelationNode, OperatorNode } from '@/lib/sql/types';
import RelationNodeComponent from './nodes/RelationNode';
import OperatorNodeComponent from './nodes/OperatorNode';

// Register custom node types
const nodeTypes = {
  relation: RelationNodeComponent,
  operator: OperatorNodeComponent
};

export function DiagramCanvas() {
  const { layout, isAnalyzing, error } = useDiagramStore();
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Convert our layout to React Flow format
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!layout || !layout.nodes.length) {
      return { initialNodes: [], initialEdges: [] };
    }

    const nodes: Node[] = layout.nodes.map(node => ({
      id: node.id,
      type: node.nodeType === 'Relation' ? 'relation' : 'operator',
      position: { x: node.x, y: node.y },
      data: node,
      draggable: true
    }));

    const edges: Edge[] = layout.edges.map(edge => ({
      id: edge.id,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      animated: selectedNode ? (edge.from === selectedNode || edge.to === selectedNode) : false,
      style: {
        stroke: selectedNode && (edge.from === selectedNode || edge.to === selectedNode) 
          ? '#3b82f6' 
          : '#6b7280',
        strokeWidth: selectedNode && (edge.from === selectedNode || edge.to === selectedNode) 
          ? 3 
          : 2
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selectedNode && (edge.from === selectedNode || edge.to === selectedNode) 
          ? '#3b82f6' 
          : '#6b7280'
      }
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [layout, selectedNode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when layout changes
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(prev => prev === node.id ? null : node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isAnalyzing) {
    return (
      <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse text-lg">Building Logical Plan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-red-400 text-center p-6 max-w-md">
          <div className="text-2xl mb-3">⚠️</div>
          <div className="text-lg font-medium mb-2">Analysis Error</div>
          <div className="text-sm font-mono bg-zinc-900 p-4 rounded-lg border border-zinc-800">{error}</div>
        </div>
      </div>
    );
  }

  if (!layout || layout.nodes.length === 0) {
    return (
      <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-center">
          <div className="text-5xl mb-4">🔬</div>
          <div className="text-lg font-medium mb-1">No Diagram</div>
          <div className="text-sm text-zinc-600">Click "Run Analysis" to visualize data flow</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#374151" gap={20} size={1} />
        <Controls 
          className="!bg-zinc-800 !border-zinc-700 !rounded-lg"
          showInteractive={false}
        />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'operator') return '#6b7280';
            const data = node.data as RelationNode;
            if (data.isBase) return '#22c55e';
            if (data.isFinal) return '#ef4444';
            return '#6b7280';
          }}
          className="!bg-zinc-900 !border-zinc-700 !rounded-lg"
          maskColor="rgba(0,0,0,0.8)"
        />
      </ReactFlow>
    </div>
  );
}
