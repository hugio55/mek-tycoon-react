import { useCallback } from 'react';
import { useTalentBuilder } from '../TalentBuilderContext';

interface UseConnectionAnalysisReturn {
  testConnections: () => void;
  findDisconnectedAndDeadEndNodes: () => void;
  clearHighlights: () => void;
  unconnectedNodes: Set<string>;
  deadEndNodes: Set<string>;
  highlightDisconnected: boolean;
  setHighlightDisconnected: (value: boolean) => void;
}

export function useConnectionAnalysis(): UseConnectionAnalysisReturn {
  const { state, dispatch, actions } = useTalentBuilder();

  // Find nodes that have zero connections
  const testConnections = useCallback(() => {
    const connectedNodes = new Set<string>();

    // Add all nodes that have connections
    state.connections.forEach(conn => {
      connectedNodes.add(conn.from);
      connectedNodes.add(conn.to);
    });

    // Find nodes that have no connections
    const unconnected = new Set<string>();
    state.nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        unconnected.add(node.id);
      }
    });

    dispatch({ type: 'SET_UNCONNECTED_NODES', payload: unconnected });
    dispatch({ type: 'SET_HIGHLIGHT_DISCONNECTED', payload: true });

    if (unconnected.size > 0) {
      actions.setSaveStatus(`Found ${unconnected.size} unconnected node(s)`, 3000);
    } else {
      actions.setSaveStatus('All nodes are connected!', 2000);
    }
  }, [state.nodes, state.connections, dispatch, actions]);

  // Find nodes that are connected but have no upward path (dead-ends)
  const findDisconnectedAndDeadEndNodes = useCallback(() => {
    const connectedNodes = new Set<string>();
    const nodeConnections = new Map<string, Set<string>>();

    // Build a map of all connections for each node
    state.connections.forEach(conn => {
      connectedNodes.add(conn.from);
      connectedNodes.add(conn.to);

      // Track bidirectional connections
      if (!nodeConnections.has(conn.from)) {
        nodeConnections.set(conn.from, new Set());
      }
      if (!nodeConnections.has(conn.to)) {
        nodeConnections.set(conn.to, new Set());
      }
      nodeConnections.get(conn.from)!.add(conn.to);
      nodeConnections.get(conn.to)!.add(conn.from);
    });

    // Find nodes that have upward connections
    const hasUpwardConnection = new Set<string>();

    state.nodes.forEach(node => {
      const connections = nodeConnections.get(node.id);
      if (connections) {
        // Check if any connected node has a lower y value (is above this node)
        for (const connectedId of connections) {
          const connectedNode = state.nodes.find(n => n.id === connectedId);
          if (connectedNode && connectedNode.y < node.y - 10) {
            hasUpwardConnection.add(node.id);
            break;
          }
        }
      }
    });

    // Find unconnected nodes and dead-ends
    const unconnected = new Set<string>();
    const deadEnds = new Set<string>();

    // Find the topmost nodes (lowest y values)
    const minY = Math.min(...state.nodes.map(n => n.y));

    state.nodes.forEach(node => {
      // Check if node has no connections at all
      if (!connectedNodes.has(node.id)) {
        unconnected.add(node.id);
      }
      // Check if node is connected but has no upward path (dead-end)
      else if (!hasUpwardConnection.has(node.id)) {
        // Exception: Don't mark as dead-end if it's at the very top
        const isTopNode = Math.abs(node.y - minY) < 100;
        if (!isTopNode) {
          deadEnds.add(node.id);
        }
      }
    });

    dispatch({ type: 'SET_UNCONNECTED_NODES', payload: unconnected });
    dispatch({ type: 'SET_DEAD_END_NODES', payload: deadEnds });
    dispatch({ type: 'SET_HIGHLIGHT_DISCONNECTED', payload: true });

    const totalIssues = unconnected.size + deadEnds.size;
    if (totalIssues > 0) {
      actions.setSaveStatus(
        `Found ${unconnected.size} unconnected, ${deadEnds.size} dead-end nodes`,
        3000
      );
    } else {
      actions.setSaveStatus('All nodes properly connected!', 2000);
    }
  }, [state.nodes, state.connections, dispatch, actions]);

  // Clear all highlights
  const clearHighlights = useCallback(() => {
    dispatch({ type: 'CLEAR_CONNECTION_HIGHLIGHTS' });
    actions.setSaveStatus('Cleared connection test', 2000);
  }, [dispatch, actions]);

  // Toggle highlight visibility
  const setHighlightDisconnected = useCallback((value: boolean) => {
    dispatch({ type: 'SET_HIGHLIGHT_DISCONNECTED', payload: value });
  }, [dispatch]);

  return {
    testConnections,
    findDisconnectedAndDeadEndNodes,
    clearHighlights,
    unconnectedNodes: state.unconnectedNodes,
    deadEndNodes: state.deadEndNodes,
    highlightDisconnected: state.highlightDisconnected,
    setHighlightDisconnected
  };
}
