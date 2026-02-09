import dagre from '@dagrejs/dagre'
import graphlib from '@dagrejs/graphlib'
import { Position, useVueFlow } from '@vue-flow/core'

import type { EntityGraph } from '@/db/models.ts'

export type LayoutDirection = 'LR' | 'TB'

/**
 * Composable to run the layout algorithm on the graph.
 * It uses the `dagre` library to calculate the layout of the nodes and edges.
 */
export function useLayout() {
  const { findNode } = useVueFlow()

  function layout({ nodes, edges }: EntityGraph, direction: LayoutDirection = 'TB') {
    // we create a new graph instance, in case some nodes/edges were removed, otherwise dagre would act as if they were still there
    const dagreGraph = new graphlib.Graph()

    dagreGraph.setDefaultEdgeLabel(() => ({}))

    const isHorizontal = direction === 'LR'
    dagreGraph.setGraph({ rankdir: direction })

    for (const node of nodes) {
      const graphNode = findNode(node.id)
      if (graphNode) {
        dagreGraph.setNode(node.id, {
          width: graphNode.dimensions.width * 2,
          height: graphNode.dimensions.height,
        })
      }
    }

    for (const edge of edges) {
      dagreGraph.setEdge(edge.source, edge.target)
    }

    dagre.layout(dagreGraph)

    // set nodes with updated positions
    return nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id)

      return {
        ...node,
        targetPosition: isHorizontal ? Position.Left : Position.Top,
        sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
        position: { x: nodeWithPosition.x, y: nodeWithPosition.y },
      }
    })
  }

  return { layout }
}
