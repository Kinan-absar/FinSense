import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  doc, 
  deleteDoc, 
  setDoc, 
  updateDoc,
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { Transaction, BudgetGoal, Account, UserSettings, UserProfile } from "../types";

const cleanObject = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  const newObj: any = Array.isArray(obj) ? [] : {};
  
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    // Exclude undefined and complex circular parts if any
    if (val === undefined) return;
    
    // Primitive or simple object
    if (val === null || typeof val !== 'object') {
      newObj[key] = val;
    } else if (val.nanoseconds !== undefined && val.seconds !== undefined) {
      // Keep Firestore timestamps as is
      newObj[key] = val;
    } else {
      // Basic plain object or array
      try {
        newObj[key] = JSON.parse(JSON.stringify(val));
      } catch (e) {
        // Fallback for non-serializable parts
        newObj[key] = null;
      }
    }
  });
  return newObj;
};

export const dataService = {
  ensureUserProfile: async (userId: string, email: string) => {
    if (!userId) return;
    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);
    const baseData = { email: email || '', lastLogin: serverTimestamp(), uid: userId };

    if (!userSnap.exists()) {
      return setDoc(userDocRef, { ...baseData, name: email ? email.split('@')[0] : 'User', createdAt: serverTimestamp() });
    } else {
      const currentData = userSnap.data();
      const updates: any = { ...baseData };
      if (!currentData.name) updates.name = email ? email.split('@')[0] : 'User';
      return setDoc(userDocRef, updates, { merge: true });
    }
  },

  updateUserProfile: async (userId: string, data: Partial<UserProfile>) => {
    if (!userId) return;
    return updateDoc(doc(db, "users", userId), cleanObject(data));
  },

  subscribeToUserProfile: (userId: string, callback: (profile: UserProfile | null) => void) => {
    if (!userId) return () => {};
    return onSnapshot(doc(db, "users", userId), (doc) => {
      callback(doc.exists() ? (doc.data() as UserProfile) : null);
    });
  },

  subscribeToSettings: (userId: string, callback: (settings: UserSettings | null) => void) => {
    if (!userId) return () => {};
    return onSnapshot(doc(db, "users", userId, "config", "preferences"), (doc) => {
      callback(doc.exists() ? (doc.data() as UserSettings) : null);
    });
  },

  saveSettings: async (userId: string, settings: UserSettings) => {
    if (!userId) return;
    return setDoc(doc(db, "users", userId, "config", "preferences"), { ...cleanObject(settings), updatedAt: serverTimestamp() });
  },

  subscribe: <T>(userId: string, subCollection: string, callback: (data: T[]) => void) => {
    if (!userId) return () => {};
    const q = query(collection(db, "users", userId, subCollection));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as T[];
      callback(data);
    }, (error) => {
      console.error(`Subscription error for ${subCollection}:`, error);
    });
  },

  addTransaction: async (userId: string, transaction: Omit<Transaction, 'id' | 'userId'>) => {
    if (!userId) return;
    return addDoc(collection(db, "users", userId, "transactions"), cleanObject({ ...transaction, userId, createdAt: serverTimestamp() }));
  },

  updateTransaction: async (userId: string, transactionId: string, transaction: Partial<Transaction>) => {
    if (!userId || !transactionId) return;
    const docRef = doc(db, "users", userId, "transactions", transactionId);
    return updateDoc(docRef, cleanObject({ ...transaction, updatedAt: serverTimestamp() }));
  },

  deleteTransaction: async (userId: string, transactionId: string) => {
    if (!userId || !transactionId) return;
    try {
      const docRef = doc(db, "users", userId, "transactions", transactionId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Failed to delete transaction", e);
      throw e;
    }
  },

  saveGoal: async (userId: string, goal: Omit<BudgetGoal, 'id' | 'userId'> & { id?: string }) => {
    if (!userId) return;
    const { id, ...data } = goal;
    const docRef = (id && id.length > 15) ? doc(db, "users", userId, "budgets", id) : doc(collection(db, "users", userId, "budgets"));
    return setDoc(docRef, { ...cleanObject(data), userId, createdAt: serverTimestamp() }, { merge: true });
  },

  deleteGoal: async (userId: string, goalId: string) => {
    if (!userId || !goalId) return;
    try {
      const docRef = doc(db, "users", userId, "budgets", goalId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Failed to delete goal", e);
      throw e;
    }
  },

  saveAccount: async (userId: string, account: Omit<Account, 'id' | 'userId'> & { id?: string }) => {
    if (!userId) return;
    const { id, ...data } = account;
    const docRef = (id && id.length > 15) ? doc(db, "users", userId, "accounts", id) : doc(collection(db, "users", userId, "accounts"));
    return setDoc(docRef, { ...cleanObject(data), userId, createdAt: serverTimestamp() }, { merge: true });
  },

  updateAccountBalance: async (userId: string, accountId: string, newBalance: number) => {
    if (!userId || !accountId) return;
    return updateDoc(doc(db, "users", userId, "accounts", accountId), { balance: newBalance });
  },

  deleteAccount: async (userId: string, accountId: string) => {
    if (!userId || !accountId) return;
    try {
      const docRef = doc(db, "users", userId, "accounts", accountId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Failed to delete account", e);
      throw e;
    }
  }
};