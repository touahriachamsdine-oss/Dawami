
# Independent Mode Workflow

This project now supports running independently from Firebase using `localStorage`.

## How to use
1. Set `NEXT_PUBLIC_INDEPENDENT_MODE=true` in your `.env.local` file.
2. The app will automatically fall back to a local storage database populated with mock data.
3. Data is persisted in your browser's `localStorage` under the key `solminder_db`.

## Implementing on new pages
When creating new pages, import Firestore utilities from `@/firebase` instead of `firebase/firestore`:
```tsx
import { collection, query, where, useCollection } from "@/firebase";
```
This ensures the page works in both Firebase and Independent modes.
