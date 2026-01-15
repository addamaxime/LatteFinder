import { useState, useEffect, useRef } from 'react'

function UserForm({ user, onSave, onClose }) {
  const isEditing = !!user
  const fileInputRef = useRef(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    username: '',
    is_admin: false,
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        username: user.username || '',
        is_admin: user.is_admin || false,
      })
      setAvatarPreview(user.avatar_url || null)
    } else {
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        username: '',
        is_admin: false,
      })
      setAvatarPreview(null)
    }
    setAvatarFile(null)
  }, [user])

  const validate = () => {
    const newErrors = {}

    if (!isEditing) {
      if (!formData.email.trim()) {
        newErrors.email = 'L\'email est requis'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Email invalide'
      }

      if (!formData.password) {
        newErrors.password = 'Le mot de passe est requis'
      } else if (formData.password.length < 6) {
        newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    setSaving(true)
    const success = await onSave(formData, avatarFile)
    setSaving(false)
    if (success) {
      onClose()
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5 Mo')
        return
      }
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setAvatarPreview(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const getInitials = () => {
    if (formData.first_name) return formData.first_name[0].toUpperCase()
    if (formData.username) return formData.username[0].toUpperCase()
    if (formData.email) return formData.email[0].toUpperCase()
    if (user?.email) return user.email[0].toUpperCase()
    return '?'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Avatar upload section */}
            <div className="avatar-upload-section">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" />
                ) : (
                  getInitials()
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? 'Changer la photo' : 'Ajouter une photo'}
              </button>
            </div>

            <div className="form-grid">
              {!isEditing && (
                <>
                  <div className="form-group full-width">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="utilisateur@example.com"
                      className={errors.email ? 'input-error' : ''}
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>

                  <div className="form-group full-width">
                    <label>Mot de passe *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Minimum 6 caractères"
                      className={errors.password ? 'input-error' : ''}
                    />
                    {errors.password && <span className="error-text">{errors.password}</span>}
                  </div>
                </>
              )}

              {isEditing && (
                <div className="form-group full-width">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <small style={{ color: '#888', marginTop: 4 }}>
                    L'email ne peut pas être modifié
                  </small>
                </div>
              )}

              <div className="form-group">
                <label>Prénom</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => handleChange('first_name', e.target.value)}
                  placeholder="Prénom"
                />
              </div>

              <div className="form-group">
                <label>Nom</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleChange('last_name', e.target.value)}
                  placeholder="Nom de famille"
                />
              </div>

              <div className="form-group full-width">
                <label>Nom d'utilisateur</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Nom d'utilisateur (optionnel)"
                />
              </div>

              <div className="form-group full-width">
                <label>Rôle</label>
                <div className="checkbox-group" style={{ marginTop: 8 }}>
                  <label className="checkbox-item" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_admin}
                      onChange={(e) => handleChange('is_admin', e.target.checked)}
                    />
                    <span>Administrateur</span>
                  </label>
                </div>
                <small style={{ color: '#888', marginTop: 8, display: 'block' }}>
                  Les administrateurs ont accès au backoffice
                </small>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? 'Enregistrement...' : (isEditing ? 'Enregistrer' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserForm
