import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { signInWithGoogle, signOut, getCurrentUser } from '../services/auth';

const Navbar = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      const user = await signInWithGoogle();
      setUser(user);
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setAuthLoading(true);
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 shadow-md z-50" style={{ 
      backgroundColor: '#4285F4',
      width: '100%',
      overflowX: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        width: '100%', 
        height: '64px', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 20px',
        boxSizing: 'border-box'
      }}>
        {/* Logo - extreme left */}
        <div>
          <Link to="/" style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', textDecoration: 'none' }}>
            SkyScribble
          </Link>
        </div>
        
        {/* Auth section - extreme right */}
        <div>
          {loading ? (
            <div style={{ color: 'white', fontSize: '14px' }}>Loading...</div>
          ) : (
            <>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: 'white', fontSize: '14px', marginRight: '16px' }}>
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    disabled={authLoading}
                    style={{
                      backgroundColor: 'white',
                      color: '#dc2626',
                      borderRadius: '4px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: authLoading ? 'not-allowed' : 'pointer',
                      opacity: authLoading ? 0.7 : 1
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleSignIn}
                  disabled={authLoading}
                  style={{
                    backgroundColor: 'white',
                    color: '#dc2626',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: authLoading ? 'not-allowed' : 'pointer',
                    opacity: authLoading ? 0.7 : 1
                  }}
                >
                  Sign In with Google
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar; 