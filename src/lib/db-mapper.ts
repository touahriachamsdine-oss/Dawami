'use server';

import { getUsers, getUserByUid } from '@/lib/actions/user-actions';
import { getAttendances } from '@/lib/actions/attendance-actions';
import { getSensorStatus } from '@/lib/actions/sensor-actions';

export async function fetchCollection(path: string) {
    const segments = path.split('/');

    // Handle 'users' collection
    if (segments[0] === 'users' && segments.length === 1) {
        const users = await getUsers();
        return (users || []).map((u: any) => ({
            id: u.uid,
            data: u
        }));
    }

    // Handle 'attendance' collection (global or nested)
    if ((segments[0] === 'attendance' && segments.length === 1) ||
        (segments[0] === 'users' && segments[2] === 'attendance')) {

        const filterUid = segments[0] === 'users' ? segments[1] : null;
        const attendances = await getAttendances();

        let filtered = attendances || [];
        if (filterUid) {
            filtered = filtered.filter((a: any) => a.userId === filterUid || (a.user && a.user.uid === filterUid));
        }

        return filtered.map((a: any) => ({
            id: a.id,
            data: a
        }));
    }

    return [];
}

export async function fetchDocument(path: string) {
    const segments = path.split('/');

    // users/:uid
    if (segments[0] === 'users' && segments.length === 2) {
        const user = await getUserByUid(segments[1]);
        return {
            exists: !!user,
            id: user?.uid || segments[1],
            data: user
        };
    }

    // system/settings
    if (segments[0] === 'system' && segments[1] === 'settings') {
        // Return a mock or fetch from DB
        const settings = { payCutRate: 0.1, companyName: 'Solminder' };
        return { exists: true, id: 'settings', data: settings };
    }

    // system/sensor
    if (segments[0] === 'system' && segments[1] === 'sensor') {
        const sensor = await getSensorStatus();
        return {
            exists: !!sensor,
            id: 'sensor',
            data: sensor
        };
    }

    return { exists: false, data: null, id: '' };
}
