import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup, // ADD THIS
  GoogleAuthProvider, // ADD THIS
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase'; // UPDATE THIS

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>; // ADD THIS
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Hardcoded admin emails - replace with your actual admin emails
const ADMIN_EMAILS = [
  "akhyarahmad919@gmail.com",
  "ansuthisis789@gmaiil.com"
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  // ADD THIS FUNCTION
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // This gives you a Google Access Token. You can use it to access Google APIs.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      
      // The signed-in user info
      const user = result.user;
      console.log('Google sign-in successful:', user);
      
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Handle Errors here
      const errorCode = error.code;
      const errorMessage = error.message;
      
      // The email of the user's account used
      const email = error.customData?.email;
      
      // The AuthCredential type that was used
      const credential = GoogleAuthProvider.credentialFromError(error);
      
      throw new Error(errorMessage || 'Google sign-in failed');
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      return token;
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Check if user is admin based on email
      if (user && user.email && ADMIN_EMAILS.includes(user.email)) {
        setIsAdmin(true);
        // Store token for admin access
        user.getIdToken().then(token => {
          localStorage.setItem('firebaseToken', token);
        });
      } else {
        setIsAdmin(false);
        localStorage.removeItem('firebaseToken');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    getToken,
    isAdmin,
    signInWithGoogle, // ADD THIS
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};