'use client';

import { localDB } from '@/lib/local-storage-db';
import { mockAuth } from '@/lib/mock-auth';

// Purely local mode
const INDEPENDENT_MODE = true;

export function initializeFirebase() {
  console.log('Running in Local Mode (LocalStorage)');
  return {
    firebaseApp: {} as any,
    auth: mockAuth as any,
    firestore: localDB as any,
    database: {} as any,
    isIndependent: true
  };
}

export function getSdks(firebaseApp: any) {
  return {
    firebaseApp,
    auth: mockAuth as any,
    firestore: localDB as any,
    database: {} as any
  };
}

export const signInWithEmailAndPassword = async (auth: any, email: string, pass: string) => {
  return (mockAuth as any).signInWithEmailAndPassword(auth, email, pass);
};

export const onAuthStateChanged = (auth: any, callback: any, errorCallback?: any) => {
  if (auth && (auth as any).onAuthStateChanged) {
    return (auth as any).onAuthStateChanged(callback);
  }
  return () => { };
};

export const createUserWithEmailAndPassword = async (auth: any, email: string, pass: string) => {

  return (mockAuth as any).createUserWithEmailAndPassword(auth, email, pass);
};

export const collection = (db: any, path: string, ...pathSegments: string[]) => {
  return (localDB as any).collection(path, ...pathSegments);
};

export const doc = (db: any, path: string, ...pathSegments: string[]) => {
  return (localDB as any).doc(path, ...pathSegments);
};

export const deleteDoc = async (docRef: any) => {
  return (docRef as any).delete();
};


export const query = (colRef: any, ...queryConstraints: any[]) => {
  return {
    ...colRef,
    constraints: queryConstraints
  };
};

import { createUser, updateUser } from '@/lib/actions/user-actions';
import { createAttendance, updateAttendance } from '@/lib/actions/attendance-actions';

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const segments = docRef.path.split('/');
  if (segments[0] === 'users' && segments[1]) {
    return await updateUser(segments[1], data);
  }
  return (docRef as any).set(data, options);
};

export const updateDoc = async (docRef: any, data: any) => {
  const segments = docRef.path.split('/');
  if (segments[0] === 'users' && segments[1]) {
    return await updateUser(segments[1], data);
  }
  if (segments[0] === 'attendance' && segments[1]) {
    return await updateAttendance(segments[1], data);
  }
  return (docRef as any).update(data);
};


export const where = (field: string, op: any, value: any) => {
  return { field, op, value, __mockConstraint: true };
};

export const addDoc = async (colRef: any, data: any) => {
  const segments = colRef.path.split('/');

  if (segments[0] === 'users' && segments.length === 1) {
    return await createUser(data);
  }

  if (segments[0] === 'attendance' || (segments[0] === 'users' && segments[2] === 'attendance')) {
    const userId = segments[0] === 'users' ? segments[1] : data.userId;
    return await createAttendance({ ...data, userId });
  }

  return (colRef as any).add(data);
};



import { fetchCollection } from '@/lib/db-mapper';

export const getDocs = async (query: any) => {
  if (query && query.path) {
    const docs = await fetchCollection(query.path);
    return {
      empty: docs.length === 0,
      docs: docs.map((d: any) => ({
        id: d.id,
        data: () => d.data
      }))

    };
  }
  return (query as any).get();
};


export const limit = (n: number) => {
  return { limit: n, __mockConstraint: true };
};

export const serverTimestamp = () => {
  return { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0, __mockTimestamp: true };
};

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';




