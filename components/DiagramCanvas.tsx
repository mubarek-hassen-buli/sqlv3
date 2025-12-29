"use client";

import React from 'react';
import { useDiagramStore } from '@/store/diagram.store';
import { RelationNode, OperatorNode } from '@/lib/sql/types';
import { LayoutNode } from '@/lib/graph/types';

// Operator icons
const OP_ICONS: Record<string, string> = {
  'Scan': '📥',
  'Filter': '🔻',
  'Project': '📤',
  'Join': '🔗',
  'Aggregate': '∑',
  'Sort': '↕️',
  'Limit': '✂️',
  'Insert': '➕',
  'Update': '✏️',
  'Delete': '🗑️'
};

export function DiagramCanvas() {
  const { layout, isAnalyzing, error } = useDiagramStore();

  if (isAnalyzing) {
    return (
      <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Building Logical Plan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-red-400 text-center p-4 max-w-md">
          <div className="text-lg mb-2">⚠️ Error</div>
          <div className="text-sm font-mono bg-zinc-900 p-3 rounded">{error}</div>
        </div>
      </div>
    );
  }

  if (!layout || layout.nodes.length === 0) {
    return (
      <div className="h-full w-full bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-center">
          <div className="text-4xl mb-4">🔬</div>
          <div className="font-medium">No Diagram</div>
          <div className="text-sm text-zinc-600 mt-1">Click "Run Analysis" to visualize data flow</div>
        </div>
      </div>
    );
  }

  // Calculate viewBox
  const pad = 40;
  const minX = Math.min(...layout.nodes.map(n => n.x)) - pad;
  const minY = Math.min(...layout.nodes.map(n => n.y)) - pad;
  const maxX = Math.max(...layout.nodes.map(n => n.x + n.width)) + pad;
  const maxY = Math.max(...layout.nodes.map(n => n.y + n.height)) + pad;

  return (
    <div className="h-full w-full bg-zinc-950 overflow-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
        preserveAspectRatio="xMidYMid meet"
        className="min-h-full"
      >
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
        </defs>

        {/* Edges */}
        {layout.edges.map(edge => {
          if (!edge.sections?.length) return null;
          const s = edge.sections[0];
          let d = `M ${s.startPoint.x} ${s.startPoint.y}`;
          if (s.bendPoints) {
            s.bendPoints.forEach(bp => { d += ` L ${bp.x} ${bp.y}`; });
          }
          d += ` L ${s.endPoint.x} ${s.endPoint.y}`;
          return <path key={edge.id} d={d} fill="none" stroke="#4b5563" strokeWidth="2" markerEnd="url(#arrow)" />;
        })}

        {/* Nodes */}
        {layout.nodes.map(node => {
          if (node.nodeType === 'Relation') {
            return <RelationBox key={node.id} node={node as LayoutNode & RelationNode} />;
          } else {
            return <OperatorBox key={node.id} node={node as LayoutNode & OperatorNode} />;
          }
        })}
      </svg>
    </div>
  );
}

// ==================== RELATION BOX (BIG) ====================
function RelationBox({ node }: { node: LayoutNode & RelationNode }) {
  // Color based on type
  let borderColor = '#6b7280'; // gray for intermediate
  let bgColor = '#1f2937';
  
  if (node.isBase) {
    borderColor = '#22c55e'; // green for base tables
    bgColor = '#14532d';
  }
  if (node.isFinal) {
    borderColor = '#ef4444'; // red for final result
    bgColor = '#450a0a';
  }

  const cols = node.columns.slice(0, 5); // Max 5 columns displayed
  const hasMore = node.columns.length > 5;

  return (
    <g>
      {/* Main box */}
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx="6"
        fill={bgColor}
        stroke={borderColor}
        strokeWidth="2"
      />
      
      {/* Header */}
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={24}
        rx="6"
        fill={borderColor}
        opacity="0.3"
      />
      <text x={node.x + 10} y={node.y + 17} fill="#fff" fontSize="12" fontWeight="600">
        {node.name}
      </text>
      
      {/* Columns */}
      {cols.map((col, i) => (
        <text
          key={i}
          x={node.x + 10}
          y={node.y + 40 + i * 16}
          fill="#9ca3af"
          fontSize="10"
          fontFamily="monospace"
        >
          {col.name} {col.dataType ? `(${col.dataType})` : ''}
        </text>
      ))}
      
      {hasMore && (
        <text x={node.x + 10} y={node.y + 40 + cols.length * 16} fill="#6b7280" fontSize="10">
          ... +{node.columns.length - 5} more
        </text>
      )}
    </g>
  );
}

// ==================== OPERATOR BOX (SMALL) ====================
function OperatorBox({ node }: { node: LayoutNode & OperatorNode }) {
  const icon = OP_ICONS[node.operator] || '⚙️';
  
  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        rx="18"
        fill="#374151"
        stroke="#6b7280"
        strokeWidth="1"
      />
      <text
        x={node.x + node.width / 2}
        y={node.y + node.height / 2 + 4}
        fill="#e5e7eb"
        fontSize="11"
        fontWeight="500"
        textAnchor="middle"
      >
        {icon} {node.operator}
      </text>
    </g>
  );
}
