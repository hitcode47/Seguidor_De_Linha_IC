import { useState } from 'react'
import { COMPONENT_DEFS, CATEGORIES } from '../../data/componentLibrary'

const ALL = 'all'

export default function ComponentLibrary() {
  const [filter, setFilter] = useState(ALL)
  const [search, setSearch] = useState('')

  const categories = [ALL, ...Object.keys(CATEGORIES)]
  const filtered   = COMPONENT_DEFS.filter(c => {
    const matchCat    = filter === ALL || c.category === filter
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      {/* Header + search */}
      <div className="px-3 pt-3 pb-2 border-b border-gray-800">
        <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-2">
          Componentes
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar…"
          className="w-full px-2 py-1.5 rounded bg-gray-800 text-xs text-gray-300 placeholder-gray-600
                     focus:outline-none focus:ring-1 focus:ring-gray-600"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1 px-2 py-2 border-b border-gray-800">
        {categories.map(cat => {
          const catDef = CATEGORIES[cat]
          const active = filter === cat
          return (
            <button key={cat}
              onClick={() => setFilter(cat)}
              className="px-2 py-0.5 rounded text-[9px] font-medium transition-colors"
              style={active && cat !== ALL
                ? { background: catDef.bg, color: catDef.color }
                : { background: active ? '#374151' : 'transparent', color: active ? '#f9fafb' : '#6b7280' }
              }
            >
              {cat === ALL ? 'Todos' : catDef?.label ?? cat}
            </button>
          )
        })}
      </div>

      {/* Component cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filtered.map(comp => <ComponentCard key={comp.id} comp={comp} />)}
        {filtered.length === 0 && (
          <p className="text-[10px] text-gray-700 text-center py-6">Nenhum componente</p>
        )}
      </div>

      {/* Add custom */}
      <div className="px-2 py-2 border-t border-gray-800">
        <button className="w-full px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700
                           text-xs text-gray-500 hover:text-gray-300 transition-colors">
          + Novo componente
        </button>
      </div>
    </>
  )
}

function ComponentCard({ comp }) {
  const cat      = CATEGORIES[comp.category]
  const pinCount = comp.leftPins.length + comp.rightPins.length

  function onDragStart(e) {
    e.dataTransfer.setData('application/reactflow', comp.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="group px-2.5 py-2 rounded-lg bg-gray-900 hover:bg-gray-800
                 border border-gray-800 hover:border-gray-700
                 cursor-grab active:cursor-grabbing transition-all select-none"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0 mt-0.5"
               style={{ background: comp.accentColor }}/>
          <span className="text-[10px] font-medium text-white truncate leading-tight">
            {comp.name}
          </span>
        </div>
        <span className="text-[8px] px-1 py-0.5 rounded shrink-0 font-semibold"
              style={{ background: cat?.bg, color: cat?.color }}>
          {cat?.label}
        </span>
      </div>
      <p className="text-[9px] text-gray-600 mt-1 leading-tight pl-3.5 line-clamp-2">
        {comp.description}
      </p>
      <p className="text-[9px] text-gray-700 mt-0.5 pl-3.5">{pinCount} pinos</p>
    </div>
  )
}
