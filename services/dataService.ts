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
import {
  Transaction,
  BudgetGoal,
  Account,
  UserSettings,
  UserProfile
} from "../types";

const cleanObject = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach((key) => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

export const dataService = {

  /* ================================
     USER PROFILE
  ================================= */

  ensureUserProfile: async (userId: string, email: string) => {
    if (!userId) return;

    const userDocRef = doc(db, "users", userId);
    const userSnap = await getDoc(userDocRef);

    const baseData = {
      email: email || "",
      lastLogin: serverTimestamp()
    };

    if (!userSnap.exists()) {
      return setDoc(userDocRef, {
        ...baseData,
        name: email ? email.split("@")[0] : "User",
        createdAt: serverTimestamp()
      });
    } else {
      const currentData = userSnap.data();
      const updates: any = { ...baseData };

      if (!currentData.name) {
        updates.name = email ? email.split("@")[0] : "User";
      }

      return setDoc(userDocRef, updates, { merge: true });
    }
  },

  updateUserProfile: async (
    userId: string,
    data: Partial<UserProfile>
  ) => {
    if (!userId) return;

    return updateDoc(doc(db, "users", userId), {
      ...cleanObject(data),
      updatedAt: serverTimestamp()
    });
  },

  subscribeToUserProfile: (
    userId: string,
    callback: (profile: UserProfile | null) => void
  ) => {
    if (!userId) return () => {};

    return onSnapshot(doc(db, "users", userId), (snapshot) => {
      callback(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    });
  },

  /* ================================
     SETTINGS
  ================================= */

  subscribeToSettings: (
    userId: string,
    callback: (settings: UserSettings | null) => void
  ) => {
    if (!userId) return () => {};

    return onSnapshot(
      doc(db, "users", userId, "config", "preferences"),
      (snapshot) => {
        callback(snapshot.exists() ? (snapshot.data() as UserSettings) : null);
      }
    );
  },

  saveSettings: async (userId: string, settings: UserSettings) => {
    if (!userId) return;

    return setDoc(
      doc(db, "users", userId, "config", "preferences"),
      {
        ...cleanObject(settings),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  },

  /* ================================
     GENERIC SUBSCRIPTION
  ================================= */

  subscribe: <T>(
    userId: string,
    subCollection: string,
    callback: (data: T[]) => void
  ) => {
    if (!userId) return () => {};

    const q = query(collection(db, "users", userId, subCollection));

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          ...d.data(),
          id: d.id
        })) as T[];

        callback(data);
      },
      (error) => {
        console.error(`Subscription error for ${subCollection}:`, error);
      }
    );
  },

  /* ================================
     TRANSACTIONS
  ================================= */

  addTransaction: async (
    userId: string,
    transaction: Omit<Transaction, "id">
  ) => {
    if (!userId) return;

    return addDoc(
      collection(db, "users", userId, "transactions"),
      cleanObject({
        ...transaction,
        createdAt: serverTimestamp()
      })
    );
  },

  updateTransaction: async (
    userId: string,
    transactionId: string,
    data: Partial<Transaction>
  ) => {
    if (!userId || !transactionId) return;

    return updateDoc(
      doc(db, "users", userId, "transactions", transactionId),
      {
        ...cleanObject(data),
        updatedAt: serverTimestamp()
      }
    );
  },

  deleteTransaction: async (
    userId: string,
    transactionId: string
  ) => {
    if (!userId || !transactionId) return;

    return deleteDoc(
      doc(db, "users", userId, "transactions", transactionId)
    );
  },

  /* ================================
     BUDGETS
  ================================= */

  saveGoal: async (
    userId: string,
    goal: Omit<BudgetGoal, "id"> & { id?: string }
  ) => {
    if (!userId) return;

    const { id, ...data } = goal;

    const docRef = id
      ? doc(db, "users", userId, "budgets", id)
      : doc(collection(db, "users", userId, "budgets"));

    return setDoc(
      docRef,
      cleanObject({
        ...data,
        updatedAt: serverTimestamp(),
        ...(id ? {} : { createdAt: serverTimestamp() })
      }),
      { merge: true }
    );
  },

  deleteGoal: async (userId: string, goalId: string) => {
    if (!userId || !goalId) return;

    return deleteDoc(
      doc(db, "users", userId, "budgets", goalId)
    );
  },

  /* ================================
     ACCOUNTS
  ================================= */

  saveAccount: async (
    userId: string,
    account: Omit<Account, "id"> & { id?: string }
  ) => {
    if (!userId) return;

    const { id, ...data } = account;

    const docRef = id
      ? doc(db, "users", userId, "accounts", id)
      : doc(collection(db, "users", userId, "accounts"));

    return setDoc(
      docRef,
      cleanObject({
        ...data,
        updatedAt: serverTimestamp(),
        ...(id ? {} : { createdAt: serverTimestamp() })
      }),
      { merge: true }
    );
  },

  updateAccountBalance: async (
    userId: string,
    accountId: string,
    newBalance: number
  ) => {
    if (!userId || !accountId) return;

    return updateDoc(
      doc(db, "users", userId, "accounts", accountId),
      {
        balance: newBalance,
        updatedAt: serverTimestamp()
      }
    );
  },

  deleteAccount: async (userId: string, accountId: string) => {
    if (!userId || !accountId) return;

    return deleteDoc(
      doc(db, "users", userId, "accounts", accountId)
    );
  }
};
