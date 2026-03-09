# Supabase Setup Guide for Kreathief

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new project (or use an existing organization)
4. Save your project credentials

### 2. Configure Environment Variables

Copy your credentials from Supabase Dashboard > Settings > API:

```bash
# In .env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Database Schema

1. Go to Supabase Dashboard > SQL Editor
2. Copy the contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run the SQL script
4. This creates all tables, indexes, triggers, and security policies

### 4. Enable Google OAuth (Optional)

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
4. Set authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
5. For local development, also add: `http://localhost:5173/auth/callback`

### 5. Create Storage Buckets (Optional)

For project thumbnails and user avatars:

1. Go to Supabase Dashboard > Storage
2. Create these buckets:
   - `project-thumbnails` (public)
   - `user-avatars` (public)
   - `template-assets` (public)

### 6. Test the Integration

```bash
npm run dev
```

Try:
- Creating a new account
- Signing in with email/password
- Signing in with Google (if enabled)
- Creating and saving a project

## Database Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with plan info |
| `projects` | User design projects |
| `project_versions` | Version history for projects |
| `project_snapshots` | Saved snapshots of projects |
| `comments` | Comments on projects |
| `brand_kits` | User brand kits |
| `templates` | Design templates |

### Key Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Automatic timestamps**: `updated_at` fields auto-update
- **Cascade deletes**: Deleting a user removes their data
- **Public sharing**: Projects can be made public via `is_public` flag

## Hybrid Storage Architecture

The app uses a hybrid approach:

1. **Online + Authenticated**: Saves to Supabase (cloud)
2. **Offline or Unauthenticated**: Falls back to IndexedDB (local)
3. **Automatic sync**: When coming back online, offline changes sync

This ensures:
- Works offline
- Data is backed up to cloud when possible
- Seamless experience regardless of connectivity

## Migration from LocalStorage

The app automatically migrates existing localStorage data to:
- IndexedDB (immediate)
- Supabase (when user logs in)

No data loss occurs during migration.

## Troubleshooting

### "Supabase credentials not found" warning

Make sure `.env.local` exists with valid credentials:
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### Authentication not working

1. Check browser console for errors
2. Verify credentials in `.env.local`
3. Ensure RLS policies are set up correctly
4. Check Supabase Authentication logs

### Data not saving to Supabase

1. Open browser DevTools > Network tab
2. Look for failed Supabase requests
3. Check RLS policies allow the operation
4. Verify user is authenticated

## Security Best Practices

- Never commit `.env.local` to git
- Use environment-specific credentials
- Review RLS policies regularly
- Enable 2FA for your Supabase account
- Monitor usage in Supabase Dashboard

## Next Steps

1. **Customize RLS policies** for your specific needs
2. **Set up database webhooks** for notifications
3. **Enable realtime** for collaborative features
4. **Configure backups** in Supabase settings
5. **Set up monitoring** and alerts

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Discord Community](https://discord.supabase.com)
