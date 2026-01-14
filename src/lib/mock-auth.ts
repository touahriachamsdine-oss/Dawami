
import { MOCK_USERS } from './mock-data';

const listeners: ((user: any) => void)[] = [];

export const mockAuth = {
    currentUser: MOCK_USERS[0] as any,
    onAuthStateChanged: (callback: any) => {
        listeners.push(callback);
        // Initial call
        setTimeout(() => {
            callback(mockAuth.currentUser);
        }, 100);

        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        };
    },
    signInWithEmailAndPassword: async (auth: any, email: string) => {
        const user = MOCK_USERS.find(u => u.email === email);
        if (user) {
            mockAuth.currentUser = user;
            listeners.forEach(cb => cb(user));
            return { user };
        }
        // If not in MOCK_USERS, check if it's the new admin we added manually
        // Since we are in local mode, we can just allow it if it exists in DB (the caller will handle DB check usually)
        // But here we need to return something for the auth state.
        const newUser = {
            uid: 'temp-' + Date.now(),
            id: 'temp-' + Date.now(),
            email,
            name: email.split('@')[0],
            role: 'Admin',
            accountStatus: 'Approved'
        };
        mockAuth.currentUser = newUser;
        listeners.forEach(cb => cb(newUser));
        return { user: newUser };
    },
    createUserWithEmailAndPassword: async (auth: any, email: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newUser = {
            uid: id,
            id,
            email,
            name: email.split('@')[0],
            role: 'Employee',
            accountStatus: 'Pending'
        };
        mockAuth.currentUser = newUser;
        listeners.forEach(cb => cb(newUser));
        return { user: newUser };
    },
    signOut: async () => {
        mockAuth.currentUser = null;
        listeners.forEach(cb => cb(null));
        console.log('Signed out mock');
    }
};

