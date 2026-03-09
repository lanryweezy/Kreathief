# 🚀 Supabase Quick Start for Kreathief

## Do These 3 Steps (5 minutes)

### Step 1: Create Supabase Project
1. **Go to:** https://database.new (or https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name:** kreathief (or anything you want)
   - **Database Password:** Choose a strong password (save it!)
   - **Region:** Pick closest to you
4. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Get Your Credentials
Once project is ready:

1. Click **Settings** (bottom left sidebar) → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

3. Open `.env.local` file and replace:
   ```bash
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   With your actual values:
   ```bash
   VITE_SUPABASE_URL=https://abcd1234efgh5678.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Run Database Migration
1. In Supabase Dashboard, click **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Open file: `supabase/migrations/001_initial_schema.sql`
4. **Copy ALL the content** and paste into SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

✅ **Done!** Your database is ready.

## Test It

```bash
npm run dev
```

Then:
1. Go to http://localhost:5173
2. Click "Get Started" or go to /auth
3. Create an account with email/password
4. If you see the dashboard → **It works!** 🎉

## Optional: Enable Google Sign-In

### In Supabase Dashboard:
1. Go to **Authentication** → **Providers**
2. Find **Google** and toggle it ON
3. You'll need:
   - **Client ID**
   - **Client Secret**

### Get Google Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
6. Copy Client ID and Client Secret to Supabase

## Troubleshooting

### "Supabase credentials not found" in console
- Make sure `.env.local` has the correct values
- Restart the dev server after changing `.env.local`

### Can't sign up / sign in
- Check browser console for errors
- Verify you ran the SQL migration
- Check Supabase Dashboard → Authentication → Users (should show your users)

### "Permission denied" errors
- The SQL migration didn't run properly
- Re-run the `001_initial_schema.sql` script

## Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Discord:** https://discord.supabase.com
- **Status Page:** https://status.supabase.com

---

**That's it!** The code is already wired up. Just get the credentials and run the migration. 🎯
