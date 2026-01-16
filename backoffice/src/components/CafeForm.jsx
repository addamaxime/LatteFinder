import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
]

const defaultHours = DAYS.reduce((acc, day) => {
  acc[day.key] = { open: '08:00', close: '18:00', closed: false }
  return acc
}, {})

function CafeForm({ cafe, importedData, onSave, onClose }) {
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    phone: '',
    image: '',
    hours: defaultHours,
    social: { website: '', instagram: '', facebook: '', email: '' },
  })

  // Drinks state
  const [availableDrinks, setAvailableDrinks] = useState([])
  const [cafeDrinks, setCafeDrinks] = useState([]) // { drink_id, drink, price }
  const [drinksLoading, setDrinksLoading] = useState(false)

  // Fetch available drinks
  useEffect(() => {
    const fetchDrinks = async () => {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .order('category')
        .order('name')
      if (!error && data) {
        setAvailableDrinks(data)
      }
    }
    fetchDrinks()
  }, [])

  // Fetch cafe drinks when editing
  useEffect(() => {
    if (cafe?.id) {
      const fetchCafeDrinks = async () => {
        setDrinksLoading(true)
        const { data, error } = await supabase
          .from('coffee_drinks')
          .select('*, drink:drinks(*)')
          .eq('coffee_id', cafe.id)
        if (!error && data) {
          setCafeDrinks(data.map(cd => ({
            drink_id: cd.drink_id,
            drink: cd.drink,
            price: cd.price || '',
            notes: cd.notes || ''
          })))
        }
        setDrinksLoading(false)
      }
      fetchCafeDrinks()
    }
  }, [cafe?.id])

  useEffect(() => {
    if (cafe) {
      // Support both 'opening_hours' and 'hours' column names
      const hoursData = cafe.opening_hours || cafe.hours

      // Parse hours from database format
      const parsedHours = {}
      DAYS.forEach(day => {
        const dayData = hoursData?.[day.key]
        const dayDataLower = typeof dayData === 'string' ? dayData.toLowerCase() : null

        if (dayData === null || dayDataLower === 'closed' || dayDataLower === 'fermé') {
          // Explicitly closed
          parsedHours[day.key] = { open: '', close: '', closed: true }
        } else if (typeof dayData === 'string' && dayData.includes('-')) {
          // Format: "10:00-19:00"
          const [open, close] = dayData.split('-').map(s => s.trim())
          parsedHours[day.key] = { open, close, closed: false }
        } else if (dayData && typeof dayData === 'object' && dayData.open) {
          // Format: {open: "10:00", close: "19:00"}
          parsedHours[day.key] = {
            open: dayData.open || '',
            close: dayData.close || '',
            closed: false
          }
        } else {
          // No data for this day - use defaults
          parsedHours[day.key] = { open: '08:00', close: '18:00', closed: false }
        }
      })

      setFormData({
        name: cafe.name || '',
        address: cafe.address || '',
        latitude: cafe.latitude || '',
        longitude: cafe.longitude || '',
        description: cafe.description || '',
        phone: cafe.phone || '',
        image: cafe.image || '',
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
      }))
    }
  }, [importedData, cafe])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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

  // Drinks management
  const handleAddDrink = (drink) => {
    if (!cafeDrinks.find(cd => cd.drink_id === drink.id)) {
      setCafeDrinks(prev => [...prev, {
        drink_id: drink.id,
        drink: drink,
        price: '',
        notes: ''
      }])
    }
  }

  const handleRemoveDrink = (drinkId) => {
    setCafeDrinks(prev => prev.filter(cd => cd.drink_id !== drinkId))
  }

  const handleDrinkPriceChange = (drinkId, price) => {
    setCafeDrinks(prev => prev.map(cd =>
      cd.drink_id === drinkId ? { ...cd, price } : cd
    ))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    // Format hours for database (string format: "10:00-18:00")
    const formattedHours = {}
    DAYS.forEach(day => {
      if (formData.hours[day.key].closed) {
        formattedHours[day.key] = null
      } else if (formData.hours[day.key].open && formData.hours[day.key].close) {
        formattedHours[day.key] = `${formData.hours[day.key].open}-${formData.hours[day.key].close}`
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
      opening_hours: formattedHours,
      social: Object.keys(cleanSocial).length > 0 ? cleanSocial : null,
    }

    const success = await onSave(dataToSave, cafeDrinks)
    setSaving(false)
  }

  const getUnassignedDrinks = () => {
    const assignedIds = cafeDrinks.map(cd => cd.drink_id)
    return availableDrinks.filter(d => !assignedIds.includes(d.id))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{cafe ? 'Modifier le café' : 'Ajouter un café'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
            type="button"
          >
            Informations
          </button>
          <button
            className={`modal-tab ${activeTab === 'hours' ? 'active' : ''}`}
            onClick={() => setActiveTab('hours')}
            type="button"
          >
            Horaires
          </button>
          {cafe && (
            <button
              className={`modal-tab ${activeTab === 'drinks' ? 'active' : ''}`}
              onClick={() => setActiveTab('drinks')}
              type="button"
            >
              Boissons ({cafeDrinks.length})
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Info Tab */}
            {activeTab === 'info' && (
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
              </div>
            )}

            {/* Hours Tab */}
            {activeTab === 'hours' && (
              <div className="hours-tab">
                <h4>Horaires d'ouverture</h4>
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
            )}

            {/* Drinks Tab */}
            {activeTab === 'drinks' && (
              <div className="drinks-tab">
                {drinksLoading ? (
                  <div className="loading-small">Chargement...</div>
                ) : (
                  <>
                    {/* Current drinks */}
                    <div className="drinks-section">
                      <h4>Boissons du café ({cafeDrinks.length})</h4>
                      {cafeDrinks.length === 0 ? (
                        <p className="empty-text">Aucune boisson assignée</p>
                      ) : (
                        <div className="cafe-drinks-list">
                          {cafeDrinks.map(cd => (
                            <div key={cd.drink_id} className="cafe-drink-item">
                              <span className="cafe-drink-icon">{cd.drink?.icon || '☕'}</span>
                              <span className="cafe-drink-name">{cd.drink?.name}</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Prix €"
                                value={cd.price}
                                onChange={(e) => handleDrinkPriceChange(cd.drink_id, e.target.value)}
                                className="cafe-drink-price"
                              />
                              <button
                                type="button"
                                className="btn-remove-drink"
                                onClick={() => handleRemoveDrink(cd.drink_id)}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Available drinks to add */}
                    <div className="drinks-section">
                      <h4>Ajouter une boisson</h4>
                      {getUnassignedDrinks().length === 0 ? (
                        <p className="empty-text">Toutes les boissons sont déjà assignées</p>
                      ) : (
                        <div className="available-drinks-list">
                          {getUnassignedDrinks().map(drink => (
                            <button
                              key={drink.id}
                              type="button"
                              className="available-drink-item"
                              onClick={() => handleAddDrink(drink)}
                            >
                              <span className="drink-icon">{drink.icon || '☕'}</span>
                              <span className="drink-name">{drink.name}</span>
                              <span className="drink-add">+</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
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
