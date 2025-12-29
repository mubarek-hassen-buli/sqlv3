
import ELK from 'elkjs/lib/elk.bundled';
import { LogicalNode } from '../sql/types';
import { LayoutGraph, GraphNode, GraphEdge } from './types';

const elk = new ELK();

export async function layoutGraph(root: LogicalNode): Promise<LayoutGraph> {
  if (!root) return { nodes: [], edges: [], width: 0, height: 0 };

  // 1. Flatten the tree into nodes and edges for ELK
  const elkNodes: any[] = [];
  const elkEdges: any[] = [];
  
  function traverse(node: LogicalNode, parentId?: string) {
    const colCount = node.schema?.columns?.length || 0;
    
    elkNodes.push({
      id: node.id,
      width: 220,
      height: 80 + Math.min(colCount, 5) * 18, // Cap height for large schemas
      labels: [{ text: node.type }]
    });

    // Edge: Child -> Parent (Data flows from sources to sinks)
    if (parentId) {
      elkEdges.push({
        id: `e-${node.id}-${parentId}`,
        sources: [node.id],
        targets: [parentId]
      });
    }

    node.children.forEach(child => traverse(child, node.id));
  }

  traverse(root);

  // 2. Run Layout
  const layoutResult: any = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '60',
      'elk.layered.spacing.nodeNodeBetweenLayers': '80',
      'elk.edgeRouting': 'ORTHOGONAL'
    },
    children: elkNodes,
    edges: elkEdges
  });

  // 3. Build node map for lookup
  const nodeMap = new Map<string, LogicalNode>();
  function mapNodes(n: LogicalNode) {
      nodeMap.set(n.id, n);
      n.children.forEach(mapNodes);
  }
  mapNodes(root);

  // 4. Convert to output format
  const outputNodes: GraphNode[] = [];
  const outputEdges: GraphEdge[] = [];

  (layoutResult.children || []).forEach((ln: any) => {
    const original = nodeMap.get(ln.id);
    if (original) {
        outputNodes.push({
            ...original,
            x: ln.x || 0,
            y: ln.y || 0,
            width: ln.width || 220,
            height: ln.height || 80
        });
    }
  });

  (layoutResult.edges || []).forEach((e: any) => {
      outputEdges.push({
          id: e.id,
          source: e.sources?.[0] || '',
          target: e.targets?.[0] || '',
          sections: e.sections || []
      });
  });

  return {
    nodes: outputNodes,
    edges: outputEdges,
    width: layoutResult.width || 800,
    height: layoutResult.height || 600
  };
}
