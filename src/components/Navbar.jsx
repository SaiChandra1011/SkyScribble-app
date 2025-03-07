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
    <div className="fixed top-0 left-0 w-full bg-blue-50 shadow-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div>
            <Link to="/" className="text-xl font-bold text-blue-600">
              SkyScribble
            </Link>
          </div>
          <div>
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : (
              <>
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-700">
                      {user.displayName || user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      disabled={authLoading}
                      className={`bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium ${
                        authLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={authLoading}
                    className={`bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium ${
                      authLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'
                    }`}
                  >
                    Sign In with Google
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar; 