"use client";

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { OperatorNode as OperatorNodeData } from '@/lib/sql/types';

interface OperatorNodeProps extends NodeProps {
  data: OperatorNodeData;
}

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

function OperatorNodeComponent({ data, selected }: OperatorNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const icon = OP_ICONS[data.operator] || '⚙️';

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Input Handle(s) */}
      <Handle type="target" position={Position.Top} className="!bg-zinc-500" />
      
      {/* Main Node */}
      <div
        className="rounded-full px-4 py-2 cursor-grab active:cursor-grabbing transition-all"
        style={{
          backgroundColor: selected ? '#374151' : '#1f2937',
          border: `2px solid ${selected ? '#3b82f6' : '#6b7280'}`,
          boxShadow: selected ? '0 0 15px rgba(59, 130, 246, 0.4)' : 'none'
        }}
      >
        <div className="text-sm text-zinc-200 font-medium whitespace-nowrap">
          {icon} {data.operator}
        </div>
      </div>

      {/* Output Handle */}
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-500" />

      {/* Tooltip with details */}
      {showTooltip && (
        <div className="absolute left-full top-0 ml-3 z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-3 min-w-[220px] max-w-[350px] shadow-2xl ring-1 ring-white/10">
          <div className="text-xs text-blue-400 font-bold tracking-wider uppercase mb-1">Operator: {data.operator}</div>
          
          {data.explanation && (
            <div className="text-sm text-white font-medium mb-3 leading-relaxed">
              {data.explanation}
            </div>
          )}
          
          <div className="pt-2 border-t border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Technical Logic</div>
            <div className="text-xs text-zinc-400 font-mono bg-zinc-950 p-2 rounded border border-white/5 break-all max-h-32 overflow-auto">
              {data.details}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(OperatorNodeComponent);
