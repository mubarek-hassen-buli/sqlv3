import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs';
import { ExecutionDAG, ExecutionNode, ExecutionEdge } from '../sql/operators';
import { LayoutGraph, GraphNode, GraphEdge } from './types';

const elk = new ELK();

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

/**
 * Transforms ExecutionDAG (logic) -> ELK Graph -> LayoutGraph (visual)
 */
export async function layoutGraph(dag: ExecutionDAG): Promise<LayoutGraph> {
  
  // 1. Convert DAG to ELK format
  const elkNodes: ElkNode[] = dag.nodes.map(node => ({
    id: node.id,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    labels: [{ text: node.label }], // ELK uses labels for sizing if needed, but we fix size
    layoutOptions: {
      // Per-node options
      'elk.portConstraints': 'FIXED_SIDE', // Helpful for top-down
    },
    // We can store original data in a custom prop to retrieve later if needed, 
    // but ELK cleans output often. We usually map back by ID.
  }));

  const elkEdges: ElkExtendedEdge[] = dag.edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
    labels: edge.label ? [{ text: edge.label }] : []
  }));

  const graph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN', // Top-to-Bottom flow
      'elk.spacing.nodeNode': '50', // Vertical spacing
      'elk.layered.spacing.nodeNodeBetweenLayers': '50',
      'elk.edgeRouting': 'SPLINES', // Smooth curves
    },
    children: elkNodes,
    edges: elkEdges
  };

  // 2. Run ELK Layout
  // Note: ELK runs async (WebWorker or Promise)
  const laidOutGraph = await elk.layout(graph);

  // 3. Convert back to our LayoutGraph type
  const nodes: GraphNode[] = (laidOutGraph.children || []).map(n => {
    // Find original node for metadata
    const original = dag.nodes.find(dn => dn.id === n.id);
    return {
      id: n.id,
      type: original?.type || 'UNKNOWN',
      label: original?.label || n.id,
      x: n.x || 0,
      y: n.y || 0,
      width: n.width || NODE_WIDTH,
      height: n.height || NODE_HEIGHT,
      data: original?.metadata || {}
    };
  });

  const edges: GraphEdge[] = (laidOutGraph.edges || []).map(e => {
    // ELK edges have sections
    return {
      id: e.id,
      source: e.sources[0],
      target: e.targets[0],
      label: e.labels?.[0]?.text,
      sections: e.sections?.map(s => ({
        startPoint: s.startPoint,
        endPoint: s.endPoint,
        bendPoints: s.bendPoints
      })) || []
    };
  });

  return {
    nodes,
    edges,
    width: laidOutGraph.width || 0,
    height: laidOutGraph.height || 0
  };
}
