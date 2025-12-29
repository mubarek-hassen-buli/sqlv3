"use client";

import React, { useEffect, useState } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import { useDiagramStore } from '@/store/diagram.store';
// import { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types'; // Import issue


export function DiagramCanvas() {
  const { layout } = useDiagramStore();
  const [elements, setElements] = useState<any[]>([]);

  useEffect(() => {
    if (!layout) return;

    // Transform LayoutGraph -> Excalidraw Elements
    const newElements: any[] = [];

    // 1. Nodes
    layout.nodes.forEach(node => {
      newElements.push({
        type: "rectangle",
        id: node.id,
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: "#1e1e1e",
        strokeColor: "#828282",
        fillStyle: "solid",
        roughness: 1, // Cleaner lines
        roundness: { type: 3 }, // Rounded corners
        groupIds: [node.id],
      });

      // Label
      newElements.push({
        type: "text",
        id: `${node.id}-label`,
        x: node.x + 10,
        y: node.y + 20, // Vertically centered approx
        text: node.label,
        fontSize: 16,
        fontFamily: 1, // Hand-drawn style
        strokeColor: "#ffffff",
        groupIds: [node.id],
      });
    });

    // 2. Edges
    layout.edges.forEach(edge => {
       // Simple straight line for now, or multiple segments if ELK gave sections
       // ELK sections structure: start -> bend -> end
       // Excalidraw Arrow needs points relative to x,y
       
       if (edge.sections.length > 0) {
           const section = edge.sections[0];
           // Construct points array: [0,0] (relative to x,y), then others
           const startX = section.startPoint.x;
           const startY = section.startPoint.y;
           
           const points = [[0, 0]];
           if (section.bendPoints) {
                section.bendPoints.forEach(bp => {
                    points.push([bp.x - startX, bp.y - startY]);
                });
           }
           points.push([section.endPoint.x - startX, section.endPoint.y - startY]);

           newElements.push({
               type: "arrow",
               id: edge.id,
               x: startX,
               y: startY,
               points: points,
               strokeColor: "#a3a3a3",
               strokeWidth: 2,
               roughness: 0,
               startArrowhead: null,
               endArrowhead: "arrow",
           });
       }
    });

    setElements(newElements);
    
  }, [layout]);

  return (
    <div className="h-full w-full border-l border-zinc-800">
      {/* Excalidraw Wrapper */}
      <div className="h-full w-full">
         <Excalidraw 
            initialData={{ elements: elements, appState: { viewBackgroundColor: "#101010", gridModeEnabled: true } }}
            viewModeEnabled={true} // Read Only
            zenModeEnabled={true} // Hide UI
            gridModeEnabled={true}
         />
      </div>
    </div>
  );
}
