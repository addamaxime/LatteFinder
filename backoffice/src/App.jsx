import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import CafeForm from './components/CafeForm'
import DeleteModal from './components/DeleteModal'
import ImportModal from './components/ImportModal'
import Login from './components/Login'

const LATTE_TYPES = ['matcha', 'chai', 'cafe', 'iced']

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingCafe, setEditingCafe] = useState(null)
  const [importedData, setImportedData] = useState(null)
  const [deletingCafe, setDeletingCafe] = useState(null)
  const [toast, setToast] = useState(null)

  // Vérifie si l'utilisateur est admin
  const checkAdmin = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single()
    return profile?.is_admin === true
  }

  // Check authentication on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const isAdmin = await checkAdmin(session.user.id)
        if (isAdmin) {
          setUser(session.user)
        } else {
          await supabase.auth.signOut()
        }
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const isAdmin = await checkAdmin(session.user.id)
        if (isAdmin) {
          setUser(session.user)
        } else {
          await supabase.auth.signOut()
          setUser(null)
        }
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCafes()
    }
  }, [user])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchCafes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('coffees')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      showToast('Erreur lors du chargement des cafés', 'error')
      console.error(error)
    } else {
      setCafes(data || [])
    }
    setLoading(false)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const handleAdd = () => {
    setEditingCafe(null)
    setImportedData(null)
    setShowForm(true)
  }

  const handleImport = (data) => {
    setShowImport(false)
    setEditingCafe(null)
    setImportedData(data)
    setShowForm(true)
    showToast('Données importées - Complétez le formulaire', 'success')
  }

  const handleEdit = (cafe) => {
    setEditingCafe(cafe)
    setImportedData(null)
    setShowForm(true)
  }

  const handleDelete = (cafe) => {
    setDeletingCafe(cafe)
  }

  const confirmDelete = async () => {
    const { error } = await supabase
      .from('coffees')
      .delete()
      .eq('id', deletingCafe.id)

    if (error) {
      showToast('Erreur lors de la suppression', 'error')
      console.error(error)
    } else {
      showToast('Café supprimé avec succès')
      fetchCafes()
    }
    setDeletingCafe(null)
  }

  const handleSave = async (cafeData) => {
    if (editingCafe) {
      const { error } = await supabase
        .from('coffees')
        .update(cafeData)
        .eq('id', editingCafe.id)

      if (error) {
        showToast('Erreur lors de la modification', 'error')
        console.error(error)
        return false
      }
      showToast('Café modifié avec succès')
    } else {
      // Insert
      const { error } = await supabase
        .from('coffees')
        .insert([cafeData])

      if (error) {
        showToast('Erreur lors de l\'ajout', 'error')
        console.error(error)
        return false
      }
      showToast('Café ajouté avec succès')
    }

    setShowForm(false)
    fetchCafes()
    return true
  }

  const formatLatteTypes = (types) => {
    if (!types || types.length === 0) return '-'
    const labels = {
      matcha: 'Matcha',
      chai: 'Chai',
      cafe: 'Café',
      iced: 'Iced'
    }
    return types.map(t => labels[t] || t)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="login-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  // Show login if not authenticated
  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="container">
      <header className="header">
        <div>
          <h1>LatteFinder Backoffice</h1>
          <p className="header-subtitle">Gestion des cafés</p>
        </div>
        <div className="header-actions">
          <button className="btn-import" onClick={() => setShowImport(true)}>
            <span>📥</span> Importer
          </button>
          <button className="btn-add" onClick={handleAdd}>
            <span>+</span> Ajouter un café
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Chargement des cafés...</p>
        </div>
      ) : cafes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">☕</div>
          <p>Aucun café pour le moment</p>
          <button className="btn-add" onClick={handleAdd} style={{ marginTop: 16 }}>
            Ajouter votre premier café
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Nom</th>
                <th>Lattes</th>
                <th>Téléphone</th>
                <th>Coordonnées</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cafes.map((cafe) => (
                  <tr key={cafe.id}>
                    <td>
                      <div className="cafe-image-container">
                        {cafe.image ? (
                          <img
                            src={cafe.image}
                            alt={cafe.name}
                            className="cafe-image"
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.style.display = 'none'
                              e.target.parentElement.classList.add('no-image')
                            }}
                          />
                        ) : (
                          <div className="cafe-image-placeholder">☕</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cafe-name">{cafe.name}</div>
                      <div className="cafe-address">{cafe.address}</div>
                    </td>
                    <td>
                      <div className="latte-tags">
                        {formatLatteTypes(cafe.latte_types).map((type, i) => (
                          <span key={i} className="latte-tag">{type}</span>
                        ))}
                      </div>
                    </td>
                    <td>{cafe.phone || '-'}</td>
                    <td>
                      <small>{cafe.latitude?.toFixed(4)}, {cafe.longitude?.toFixed(4)}</small>
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-edit" onClick={() => handleEdit(cafe)}>
                          Modifier
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(cafe)}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <CafeForm
          cafe={editingCafe}
          importedData={importedData}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false)
            setImportedData(null)
          }}
        />
      )}

      {showImport && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {deletingCafe && (
        <DeleteModal
          cafe={deletingCafe}
          onConfirm={confirmDelete}
          onClose={() => setDeletingCafe(null)}
        />
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default App
