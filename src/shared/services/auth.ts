import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, app } from './firebase';
import type { UserDoc, UserRole } from '../types';

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function getUserRoleDoc(uid: string): Promise<UserDoc | null> {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as UserDoc;
}

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, name: string, phone: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  const user = result.user;
  
  const newUserDoc: Omit<UserDoc, 'uid'> = {
    name,
    phone,
    role: 'pending', // Default ditahan
    memberId: null,
    createdAt: new Date().toISOString(),
  };
  
  await setDoc(doc(db, 'users', user.uid), newUserDoc);
  return user;
}

export function subscribeAuth(callback: (user: User | null, roleDoc: UserDoc | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null, null);
      return;
    }
    try {
      let roleDoc = await getUserRoleDoc(firebaseUser.uid);
      
      // Auto-create doc if missing (solves Google Login race condition)
      if (!roleDoc) {
        const newUserDoc: Omit<UserDoc, 'uid'> = {
          name: firebaseUser.displayName || 'User',
          phone: firebaseUser.phoneNumber || '',
          role: 'pending',
          memberId: null,
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), newUserDoc);
        roleDoc = { uid: firebaseUser.uid, ...newUserDoc } as UserDoc;
      }
      
      callback(firebaseUser, roleDoc);
    } catch (e) {
      callback(firebaseUser, null);
    }
  });
}

export async function updateUserProfile(uid: string, name: string, phone: string) {
  await updateDoc(doc(db, 'users', uid), { name, phone });
}
