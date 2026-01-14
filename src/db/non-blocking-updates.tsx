import {
  setDoc,
  addDoc,
  updateDoc,
} from '@/db';

type CollectionReference = any;
type DocumentReference = any;
type SetOptions = any;
type DeleteDoc = any;
import { deleteDoc } from '@/db';

import { errorEmitter } from '@/db/error-emitter';
import { FirestorePermissionError } from '@/db/errors';

/**
 * Initiates a setDoc operation for a document reference.
 * Does NOT await the write operation internally.
 */

export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options: SetOptions) {
  if ((docRef as any).set) {
    (docRef as any).set(data, options).catch((err: any) => console.error(err));
    return;
  }
  setDoc(docRef, data, options).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'write', // or 'create'/'update' based on options
        requestResourceData: data,
      })
    )
  })
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  if ((colRef as any).add) {
    return (colRef as any).add(data).catch((err: any) => console.error(err));
  }
  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}

export function updateDocumentNonBlocking(docRef: DocumentReference, data: any) {
  if ((docRef as any).update) {
    (docRef as any).update(data).catch((err: any) => console.error(err));
    return;
  }
  updateDoc(docRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: data,
        })
      )
    });
}

export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  if ((docRef as any).delete) {
    (docRef as any).delete().catch((err: any) => console.error(err));
    return;
  }
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}
