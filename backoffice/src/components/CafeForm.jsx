import { useState, useEffect } from 'react'

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
]

const LATTE_TYPES = [
  { id: 'matcha', label: 'Matcha Latte', emoji: '🍵' },
  { id: 'chai', label: 'Chai Latte', emoji: '🫖' },
  { id: 'cafe', label: 'Café Latte', emoji: '☕' },
  { id: 'iced', label: 'Iced Latte', emoji: '🧊' },
]

const defaultHours = DAYS.reduce((acc, day) => {
  acc[day.key] = { open: '08:00', close: '18:00', closed: false }
  return acc
}, {})

function CafeForm({ cafe, importedData, onSave, onClose }) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    phone: '',
    image: '',
    latte_types: ['cafe'],
    hours: defaultHours,
    social: { website: '', instagram: '', facebook: '', email: '' },
  })

  useEffect(() => {
    if (cafe) {
      // Parse hours from database format
      const parsedHours = { ...defaultHours }
      if (cafe.hours) {
        DAYS.forEach(day => {
          if (cafe.hours[day.key] === null) {
            parsedHours[day.key] = { open: '', close: '', closed: true }
          } else if (cafe.hours[day.key]) {
            parsedHours[day.key] = {
              open: cafe.hours[day.key].open || '',
              close: cafe.hours[day.key].close || '',
              closed: false
            }
          }
        })
      }

      setFormData({
        name: cafe.name || '',
        address: cafe.address || '',
        latitude: cafe.latitude || '',
        longitude: cafe.longitude || '',
        description: cafe.description || '',
        phone: cafe.phone || '',
        image: cafe.image || '',
        latte_types: cafe.latte_types || ['cafe'],
        hours: parsedHours,
        social: cafe.social || { website: '', instagram: '', facebook: '', email: '' },
      })
    }
  }, [cafe])

  // Handle imported data
  useEffect(() => {
    if (importedData && !cafe) {
      setFormData(prev => ({
        ...prev,
        name: importedData.name || '',
        address: importedData.address || '',
        latitude: importedData.latitude || '',
        longitude: importedData.longitude || '',
        description: importedData.description || '',
        phone: importedData.phone || '',
        image: importedData.image || '',
        latte_types: importedData.latte_types || ['cafe'],
      }))
    }
  }, [importedData, cafe])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleLatteTypeChange = (typeId) => {
    setFormData(prev => {
      const types = prev.latte_types.includes(typeId)
        ? prev.latte_types.filter(t => t !== typeId)
        : [...prev.latte_types, typeId]
      return { ...prev, latte_types: types }
    })
  }

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: { ...prev.hours[day], [field]: value }
      }
    }))
  }

  const handleClosedChange = (day, checked) => {
    setFormData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          closed: checked,
          open: checked ? '' : prev.hours[day].open,
          close: checked ? '' : prev.hours[day].close
        }
      }
    }))
  }

  const handleSocialChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      social: { ...prev.social, [field]: value }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    // Format hours for database
    const formattedHours = {}
    DAYS.forEach(day => {
      if (formData.hours[day.key].closed) {
        formattedHours[day.key] = null
      } else if (formData.hours[day.key].open && formData.hours[day.key].close) {
        formattedHours[day.key] = {
          open: formData.hours[day.key].open,
          close: formData.hours[day.key].close
        }
      }
    })

    // Clean social data
    const cleanSocial = {}
    Object.entries(formData.social).forEach(([key, value]) => {
      if (value && value.trim()) {
        cleanSocial[key] = value.trim()
      }
    })

    const dataToSave = {
      name: formData.name,
      address: formData.address,
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      description: formData.description || null,
      phone: formData.phone || null,
      image: formData.image || null,
      latte_types: formData.latte_types,
      hours: formattedHours,
      social: Object.keys(cleanSocial).length > 0 ? cleanSocial : null,
    }

    const success = await onSave(dataToSave)
    setSaving(false)
    if (!success) {
      // Error handling is done in parent
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{cafe ? 'Modifier le café' : 'Ajouter un café'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* Basic Info */}
              <div className="form-group">
                <label>Nom *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nom du café"
                />
              </div>

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="06 12 34 56 78"
                />
              </div>

              <div className="form-group full-width">
                <label>Adresse *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="123 rue du Café, 64600 Anglet"
                />
              </div>

              <div className="form-group">
                <label>Latitude *</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                  placeholder="43.4830"
                />
              </div>

              <div className="form-group">
                <label>Longitude *</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                  placeholder="-1.5155"
                />
              </div>

              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description du café..."
                  rows={3}
                />
              </div>

              <div className="form-group full-width">
                <label>Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://..."
                />
                {formData.image && (
                  <div className="image-preview">
                    <img
                      src={formData.image}
                      alt="Aperçu"
                      onError={(e) => e.target.style.display = 'none'}
                      onLoad={(e) => e.target.style.display = 'block'}
                    />
                  </div>
                )}
              </div>

              {/* Latte Types */}
              <div className="form-group full-width">
                <label>Types de lattes disponibles</label>
                <div className="checkbox-group">
                  {LATTE_TYPES.map(type => (
                    <label key={type.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.latte_types.includes(type.id)}
                        onChange={() => handleLatteTypeChange(type.id)}
                      />
                      {type.emoji} {type.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Social Links */}
              <div className="form-group">
                <label>Site web</label>
                <input
                  type="url"
                  value={formData.social.website || ''}
                  onChange={(e) => handleSocialChange('website', e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>

              <div className="form-group">
                <label>Instagram</label>
                <input
                  type="text"
                  value={formData.social.instagram || ''}
                  onChange={(e) => handleSocialChange('instagram', e.target.value)}
                  placeholder="@moncompte"
                />
              </div>

              <div className="form-group">
                <label>Facebook</label>
                <input
                  type="text"
                  value={formData.social.facebook || ''}
                  onChange={(e) => handleSocialChange('facebook', e.target.value)}
                  placeholder="mapage"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.social.email || ''}
                  onChange={(e) => handleSocialChange('email', e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>

              {/* Hours */}
              <div className="form-group full-width">
                <label>Horaires d'ouverture</label>
                <div className="hours-grid">
                  {DAYS.map(day => (
                    <div key={day.key} className="hour-row">
                      <label>{day.label}</label>
                      <input
                        type="time"
                        value={formData.hours[day.key]?.open || ''}
                        onChange={(e) => handleHoursChange(day.key, 'open', e.target.value)}
                        disabled={formData.hours[day.key]?.closed}
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={formData.hours[day.key]?.close || ''}
                        onChange={(e) => handleHoursChange(day.key, 'close', e.target.value)}
                        disabled={formData.hours[day.key]?.closed}
                      />
                      <label className="closed-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.hours[day.key]?.closed || false}
                          onChange={(e) => handleClosedChange(day.key, e.target.checked)}
                        />
                        Fermé
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Enregistrement...' : (cafe ? 'Modifier' : 'Ajouter')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CafeForm
