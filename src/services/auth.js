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
    
    console.log("Google Auth successful, user:", user);
    
    // Store user in database
    const userData = {
      google_id: user.uid,
      email: user.email,
      display_name: user.displayName || user.email.split('@')[0]
    };
    
    console.log("Sending user data to database:", userData);
    
    try {
      const dbUser = await createOrGetUser(userData);
      console.log("Database user created/retrieved:", dbUser);
      return { ...user, dbId: dbUser.id };
    } catch (dbError) {
      console.error("Failed to store user in database:", dbError);
      // Return Firebase user even if database storage fails
      return user;
    }
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
          console.log("Firebase user found, retrieving from database:", user.uid);
          
          createOrGetUser({
            google_id: user.uid,
            email: user.email,
            display_name: user.displayName || user.email.split('@')[0]
          })
            .then(dbUser => {
              console.log("Database user retrieved:", dbUser);
              // Ensure we use 'id' consistently, not 'dbId'
              resolve({ 
                ...user, 
                id: dbUser.id, // Use 'id' as the property name
                dbId: dbUser.id, // Keep dbId for backward compatibility
                dbUser: dbUser // Include the full DB user object
              });
            })
            .catch(error => {
              console.error('Error getting user from database:', error);
              resolve(user); // This user won't have an 'id' property
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