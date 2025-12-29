"use client";

import React, { useEffect, useRef } from 'react';
import { useDiagramStore } from '@/store/diagram.store';

export function DiagramCanvas() {
  const { layout, isAnalyzing, error } = useDiagramStore();
  const containerRef = useRef<HTMLDivElement>(null);

  if (isAnalyzing) {
    return (
      <div className="h-full w-full border-l border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Analyzing...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full border-l border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <div className="text-red-400 text-center p-4">
          <div className="mb-2">Error</div>
          <div className="text-sm text-zinc-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!layout || layout.nodes.length === 0) {
    return (
      <div className="h-full w-full border-l border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-500 text-center">
          <div className="mb-2">No diagram</div>
          <div className="text-sm">Click "Run Analysis" to visualize your SQL</div>
        </div>
      </div>
    );
  }

  // Calculate bounds for viewBox
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  layout.nodes.forEach(node => {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });

  const padding = 50;
  const viewBoxX = minX - padding;
  const viewBoxY = minY - padding;
  const viewBoxWidth = (maxX - minX) + padding * 2;
  const viewBoxHeight = (maxY - minY) + padding * 2;

  return (
    <div ref={containerRef} className="h-full w-full border-l border-zinc-800 bg-zinc-900 overflow-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="min-h-full"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>

        {/* Edges */}
        {layout.edges.map(edge => {
          if (edge.sections.length === 0) return null;
          const section = edge.sections[0];
          
          let pathD = `M ${section.startPoint.x} ${section.startPoint.y}`;
          
          if (section.bendPoints && section.bendPoints.length > 0) {
            section.bendPoints.forEach(bp => {
              pathD += ` L ${bp.x} ${bp.y}`;
            });
          }
          
          pathD += ` L ${section.endPoint.x} ${section.endPoint.y}`;

          return (
            <path
              key={edge.id}
              d={pathD}
              fill="none"
              stroke="#6b7280"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {layout.nodes.map(node => (
          <g key={node.id}>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              rx="8"
              ry="8"
              fill="#1f2937"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <text
              x={node.x + node.width / 2}
              y={node.y + node.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#e5e7eb"
              fontSize="14"
              fontFamily="monospace"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
