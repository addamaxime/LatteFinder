import { useState, useEffect } from 'react'
import { supabase, supabaseAdmin } from './lib/supabase'
import CafeForm from './components/CafeForm'
import UserForm from './components/UserForm'
import DrinkForm from './components/DrinkForm'
import DeleteModal from './components/DeleteModal'
import ImportModal from './components/ImportModal'
import Login from './components/Login'


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

  // Drinks state
  const [drinks, setDrinks] = useState([])
  const [drinksLoading, setDrinksLoading] = useState(true)
  const [showDrinkForm, setShowDrinkForm] = useState(false)
  const [editingDrink, setEditingDrink] = useState(null)
  const [deletingDrink, setDeletingDrink] = useState(null)

  const [toast, setToast] = useState(null)

  // Vérifie si l'utilisateur est admin
  const checkAdmin = async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single()
      if (error) {
        console.error('checkAdmin error:', error)
        return false
      }
      return profile?.is_admin === true
    } catch (err) {
      console.error('checkAdmin exception:', err)
      return false
    }
  }

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if there's an existing session in localStorage
        const { data: { session } } = await supabase.auth.getSession()

        if (session?.user) {
          const isAdmin = await checkAdmin(session.user.id)
          if (isAdmin) {
            setUser(session.user)
          } else {
            await supabase.auth.signOut()
          }
        }
      } catch (err) {
        console.error('initAuth error:', err)
      } finally {
        setAuthLoading(false)
      }
    }

    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setAuthLoading(false)
    }, 5000)

    initAuth().finally(() => clearTimeout(timeout))

    // Listen for auth changes (logout, token refresh, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      fetchCafes()
      fetchUsers()
      fetchDrinks()
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
    try {
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
    } catch (err) {
      console.error('fetchCafes exception:', err)
      showToast('Erreur réseau', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
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
    } catch (err) {
      console.error('fetchUsers exception:', err)
      showToast('Erreur réseau', 'error')
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchDrinks = async () => {
    setDrinksLoading(true)
    try {
      const { data, error } = await supabase
        .from('drinks')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        showToast('Erreur lors du chargement des boissons', 'error')
        console.error(error)
      } else {
        setDrinks(data || [])
      }
    } catch (err) {
      console.error('fetchDrinks exception:', err)
      showToast('Erreur réseau', 'error')
    } finally {
      setDrinksLoading(false)
    }
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

  const handleSave = async (cafeData, cafeDrinks = []) => {
    let cafeId = editingCafe?.id

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
    } else {
      // Insert
      const { data, error } = await supabase
        .from('coffees')
        .insert([cafeData])
        .select('id')
        .single()

      if (error) {
        showToast('Erreur lors de l\'ajout', 'error')
        console.error(error)
        return false
      }
      cafeId = data.id
    }

    // Save coffee_drinks if editing
    if (editingCafe && cafeId) {
      // Delete existing coffee_drinks
      await supabase
        .from('coffee_drinks')
        .delete()
        .eq('coffee_id', cafeId)

      // Insert new coffee_drinks
      if (cafeDrinks.length > 0) {
        const drinksToInsert = cafeDrinks.map(cd => ({
          coffee_id: cafeId,
          drink_id: cd.drink_id,
          price: cd.price ? parseFloat(cd.price) : null,
          notes: cd.notes || null
        }))

        const { error: drinksError } = await supabase
          .from('coffee_drinks')
          .insert(drinksToInsert)

        if (drinksError) {
          console.error('Erreur coffee_drinks:', drinksError)
          showToast('Café sauvegardé mais erreur sur les boissons', 'error')
        }
      }
    }

    showToast(editingCafe ? 'Café modifié avec succès' : 'Café ajouté avec succès')
    setShowForm(false)
    fetchCafes()
    return true
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

  const uploadUserAvatar = async (userId, file) => {
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      return { url: publicUrl, error: null }
    } catch (error) {
      console.error('Avatar upload error:', error)
      return { url: null, error }
    }
  }

  const handleSaveUser = async (userData, avatarFile) => {
    const profileData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      username: userData.username,
      is_admin: userData.is_admin,
    }

    let userId = editingUser?.id

    if (editingUser) {
      // Mode édition - upload avatar si fourni
      if (avatarFile) {
        const { url, error: avatarError } = await uploadUserAvatar(editingUser.id, avatarFile)
        if (avatarError) {
          showToast('Erreur lors de l\'upload de l\'avatar', 'error')
        } else if (url) {
          profileData.avatar_url = url
        }
      }

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
        email_confirm: true,
      })

      if (authError) {
        showToast(authError.message || 'Erreur lors de la création', 'error')
        console.error(authError)
        return false
      }

      userId = authData.user.id

      // Upload avatar si fourni
      if (avatarFile) {
        const { url, error: avatarError } = await uploadUserAvatar(userId, avatarFile)
        if (avatarError) {
          showToast('Erreur lors de l\'upload de l\'avatar', 'error')
        } else if (url) {
          profileData.avatar_url = url
        }
      }

      // Mettre à jour le profil avec les infos supplémentaires
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)

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

  // Drink management functions
  const handleAddDrink = () => {
    setEditingDrink(null)
    setShowDrinkForm(true)
  }

  const handleEditDrink = (drink) => {
    setEditingDrink(drink)
    setShowDrinkForm(true)
  }

  const handleDeleteDrink = (drink) => {
    setDeletingDrink(drink)
  }

  const confirmDeleteDrink = async () => {
    const { error } = await supabase
      .from('drinks')
      .delete()
      .eq('id', deletingDrink.id)

    if (error) {
      showToast('Erreur lors de la suppression', 'error')
      console.error(error)
    } else {
      showToast('Boisson supprimée avec succès')
      fetchDrinks()
    }
    setDeletingDrink(null)
  }

  const handleSaveDrink = async (drinkData) => {
    if (editingDrink) {
      const { error } = await supabase
        .from('drinks')
        .update(drinkData)
        .eq('id', editingDrink.id)

      if (error) {
        showToast('Erreur lors de la modification', 'error')
        console.error(error)
        return false
      }
      showToast('Boisson modifiée avec succès')
    } else {
      const { error } = await supabase
        .from('drinks')
        .insert([drinkData])

      if (error) {
        showToast('Erreur lors de l\'ajout', 'error')
        console.error(error)
        return false
      }
      showToast('Boisson ajoutée avec succès')
    }

    setShowDrinkForm(false)
    setEditingDrink(null)
    fetchDrinks()
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
    return <Login onLoginSuccess={setUser} />
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
              className={`tab ${activeTab === 'drinks' ? 'active' : ''}`}
              onClick={() => setActiveTab('drinks')}
            >
              Boissons <span className="tab-count">{drinks.length}</span>
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
          {activeTab === 'drinks' && (
            <button className="btn-add" onClick={handleAddDrink}>
              <span>+</span> Ajouter une boisson
            </button>
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

      {activeTab === 'drinks' && (drinksLoading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Chargement des boissons...</p>
        </div>
      ) : drinks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍵</div>
          <p>Aucune boisson pour le moment</p>
          <button className="btn-add" onClick={handleAddDrink} style={{ marginTop: 16 }}>
            Ajouter votre première boisson
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Icône</th>
                <th>Nom</th>
                <th>Catégorie</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drinks.map((drink) => (
                <tr key={drink.id}>
                  <td>
                    <span className="drink-icon">{drink.icon || '☕'}</span>
                  </td>
                  <td>
                    <div className="drink-name">{drink.name}</div>
                  </td>
                  <td>
                    <span className="category-badge">{drink.category || '-'}</span>
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn-edit" onClick={() => handleEditDrink(drink)}>
                        Modifier
                      </button>
                      <button className="btn-delete" onClick={() => handleDeleteDrink(drink)}>
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
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="user-avatar-img" />
                      ) : (
                        (userProfile.first_name || userProfile.username || userProfile.email || '?')[0].toUpperCase()
                      )}
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

      {showDrinkForm && (
        <DrinkForm
          drink={editingDrink}
          onSave={handleSaveDrink}
          onClose={() => {
            setShowDrinkForm(false)
            setEditingDrink(null)
          }}
        />
      )}

      {deletingDrink && (
        <div className="modal-overlay" onClick={() => setDeletingDrink(null)}>
          <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-body">
              <div className="delete-icon">⚠️</div>
              <h3>Supprimer la boisson ?</h3>
              <p>
                Voulez-vous vraiment supprimer <strong>{deletingDrink.name}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="delete-actions">
                <button className="btn-cancel" onClick={() => setDeletingDrink(null)}>
                  Annuler
                </button>
                <button className="btn-confirm-delete" onClick={confirmDeleteDrink}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
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
