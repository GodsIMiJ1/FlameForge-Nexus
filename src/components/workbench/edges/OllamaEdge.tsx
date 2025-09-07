// Custom edge component for Ollama connections
import React from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';

export const OllamaEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: '#8b5cf6',
          strokeWidth: 2,
          strokeDasharray: data?.isActive ? '0' : '5,5',
          opacity: data?.isActive ? 1 : 0.6,
        }}
        className="ollama-edge"
      />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 10,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-purple-100 text-purple-800 px-2 py-1 rounded-full border border-purple-300 text-xs font-medium"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
