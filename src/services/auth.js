import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { createOrGetUser } from './api';

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Store user in database
    const userData = {
      google_id: user.uid,
      email: user.email,
      display_name: user.displayName
    };
    
    const dbUser = await createOrGetUser(userData);
    
    // Combine Firebase user with database user
    return { ...user, dbId: dbUser.id };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        if (user) {
          // If user is logged in, get their database record
          createOrGetUser({
            google_id: user.uid,
            email: user.email,
            display_name: user.displayName
          })
            .then(dbUser => {
              resolve({ ...user, dbId: dbUser.id });
            })
            .catch(error => {
              console.error('Error getting user from database:', error);
              resolve(user);
            });
        } else {
          resolve(null);
        }
      },
      reject
    );
  });
};

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
}; 