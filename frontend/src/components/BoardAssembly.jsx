import { useCallback, useRef, useState } from 'react'
import {
  ReactFlow, ReactFlowProvider,
  useNodesState, useEdgesState,
  addEdge, useReactFlow,
  Background, BackgroundVariant,
  Controls, MiniMap,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import ComponentNode      from './assembly/ComponentNode'
import SignalEdge         from './assembly/SignalEdge'
import ComponentLibrary   from './assembly/ComponentLibrary'
import PropertiesPanel    from './assembly/PropertiesPanel'
import { COMPONENT_DEFS } from '../data/componentLibrary'

// Stable refs outside render to avoid re-registration
const NODE_TYPES = { component: ComponentNode }
const EDGE_TYPES = { signal: SignalEdge }

let _idCounter = 1
function uid(prefix = 'n') { return `${prefix}_${_idCounter++}` }

// ── Main export (provides ReactFlow context) ─────────────────────────────────
export default function BoardAssembly() {
  return (
    <ReactFlowProvider>
      <AssemblyCanvas />
    </ReactFlowProvider>
  )
}

// ── Inner canvas (has access to useReactFlow) ─────────────────────────────────
function AssemblyCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selected, setSelected]          = useState({ nodes: [], edges: [] })
  const { screenToFlowPosition }         = useReactFlow()

  // ── Connections ─────────────────────────────────────────────────────────────
  const onConnect = useCallback((params) => {
    setEdges(es => addEdge({
      ...params,
      id:   uid('e'),
      type: 'signal',
      data: { protocol: 'gpio', signal: '' },
    }, es))
  }, [])

  // ── Drag-from-library ────────────────────────────────────────────────────────
  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const compId = e.dataTransfer.getData('application/reactflow')
    if (!compId) return

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY })
    setNodes(ns => [...ns, {
      id:       uid('n'),
      type:     'component',
      position,
      data:     { compId },
    }])
  }, [screenToFlowPosition])

  // ── Selection tracking ───────────────────────────────────────────────────────
  const onSelectionChange = useCallback(({ nodes, edges }) => {
    setSelected({ nodes, edges })
  }, [])

  const selectedNode = selected.nodes[0] ?? null
  const selectedEdge = selected.edges[0] ?? null

  function updateEdgeData(edgeId, patch) {
    setEdges(es => es.map(e => e.id === edgeId ? { ...e, data: { ...e.data, ...patch } } : e))
  }

  // ── Toolbar actions ──────────────────────────────────────────────────────────
  function clearCanvas() {
    if (nodes.length === 0 && edges.length === 0) return
    if (confirm('Limpar todo o diagrama?')) {
      setNodes([]); setEdges([])
    }
  }

  function deleteSelected() {
    const nodeIds = new Set(selected.nodes.map(n => n.id))
    const edgeIds = new Set(selected.edges.map(e => e.id))
    setNodes(ns => ns.filter(n => !nodeIds.has(n.id)))
    setEdges(es => es.filter(e =>
      !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target)
    ))
  }

  const hasSelection = selected.nodes.length > 0 || selected.edges.length > 0

  return (
    <div className="flex" style={{ height: 'calc(100vh - 130px)' }}>

      {/* Left: component library */}
      <div className="w-52 shrink-0 flex flex-col border-r border-gray-800 bg-gray-950">
        <ComponentLibrary />
      </div>

      {/* Center: canvas */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Canvas toolbar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-800 bg-gray-950 shrink-0">
          <span className="text-[10px] text-gray-600 flex-1">
            {nodes.length} componente{nodes.length !== 1 ? 's' : ''} · {edges.length} conexão{edges.length !== 1 ? 'ões' : ''}
          </span>
          {hasSelection && (
            <button onClick={deleteSelected}
              className="px-2 py-1 rounded text-[10px] bg-red-900/40 hover:bg-red-900/70 text-red-400 transition-colors">
              Remover seleção
            </button>
          )}
          <button onClick={clearCanvas}
            className="px-2 py-1 rounded text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors">
            Limpar
          </button>
          <div className="text-[9px] text-gray-700 pl-2 border-l border-gray-800">
            Arraste da biblioteca · Clique em pino para conectar · Del para remover
          </div>
        </div>

        {/* ReactFlow canvas */}
        <div className="flex-1 min-h-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onSelectionChange={onSelectionChange}
            nodeTypes={NODE_TYPES}
            edgeTypes={EDGE_TYPES}
            connectionMode={ConnectionMode.Loose}
            snapToGrid
            snapGrid={[8, 8]}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            defaultEdgeOptions={{ type: 'signal', data: { protocol: 'gpio', signal: '' } }}
            deleteKeyCode={['Backspace', 'Delete']}
            style={{ background: '#0d1117', height: '100%' }}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color="#1e2a38"
              gap={20}
              size={1.5}
            />
            <Controls
              style={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
            />
            <MiniMap
              nodeColor={n => {
                const comp = COMPONENT_DEFS.find(c => c.id === n.data?.compId)
                return comp?.accentColor ?? '#374151'
              }}
              style={{
                background:   '#111827',
                border:       '1px solid #374151',
                borderRadius: 8,
              }}
              maskColor="#0d111780"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Right: properties */}
      <div className="w-64 shrink-0 flex flex-col border-l border-gray-800 bg-gray-950">
        <PropertiesPanel
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          nodes={nodes}
          edges={edges}
          onUpdateEdge={updateEdgeData}
        />
      </div>
    </div>
  )
}
