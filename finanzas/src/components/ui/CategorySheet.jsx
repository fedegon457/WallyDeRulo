import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'

export function CategorySheet({ categories, value, onChange, onClose }) {
  const [expandedId, setExpandedId] = useState(() => {
    if (!value) return null
    const cat = categories.find(c => c.id === value)
    return cat?.parent_id ?? null
  })

  const parents = categories.filter(c => !c.parent_id)

  // Group parents into rows of 3 for inline subcategory expansion
  const rows = []
  for (let i = 0; i < parents.length; i += 3) {
    rows.push(parents.slice(i, i + 3))
  }

  const handleParent = (cat) => {
    const children = categories.filter(c => c.parent_id === cat.id)
    if (children.length === 0) {
      onChange(cat.id)
      onClose()
    } else {
      setExpandedId(expandedId === cat.id ? null : cat.id)
    }
  }

  const handleChild = (cat) => {
    onChange(cat.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full rounded-t-2xl max-h-[75vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Categoría</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {rows.map((row, rowIdx) => {
            const expandedInRow = row.find(p => p.id === expandedId)
            const children = expandedInRow
              ? categories.filter(c => c.parent_id === expandedInRow.id)
              : []

            return (
              <div key={rowIdx} className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {row.map(cat => {
                    const catChildren = categories.filter(c => c.parent_id === cat.id)
                    const isSelected = value === cat.id || catChildren.some(c => c.id === value)
                    const isExpanded = expandedId === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleParent(cat)}
                        className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition border ${
                          isSelected
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-2xl leading-none">{cat.icon || '📋'}</span>
                        <span className="text-xs font-medium text-gray-700 leading-tight mt-0.5">{cat.name}</span>
                        {catChildren.length > 0 && (
                          <ChevronDown
                            size={11}
                            className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        )}
                      </button>
                    )
                  })}
                  {/* Fill empty cells in last row */}
                  {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                </div>

                {/* Subcategorías expandidas */}
                {children.length > 0 && (
                  <div className="ml-1 pl-3 border-l-2 border-blue-200">
                    <div className="grid grid-cols-3 gap-2">
                      {children.map(child => {
                        const isSelected = value === child.id
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleChild(child)}
                            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-center transition border ${
                              isSelected
                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                : 'border-transparent hover:bg-gray-50'
                            }`}
                          >
                            <span className="text-2xl leading-none">{child.icon || '📋'}</span>
                            <span className="text-xs font-medium text-gray-700 leading-tight mt-0.5">{child.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
