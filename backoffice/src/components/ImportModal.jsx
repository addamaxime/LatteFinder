import { useState } from 'react'

function ImportModal({ onImport, onClose }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const extractBusinessName = async (googleUrl) => {
    // Try to extract business name from Google share URL
    // These URLs typically redirect and contain the business name in query params

    try {
      // For share.google URLs, we need to follow redirects
      // Since we can't do that directly from browser, we'll try to parse the URL

      // Method 1: If it's already a maps URL with query params
      if (googleUrl.includes('q=')) {
        const urlObj = new URL(googleUrl)
        const query = urlObj.searchParams.get('q')
        if (query) {
          return decodeURIComponent(query.replace(/\+/g, ' '))
        }
      }

      // Method 2: Use a CORS proxy to follow redirects
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(googleUrl)}`

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        }
      })

      const html = await response.text()

      // Try to extract from meta tags or title
      const titleMatch = html.match(/<title[^>]*>([^<]+)</i)
      if (titleMatch) {
        let title = titleMatch[1]
        // Clean up common suffixes
        title = title.replace(/ - Google Maps.*$/i, '')
        title = title.replace(/ - Google.*$/i, '')
        title = title.replace(/ \| Google.*$/i, '')
        if (title && title.length > 2) {
          return title.trim()
        }
      }

      // Try to extract from URL in the response
      const urlMatch = html.match(/q=([^&"]+)/i)
      if (urlMatch) {
        return decodeURIComponent(urlMatch[1].replace(/\+/g, ' '))
      }

      return null
    } catch (err) {
      console.error('Error extracting business name:', err)
      return null
    }
  }

  const searchBusinessInfo = async (businessName) => {
    // Search for business info using a public API
    try {
      // Use Nominatim (OpenStreetMap) for geocoding if we have an address
      // For now, we'll return what we have and let user fill in details

      return {
        name: businessName,
        // Other fields will need to be filled manually
      }
    } catch (err) {
      console.error('Error searching business:', err)
      return { name: businessName }
    }
  }

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Veuillez entrer une URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Extract business name from URL
      const businessName = await extractBusinessName(url.trim())

      if (!businessName) {
        setError('Impossible d\'extraire les informations. Vérifiez l\'URL.')
        setLoading(false)
        return
      }

      // Search for more info
      const businessInfo = await searchBusinessInfo(businessName)

      // Return the extracted data
      onImport({
        name: businessInfo.name || '',
        address: businessInfo.address || '',
        latitude: businessInfo.latitude || '',
        longitude: businessInfo.longitude || '',
        description: businessInfo.description || '',
        phone: businessInfo.phone || '',
        image: '',
        latte_types: ['matcha', 'chai', 'cafe', 'iced'],
        hours: {},
        social: {},
        // Include the source URL for reference
        _sourceUrl: url.trim()
      })

    } catch (err) {
      console.error('Import error:', err)
      setError('Erreur lors de l\'import. Vérifiez l\'URL et réessayez.')
    }

    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Importer un café</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="import-instructions">
            <p>Collez l'URL d'une fiche Google Maps pour importer automatiquement les informations du café.</p>
            <p className="import-hint">
              Exemple: https://share.google/... ou https://maps.google.com/...
            </p>
          </div>

          <div className="form-group">
            <label>URL Google Maps</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://share.google/..."
              autoFocus
            />
          </div>

          {error && (
            <div className="import-error">
              {error}
            </div>
          )}

          <div className="import-note">
            <strong>Note:</strong> L'import extraira le nom du café. Vous pourrez compléter les autres informations (adresse, horaires, etc.) dans le formulaire.
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="btn-save"
            onClick={handleImport}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Import en cours...
              </>
            ) : (
              'Importer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImportModal
