import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white shadow-md"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-blue-600">AirlineReviews</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === '/'
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Home
              </Link>
              <Link
                to="/airlines"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === '/airlines' || location.pathname.startsWith('/airlines/')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Airlines
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : (
              <>
                {user ? (
                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      {user.photoURL && (
                        <img 
                          src={user.photoURL} 
                          alt="Profile" 
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      <span className="text-sm text-gray-700">
                        {user.displayName || user.email}
                      </span>
                    </div>
                    <button
                      onClick={handleSignOut}
                      disabled={authLoading}
                      className={`bg-white text-gray-700 border border-gray-300 rounded-md px-4 py-2 text-sm font-medium ${
                        authLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      {authLoading ? 'Signing Out...' : 'Sign Out'}
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
                    {authLoading ? 'Signing In...' : 'Sign In with Google'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar; 