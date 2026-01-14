
# Vercel Deployment Guide

To host this application on Vercel, you need to migrate from SQLite to a cloud database (like Neon or Supabase) because Vercel's serverless environment does not support persistent local files.

## 1. Set up a Cloud Database
*   Sign up for [Neon.tech](https://neon.tech/) (Free and easiest for Next.js).
*   Create a new project and copy the **Connection String** (looks like `postgresql://user:pass@host/db`).

## 2. Update Prisma Schema
Open `prisma/schema.prisma` and change the provider:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## 3. Update Environment Variables
Update your local `.env` with the new Connection String from Neon:
```env
DATABASE_URL="postgresql://your_user:your_password@your_endpoint.neon.tech/neondb?sslmode=require"
```

## 4. Prepare Database
Run these commands to push your schema to the new database:
```bash
npx prisma migrate dev --name init
```

## 5. Configure Vercel
1.  Push your code to a GitHub repository.
2.  Import the project in [Vercel](https://vercel.com/new).
3.  In the **Environment Variables** section, add:
    *   `DATABASE_URL`: (Your Neon connection string)
    *   `PRISMA_GENERATE_DATAPROXY`: `true` (if using Neon's connection pooling)
4.  **Important**: Check your `package.json` for a `build` script. It should look like this:
    ```json
    "scripts": {
      "build": "prisma generate && next build"
    }
    ```
    Alternatively, add a `postinstall` script:
    ```json
    "postinstall": "prisma generate"
    ```

## 6. Deploy
Click **Deploy**. Vercel will build the app, generate the Prisma client, and host your site.

---

### Troubleshooting
*   **Migrations**: If your schema changes later, run `npx prisma migrate dev` locally and Vercel will apply changes (using `npx prisma migrate deploy` in build if necessary).
*   **Auth State**: Since you are using "Independent Mode" (localStorage), user login states will persist in the visitor's browser.
