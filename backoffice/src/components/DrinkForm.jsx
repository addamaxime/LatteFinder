import { useState, useEffect } from 'react'

const CATEGORIES = [
  { id: 'espresso', label: 'Espresso', emoji: '☕' },
  { id: 'latte', label: 'Latte', emoji: '🥛' },
  { id: 'filter', label: 'Filtre', emoji: '🫖' },
  { id: 'cold', label: 'Froid', emoji: '🧊' },
  { id: 'other', label: 'Autre', emoji: '🍵' },
]

function DrinkForm({ drink, onSave, onClose }) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'latte',
    icon: '☕',
  })

  useEffect(() => {
    if (drink) {
      setFormData({
        name: drink.name || '',
        category: drink.category || 'latte',
        icon: drink.icon || '☕',
      })
    }
  }, [drink])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const dataToSave = {
      name: formData.name.trim(),
      category: formData.category,
      icon: formData.icon || null,
    }

    const success = await onSave(dataToSave)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{drink ? 'Modifier la boisson' : 'Ajouter une boisson'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Nom *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Ex: Latte Matcha"
              />
            </div>

            <div className="form-group">
              <label>Catégorie</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Icône (emoji)</label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="☕"
                maxLength={4}
                style={{ width: '80px', textAlign: 'center', fontSize: '1.5rem' }}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Enregistrement...' : (drink ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DrinkForm
