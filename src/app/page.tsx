'use client';

import { useFirebase, collection, query, where, getDocs } from '@/db';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';


export default function Home() {
    const router = useRouter();
    const { user, isUserLoading, firestore } = useFirebase();

    useEffect(() => {
        if (isUserLoading) {
            return; // Wait until user status is determined
        }

        if (!user) {
            router.replace('/login');
            return;
        }

        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('uid', '==', user.uid));

        // This is a simplified check. In a real app, you'd use a proper data fetching hook.
        getDocs(q).then(snapshot => {
            if (snapshot.empty) {
                // Should not happen if signup process is correct
                router.replace('/login');
            } else {
                const userData = snapshot.docs[0].data();
                if (userData.accountStatus === 'Pending') {
                    router.replace('/pending-approval');
                } else if (userData.accountStatus === 'Approved') {
                    router.replace('/dashboard');
                } else { // Rejected or other status
                    router.replace('/login');
                }
            }
        });



    }, [user, isUserLoading, router, firestore]);

    // Render a loading state while we determine where to redirect
    return (
        <div className="flex min-h-screen items-center justify-center">
            <p>Loading...</p>
        </div>
    );
}
