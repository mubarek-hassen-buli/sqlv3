"use client";

import React from 'react';
import { useDiagramStore } from '@/store/diagram.store';
import { OperatorType } from '@/lib/sql/types';

// Color mapping for different operator types
const OPERATOR_COLORS: Record<OperatorType, { bg: string; border: string; icon: string }> = {
  [OperatorType.TABLE_SCAN]: { bg: '#1e3a5f', border: '#3b82f6', icon: '📊' },
  [OperatorType.VALUES]: { bg: '#1e3a5f', border: '#3b82f6', icon: '📋' },
  [OperatorType.SUBQUERY_SCAN]: { bg: '#2d1f4f', border: '#8b5cf6', icon: '🔍' },
  [OperatorType.FILTER]: { bg: '#4a2c2a', border: '#ef4444', icon: '🔻' },
  [OperatorType.PROJECT]: { bg: '#2d4a3e', border: '#22c55e', icon: '📤' },
  [OperatorType.JOIN]: { bg: '#4a3f2a', border: '#eab308', icon: '🔗' },
  [OperatorType.AGGREGATE]: { bg: '#3f2d4a', border: '#a855f7', icon: '∑' },
  [OperatorType.SORT]: { bg: '#2a3f4a', border: '#06b6d4', icon: '↕️' },
  [OperatorType.LIMIT]: { bg: '#4a2a3f', border: '#ec4899', icon: '✂️' },
  [OperatorType.RESULT]: { bg: '#2d4a2d', border: '#22c55e', icon: '✓' },
  [OperatorType.INSERT]: { bg: '#2d4a3e', border: '#22c55e', icon: '➕' },
  [OperatorType.UPDATE]: { bg: '#4a3f2a', border: '#eab308', icon: '✏️' },
  [OperatorType.DELETE]: { bg: '#4a2c2a', border: '#ef4444', icon: '🗑️' },
  [OperatorType.CREATE_TABLE]: { bg: '#1e3a5f', border: '#3b82f6', icon: '🏗️' },
  [OperatorType.CREATE_VIEW]: { bg: '#1e3a5f', border: '#3b82f6', icon: '👁️' },
};

function getOperatorLabel(node: any): string {
  switch (node.type) {
    case OperatorType.TABLE_SCAN:
      return `SCAN: ${node.tableName || 'table'}`;
    case OperatorType.FILTER:
      return `FILTER`;
    case OperatorType.PROJECT:
      return `SELECT`;
    case OperatorType.JOIN:
      return `${node.joinType || ''} JOIN`;
    case OperatorType.AGGREGATE:
      return `AGGREGATE`;
    case OperatorType.SORT:
      return `ORDER BY`;
    case OperatorType.LIMIT:
      return `LIMIT ${node.limit || ''}`;
    default:
      return node.type;
  }
}

function getOperatorDetail(node: any): string {
  switch (node.type) {
    case OperatorType.FILTER:
      return node.condition || '';
    case OperatorType.JOIN:
      return node.onCondition || '';
    case OperatorType.AGGREGATE:
      return node.groupByColumns?.join(', ') || '';
    case OperatorType.SORT:
      return node.orderBy?.join(', ') || '';
    default:
      return '';
  }
}

export function DiagramCanvas() {
  const { layout, isAnalyzing, error } = useDiagramStore();

  if (isAnalyzing) {
    return (
      <div className="h-full w-full border-l border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-400 animate-pulse">Building Logical Plan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full border-l border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <div className="text-red-400 text-center p-4 max-w-md">
          <div className="mb-2 text-lg">⚠️ Analysis Error</div>
          <div className="text-sm text-zinc-400 font-mono bg-zinc-950 p-3 rounded">{error}</div>
        </div>
      </div>
    );
  }

  if (!layout || layout.nodes.length === 0) {
    return (
      <div className="h-full w-full border-l border-zinc-800 bg-zinc-900 flex items-center justify-center">
        <div className="text-zinc-500 text-center">
          <div className="text-4xl mb-4">🔬</div>
          <div className="mb-2 font-medium">No Logical Plan</div>
          <div className="text-sm text-zinc-600">Click "Run Analysis" to visualize data flow</div>
        </div>
      </div>
    );
  }

  // Calculate viewBox
  const padding = 60;
  const minX = Math.min(...layout.nodes.map(n => n.x)) - padding;
  const minY = Math.min(...layout.nodes.map(n => n.y)) - padding;
  const maxX = Math.max(...layout.nodes.map(n => n.x + n.width)) + padding;
  const maxY = Math.max(...layout.nodes.map(n => n.y + n.height)) + padding;

  return (
    <div className="h-full w-full border-l border-zinc-800 bg-zinc-950 overflow-auto">
      <svg
        width="100%"
        height="100%"
        viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
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
          if (!edge.sections || edge.sections.length === 0) return null;
          const section = edge.sections[0];
          
          let pathD = `M ${section.startPoint.x} ${section.startPoint.y}`;
          if (section.bendPoints) {
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
              stroke="#4b5563"
              strokeWidth="2"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Nodes */}
        {layout.nodes.map(node => {
          const colors = OPERATOR_COLORS[node.type as OperatorType] || { bg: '#1f2937', border: '#6b7280', icon: '?' };
          const label = getOperatorLabel(node);
          const detail = getOperatorDetail(node);
          const columns = node.schema?.columns?.slice(0, 4) || []; // Show max 4 columns
          const hasMoreCols = (node.schema?.columns?.length || 0) > 4;

          return (
            <g key={node.id}>
              {/* Node Background */}
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx="8"
                ry="8"
                fill={colors.bg}
                stroke={colors.border}
                strokeWidth="2"
              />
              
              {/* Header */}
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={28}
                rx="8"
                ry="8"
                fill={colors.border}
                opacity="0.3"
              />
              
              {/* Icon + Label */}
              <text
                x={node.x + 12}
                y={node.y + 19}
                fill="#e5e7eb"
                fontSize="12"
                fontWeight="600"
                fontFamily="monospace"
              >
                {colors.icon} {label}
              </text>

              {/* Detail (condition, etc) */}
              {detail && (
                <text
                  x={node.x + 12}
                  y={node.y + 44}
                  fill="#9ca3af"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {detail.length > 25 ? detail.slice(0, 25) + '...' : detail}
                </text>
              )}

              {/* Schema Columns */}
              {columns.map((col, i) => (
                <text
                  key={i}
                  x={node.x + 12}
                  y={node.y + (detail ? 62 : 48) + i * 16}
                  fill="#6b7280"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  • {col.name}
                </text>
              ))}
              
              {hasMoreCols && (
                <text
                  x={node.x + 12}
                  y={node.y + (detail ? 62 : 48) + columns.length * 16}
                  fill="#4b5563"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  ... +{(node.schema?.columns?.length || 0) - 4} more
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
