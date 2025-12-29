
import ELK from 'elkjs/lib/elk.bundled';
import { LogicalPlanGraph, GraphNodeData, RelationNode } from '../sql/types';
import { LayoutGraph, LayoutNode, LayoutEdge } from './types';

const elk = new ELK();

export async function layoutGraph(plan: LogicalPlanGraph): Promise<LayoutGraph> {
  if (!plan.nodes.length) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  // Convert to ELK format with different sizes for Relations vs Operators
  const elkNodes = plan.nodes.map(node => {
    if (node.nodeType === 'Relation') {
      const rel = node as RelationNode;
      const colCount = Math.min(rel.columns.length, 6); // Cap for display
      return {
        id: node.id,
        width: 200,
        height: 60 + colCount * 18,
        labels: [{ text: rel.name }]
      };
    } else {
      // Operators are smaller
      return {
        id: node.id,
        width: 140,
        height: 36,
        labels: [{ text: node.operator }]
      };
    }
  });

  const elkEdges = plan.edges.map(e => ({
    id: e.id,
    sources: [e.from],
    targets: [e.to]
  }));

  const result: any = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN', // Top to bottom flow
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '50',
      'elk.edgeRouting': 'ORTHOGONAL'
    },
    children: elkNodes,
    edges: elkEdges
  });

  // Map back to our format
  const nodeMap = new Map<string, GraphNodeData>();
  plan.nodes.forEach(n => nodeMap.set(n.id, n));

  const layoutNodes: LayoutNode[] = (result.children || []).map((ln: any) => {
    const original = nodeMap.get(ln.id)!;
    return {
      ...original,
      x: ln.x || 0,
      y: ln.y || 0,
      width: ln.width || 100,
      height: ln.height || 40
    };
  });

  const layoutEdges: LayoutEdge[] = (result.edges || []).map((e: any) => ({
    id: e.id,
    from: e.sources?.[0] || '',
    to: e.targets?.[0] || '',
    sections: e.sections || []
  }));

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    width: result.width || 600,
    height: result.height || 400
  };
}
