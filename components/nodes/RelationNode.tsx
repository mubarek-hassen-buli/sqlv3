"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RelationNode as RelationNodeData } from '@/lib/sql/types';

interface RelationNodeProps extends NodeProps {
  data: RelationNodeData;
}

function RelationNodeComponent({ data, selected }: RelationNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Color based on type
  let borderColor = '#6b7280'; // gray for intermediate
  let bgColor = '#1f2937';
  let label = 'Intermediate';
  
  if (data.isBase) {
    borderColor = '#22c55e'; // green for base tables
    bgColor = '#14532d';
    label = 'Source Table';
  }
  if (data.isFinal) {
    borderColor = '#ef4444'; // red for final result
    bgColor = '#450a0a';
    label = 'Final Result';
  }

  const visibleCols = data.columns.slice(0, 5);
  const hasMore = data.columns.length > 5;

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Input Handle */}
      <Handle type="target" position={Position.Top} className="!bg-zinc-500" />
      
      {/* Main Node */}
      <div
        className="rounded-lg transition-all cursor-grab active:cursor-grabbing"
        style={{
          backgroundColor: bgColor,
          border: `2px solid ${selected ? '#3b82f6' : borderColor}`,
          boxShadow: selected ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none',
          minWidth: 180,
          padding: '8px 12px'
        }}
      >
        {/* Header */}
        <div 
          className="text-white font-semibold text-sm pb-2 mb-2 border-b"
          style={{ borderColor: borderColor }}
        >
          📊 {data.name}
        </div>
        
        {/* Columns */}
        <div className="space-y-1">
          {visibleCols.map((col, i) => (
            <div key={i} className="text-xs text-zinc-400 font-mono flex justify-between">
              <span>{col.name}</span>
              <span className="text-zinc-600">{col.dataType || ''}</span>
            </div>
          ))}
          {hasMore && (
            <div className="text-xs text-zinc-600">+{data.columns.length - 5} more...</div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-500" />

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-full top-0 ml-3 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 min-w-[200px] shadow-xl">
          <div className="text-xs text-zinc-500 mb-1">{label}</div>
          <div className="text-sm font-semibold text-white mb-2">{data.name}</div>
          <div className="text-xs text-zinc-400 font-mono space-y-1">
            {data.columns.map((col, i) => (
              <div key={i} className="flex justify-between gap-4">
                <span>{col.name}</span>
                <span className="text-zinc-600">{col.source || col.table || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(RelationNodeComponent);
