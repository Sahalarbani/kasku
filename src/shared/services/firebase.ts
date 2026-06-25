/* v2.1.0 | Firebase service with multi-member support and logging */
import { initializeApp } from 'firebase/app';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { AppLog, Member, Transaction, UserDoc, UserRole, PaymentRequest } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export function useFirebaseData() {
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let pendingData = 2;
    const qMembers = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      setMembers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Member));
      if (--pendingData <= 0) setLoading(false);
    }, (err) => console.error(err));

    const qTransactions = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction));
      if (--pendingData <= 0) setLoading(false);
    }, (err) => console.error(err));

    return () => { unsubMembers(); unsubTransactions(); };
  }, []);
  return { members, transactions, loading };
}

export function useUsersData() {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserDoc));
      setLoading(false);
    }, (err) => console.error(err));
    return () => unsub();
  }, []);
  return { users, loading };
}

export function useAppLogs() {
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'logs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as AppLog));
      setLoading(false);
    }, (err) => console.error(err));
    return () => unsub();
  }, []);
  return { logs, loading };
}

// LOGGING SYSTEM
export async function writeLog(action: string, message: string, uid: string = 'system') {
  try {
    await addDoc(collection(db, 'logs'), { action, message, uid, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('Failed writing log', e);
  }
}

export async function addMemberToDb(memberData: Omit<Member, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'members'), { ...memberData, createdAt: serverTimestamp() });
  await writeLog('ADD_MEMBER', `Menambahkan anggota: ${memberData.name}`);
}

export async function addTransactionToDb(trxData: Omit<Transaction, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'transactions'), { ...trxData, createdAt: serverTimestamp() });
  await writeLog('ADD_TRANSACTION', `Mencatat ${trxData.type === 'income' ? 'pemasukan' : 'pengeluaran'}: Rp${trxData.amount}`);
}

export async function deleteMemberFromDb(memberId: string) {
  await deleteDoc(doc(db, 'members', memberId));
  await writeLog('DELETE_MEMBER', `Menghapus anggota ID: ${memberId}`);
}

export async function deleteTransactionFromDb(transactionId: string) {
  await deleteDoc(doc(db, 'transactions', transactionId));
  await writeLog('DELETE_TRANSACTION', `Menghapus transaksi ID: ${transactionId}`);
}

export async function updateUserRole(uid: string, role: UserRole, userDoc?: UserDoc, members?: Member[]) {
  const updates: any = { role };

  if (role === 'warga' && userDoc && (!userDoc.memberIds || userDoc.memberIds.length === 0)) {
    const existingMatch = members?.find(m => m.name.toLowerCase() === userDoc.name.toLowerCase() || (m.phone && m.phone === userDoc.phone));
    
    if (existingMatch) {
      updates.memberIds = [existingMatch.id];
      await writeLog('AUTO_LINK', `Menautkan user ${userDoc.name} ke anggota ${existingMatch.name}`);
    } else {
      const newDocRef = await addDoc(collection(db, 'members'), {
        name: userDoc.name,
        phone: userDoc.phone || '',
        address: '',
        monthlyDue: 25000,
        createdAt: serverTimestamp()
      });
      updates.memberIds = [newDocRef.id];
      await writeLog('AUTO_CREATE_MEMBER', `Membuat anggota baru: ${userDoc.name} dengan iuran Rp25.000`);
    }
  }
  
  await updateDoc(doc(db, 'users', uid), updates);
  await writeLog('UPDATE_ROLE', `Role user ${uid} diubah menjadi ${role}`);
}

export async function batchImportData(members: Member[], transactions: Transaction[]) {
  const batch = writeBatch(db);
  members.forEach((m) => batch.set(doc(collection(db, 'members')), { ...m, createdAt: m.createdAt || serverTimestamp() }));
  transactions.forEach((t) => batch.set(doc(collection(db, 'transactions')), { ...t, createdAt: t.createdAt || serverTimestamp() }));
  await batch.commit();
  await writeLog('IMPORT_DATA', 'Melakukan batch import data JSON');
}

export async function deleteUserDoc(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
  await writeLog('DELETE_USER', `Menghapus akun pendaftar ID: ${uid}`);
}

export function usePaymentRequests() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  useEffect(() => {
    const q = query(collection(db, 'paymentRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as PaymentRequest));
    });
    return () => unsub();
  }, []);
  return { requests };
}

export async function addPaymentRequestToDb(requestData: Omit<PaymentRequest, 'id' | 'createdAt' | 'status'>) {
  await addDoc(collection(db, 'paymentRequests'), { ...requestData, status: 'pending', createdAt: serverTimestamp() });
  await writeLog('PAYMENT_REQUEST', `Request iuran ${requestData.method} (${requestData.paymentType || 'bulanan'}) dari ${requestData.memberName}`, requestData.uid);
}

export async function updatePaymentRequestStatus(id: string, status: 'approved' | 'rejected') {
  await updateDoc(doc(db, 'paymentRequests', id), { status });
}

// Batch 12 transaksi sekaligus untuk pembayaran tahunan
export async function addYearlyTransactions(memberId: string, memberName: string, monthlyAmount: number, startMonth: string) {
  const batch = writeBatch(db);
  const [startYear, startMon] = startMonth.split('-').map(Number);

  for (let i = 0; i < 12; i++) {
    let month = startMon + i;
    let year = startYear;
    if (month > 12) { month -= 12; year += 1; }
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const dateStr = `${monthStr}-01`;

    batch.set(doc(collection(db, 'transactions')), {
      type: 'income',
      category: 'iuran',
      amount: monthlyAmount,
      date: dateStr,
      note: `Iuran tahunan ${memberName} (${i + 1}/12)`,
      memberId,
      createdAt: serverTimestamp(),
    });
  }

  await batch.commit();
  await writeLog('YEARLY_PAYMENT', `Pembayaran tahunan ${memberName} dicatat (12 bulan mulai ${startMonth})`);
}

export function useAppSetting(key: string, defaultValue: string) {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', key), (doc) => {
      if (doc.exists()) setValue(doc.data().value);
    });
    return () => unsub();
  }, [key]);
  return {
    value,
    setValue: async (newVal: string) => setDoc(doc(db, 'settings', key), { value: newVal })
  };
}
