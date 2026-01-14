
import { MOCK_USERS, MOCK_ATTENDANCE, MOCK_SETTINGS } from './mock-data';

class LocalStorageDB {
    private static instance: LocalStorageDB;
    private data: Record<string, any[]> = {};

    private constructor() {
        this.loadFromStorage();
    }

    public static getInstance(): LocalStorageDB {
        if (!LocalStorageDB.instance) {
            LocalStorageDB.instance = new LocalStorageDB();
        }
        return LocalStorageDB.instance;
    }

    private loadFromStorage() {
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem('solminder_db');
        if (stored) {
            this.data = JSON.parse(stored);
        } else {
            // Initialize with mock data
            this.data = {
                users: MOCK_USERS,
                attendance: MOCK_ATTENDANCE,
                settings: MOCK_SETTINGS,
            };
            this.saveToStorage();
        }
    }

    private saveToStorage() {
        if (typeof window === 'undefined') return;
        localStorage.setItem('solminder_db', JSON.stringify(this.data));
    }


    public collection(path: string, ...pathSegments: string[]) {
        const fullPath = [path, ...pathSegments].join('/');
        return {
            path: fullPath,
            type: 'collection' as const,
            get: async () => {
                const data = (this.data[fullPath] || []);
                return {
                    docs: data.map(item => ({
                        id: item.id || item.uid,
                        data: () => item
                    })),
                    empty: data.length === 0
                };
            },
            add: async (data: any) => {
                const id = Math.random().toString(36).substr(2, 9);
                const newDoc = { ...data, id };
                if (!this.data[fullPath]) this.data[fullPath] = [];
                this.data[fullPath].push(newDoc);
                this.saveToStorage();
                return { id, path: `${fullPath}/${id}` };
            },
            onSnapshot: (callback: any) => {
                const trigger = () => {
                    const snapshot = {
                        docs: (this.data[fullPath] || []).map(item => ({
                            id: item.id || item.uid,
                            data: () => item
                        }))
                    };
                    callback(snapshot);
                };
                trigger();
                return () => { };
            }
        };
    }

    public doc(path: string, ...pathSegments: string[]) {
        const fullPath = [path, ...pathSegments].join('/');
        const segments = fullPath.split('/');

        // Very basic handling of collection/doc path
        const collectionPath = segments.slice(0, -1).join('/');
        const docId = segments[segments.length - 1];

        return {
            path: fullPath,
            type: 'document' as const,
            get: async () => {
                const item = (this.data[collectionPath] || []).find(i => (i.id === docId || i.uid === docId));
                return {
                    exists: () => !!item,
                    data: () => item,
                    id: docId
                };
            },
            update: async (updates: any) => {
                const index = (this.data[collectionPath] || []).findIndex(i => (i.id === docId || i.uid === docId));
                if (index !== -1) {
                    this.data[collectionPath][index] = { ...this.data[collectionPath][index], ...updates };
                    this.saveToStorage();
                }
            },
            set: async (data: any, options: any) => {
                const index = (this.data[collectionPath] || []).findIndex(i => (i.id === docId || i.uid === docId));
                if (index !== -1) {
                    this.data[collectionPath][index] = options?.merge ? { ...this.data[collectionPath][index], ...data } : data;
                } else {
                    if (!this.data[collectionPath]) this.data[collectionPath] = [];
                    this.data[collectionPath].push({ ...data, id: docId });
                }
                this.saveToStorage();
            },
            delete: async () => {
                this.data[collectionPath] = (this.data[collectionPath] || []).filter(i => (i.id !== docId && i.uid !== docId));
                this.saveToStorage();
            },
            onSnapshot: (callback: any) => {
                const trigger = () => {
                    const item = (this.data[collectionPath] || []).find(i => (i.id === docId || i.uid === docId));
                    callback({
                        exists: () => !!item,
                        data: () => item,
                        id: docId
                    });
                };
                trigger();
                return () => { };
            }
        };
    }

}

export const localDB = LocalStorageDB.getInstance();
