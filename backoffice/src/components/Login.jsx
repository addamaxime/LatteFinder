import { useState } from 'react'
import { supabase, loginWithEmail } from '../lib/supabase'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Use custom login that bypasses buggy signInWithPassword
      const { user } = await loginWithEmail(email, password)

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        await supabase.auth.signOut()
        setError('Erreur lors de la vérification des droits')
        setLoading(false)
        return
      }

      if (!profile?.is_admin) {
        await supabase.auth.signOut()
        setError('Accès non autorisé - compte non admin')
        setLoading(false)
        return
      }

      // Success - notify parent
      onLoginSuccess(user)
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Email ou mot de passe incorrect')
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>LatteFinder</h1>
          <p>Backoffice Administration</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
