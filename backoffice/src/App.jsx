import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from './lib/supabase'
import CafeForm from './components/CafeForm'
import UserForm from './components/UserForm'
import DeleteModal from './components/DeleteModal'
import ImportModal from './components/ImportModal'
import Login from './components/Login'

const LATTE_TYPES = ['matcha', 'chai', 'cafe', 'iced']

function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('cafes')

  // Cafes state
  const [cafes, setCafes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingCafe, setEditingCafe] = useState(null)
  const [importedData, setImportedData] = useState(null)
  const [deletingCafe, setDeletingCafe] = useState(null)

  // Users state
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)

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
      fetchUsers()
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

  const fetchUsers = async () => {
    setUsersLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      showToast('Erreur lors du chargement des utilisateurs', 'error')
      console.error(error)
    } else {
      setUsers(data || [])
    }
    setUsersLoading(false)
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

  // User management functions
  const handleAddUser = () => {
    setEditingUser(null)
    setShowUserForm(true)
  }

  const handleEditUser = (userProfile) => {
    setEditingUser(userProfile)
    setShowUserForm(true)
  }

  const handleDeleteUser = (userProfile) => {
    setDeletingUser(userProfile)
  }

  const confirmDeleteUser = async () => {
    // Supprimer d'abord le profil, puis l'utilisateur auth
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', deletingUser.id)

    if (profileError) {
      showToast('Erreur lors de la suppression du profil', 'error')
      console.error(profileError)
      setDeletingUser(null)
      return
    }

    // Supprimer l'utilisateur auth si supabaseAdmin est disponible
    if (supabaseAdmin) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(deletingUser.id)
      if (authError) {
        console.error('Erreur suppression auth:', authError)
      }
    }

    showToast('Utilisateur supprimé avec succès')
    fetchUsers()
    setDeletingUser(null)
  }

  const handleSaveUser = async (userData) => {
    const profileData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      is_admin: userData.is_admin,
    }

    if (editingUser) {
      // Mode édition
      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', editingUser.id)

      if (error) {
        showToast('Erreur lors de la modification', 'error')
        console.error(error)
        return false
      }
      showToast('Utilisateur modifié avec succès')
    } else {
      // Mode création
      if (!supabaseAdmin) {
        showToast('Clé service_role manquante pour créer des utilisateurs', 'error')
        return false
      }

      // Créer l'utilisateur via l'API admin
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Confirmer l'email automatiquement
      })

      if (authError) {
        showToast(authError.message || 'Erreur lors de la création', 'error')
        console.error(authError)
        return false
      }

      // Mettre à jour le profil avec les infos supplémentaires
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', authData.user.id)

      if (profileError) {
        console.error('Erreur mise à jour profil:', profileError)
      }

      showToast('Utilisateur créé avec succès')
    }

    setShowUserForm(false)
    setEditingUser(null)
    fetchUsers()
    return true
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
          <p className="header-subtitle">Administration</p>
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'cafes' ? 'active' : ''}`}
              onClick={() => setActiveTab('cafes')}
            >
              Cafés <span className="tab-count">{cafes.length}</span>
            </button>
            <button
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              Utilisateurs <span className="tab-count">{users.length}</span>
            </button>
          </div>
        </div>
        <div className="header-actions">
          {activeTab === 'cafes' && (
            <>
              <button className="btn-import" onClick={() => setShowImport(true)}>
                <span>📥</span> Importer
              </button>
              <button className="btn-add" onClick={handleAdd}>
                <span>+</span> Ajouter un café
              </button>
            </>
          )}
          {activeTab === 'users' && (
            <button className="btn-add" onClick={handleAddUser}>
              <span>+</span> Ajouter un utilisateur
            </button>
          )}
          <button className="btn-logout" onClick={handleLogout}>
            Déconnexion
          </button>
        </div>
      </header>

      {activeTab === 'cafes' && (loading ? (
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
      ))}

      {activeTab === 'users' && (usersLoading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <p>Aucun utilisateur pour le moment</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Date d'inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userProfile) => (
                <tr key={userProfile.id}>
                  <td>
                    <div className="user-avatar">
                      {(userProfile.first_name || userProfile.username || userProfile.email || '?')[0].toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div className="user-name">
                      {userProfile.first_name || userProfile.last_name
                        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
                        : userProfile.username || 'Sans nom'}
                    </div>
                    <div className="user-email">{userProfile.email}</div>
                  </td>
                  <td>
                    <span className={userProfile.is_admin ? 'admin-badge' : 'user-badge'}>
                      {userProfile.is_admin ? 'Admin' : 'Utilisateur'}
                    </span>
                  </td>
                  <td>
                    <small>
                      {userProfile.created_at
                        ? new Date(userProfile.created_at).toLocaleDateString('fr-FR')
                        : '-'}
                    </small>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-edit" onClick={() => handleEditUser(userProfile)}>
                        Modifier
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteUser(userProfile)}>
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

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

      {showUserForm && (
        <UserForm
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowUserForm(false)
            setEditingUser(null)
          }}
        />
      )}

      {deletingUser && (
        <div className="modal-overlay" onClick={() => setDeletingUser(null)}>
          <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-body">
              <div className="delete-icon">⚠️</div>
              <h3>Supprimer l'utilisateur ?</h3>
              <p>
                Voulez-vous vraiment supprimer <strong>{deletingUser.username || deletingUser.email}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="delete-actions">
                <button className="btn-cancel" onClick={() => setDeletingUser(null)}>
                  Annuler
                </button>
                <button className="btn-confirm-delete" onClick={confirmDeleteUser}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
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
