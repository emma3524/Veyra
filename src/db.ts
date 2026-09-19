/**
 * db.ts — all Firestore read/write helpers for ExpenseFlow
 *
 * Data layout in Firestore:
 *   users/{uid}/transactions/{txId}
 *   users/{uid}/notifications/{notifId}
 *   users/{uid}/profile   (single document)
 */

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Path helpers ─────────────────────────────────────────────────────────────

const txCol      = (uid: string) => collection(db, 'users', uid, 'transactions');
const txDoc      = (uid: string, id: string) => doc(db, 'users', uid, 'transactions', id);
const notifCol   = (uid: string) => collection(db, 'users', uid, 'notifications');
const notifDoc   = (uid: string, id: string) => doc(db, 'users', uid, 'notifications', id);
const profileDoc = (uid: string) => doc(db, 'users', uid, 'profile');

// ─── Types (mirrors App.tsx) ──────────────────────────────────────────────────

export type TxRecord = {
  id: string;
  date: string;
  description: string;
  category: string;
  categoryColor: string;
  type: 'Income' | 'Expense';
  amount: string;
  rawAmount: number;
  createdAt?: unknown;
};

export type NotifRecord = {
  id: string;
  text: string;
  read: boolean;
  createdAt?: unknown;
};

export type ProfileRecord = {
  displayName: string;
  currency: string;
};

// ─── Transactions ─────────────────────────────────────────────────────────────

/** Real-time listener — calls cb whenever the user's transactions change */
export function subscribeTransactions(
  uid: string,
  cb: (txs: TxRecord[]) => void,
): Unsubscribe {
  const q = query(txCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snapshot => {
    const txs: TxRecord[] = snapshot.docs.map(d => ({
      ...(d.data() as Omit<TxRecord, 'id'>),
      id: d.id,
    }));
    cb(txs);
  });
}

/** Add a brand-new transaction */
export async function addTransaction(
  uid: string,
  tx: Omit<TxRecord, 'id' | 'createdAt'>,
): Promise<void> {
  await addDoc(txCol(uid), { ...tx, createdAt: serverTimestamp() });
}

/** Overwrite an existing transaction (same id) */
export async function updateTransaction(
  uid: string,
  tx: TxRecord,
): Promise<void> {
  const { id, ...data } = tx;
  await setDoc(txDoc(uid, id), { ...data, createdAt: data.createdAt ?? serverTimestamp() });
}

/** Delete a transaction by id */
export async function deleteTransaction(
  uid: string,
  id: string,
): Promise<void> {
  await deleteDoc(txDoc(uid, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────

/** Real-time listener for notifications */
export function subscribeNotifications(
  uid: string,
  cb: (notifs: NotifRecord[]) => void,
): Unsubscribe {
  const q = query(notifCol(uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snapshot => {
    const notifs: NotifRecord[] = snapshot.docs.map(d => ({
      ...(d.data() as Omit<NotifRecord, 'id'>),
      id: d.id,
    }));
    cb(notifs);
  });
}

/** Add a notification */
export async function addNotification(
  uid: string,
  text: string,
): Promise<void> {
  await addDoc(notifCol(uid), {
    text,
    read: false,
    createdAt: serverTimestamp(),
  });
}

/** Mark a single notification as read */
export async function markNotificationRead(
  uid: string,
  id: string,
): Promise<void> {
  await updateDoc(notifDoc(uid, id), { read: true });
}

/** Mark all notifications as read */
export async function markAllNotificationsRead(
  uid: string,
  ids: string[],
): Promise<void> {
  await Promise.all(ids.map(id => updateDoc(notifDoc(uid, id), { read: true })));
}

/** Delete a single notification */
export async function deleteNotification(
  uid: string,
  id: string,
): Promise<void> {
  await deleteDoc(notifDoc(uid, id));
}

/** Delete all notifications */
export async function clearAllNotifications(
  uid: string,
  ids: string[],
): Promise<void> {
  await Promise.all(ids.map(id => deleteDoc(notifDoc(uid, id))));
}

// ─── User profile ─────────────────────────────────────────────────────────────

/** Load profile once */
export async function getProfile(uid: string): Promise<ProfileRecord | null> {
  const snap = await getDoc(profileDoc(uid));
  return snap.exists() ? (snap.data() as ProfileRecord) : null;
}

/** Create or update profile */
export async function saveProfile(
  uid: string,
  data: Partial<ProfileRecord>,
): Promise<void> {
  await setDoc(profileDoc(uid), data, { merge: true });
}
