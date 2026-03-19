# 🚀 Vercel Deployment Guide - Kreathief

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Already connected to `lanryweezy/Kreathief`
3. **Environment Variables**: Configure in Vercel dashboard

## Quick Deploy

### Option 1: Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository: `lanryweezy/Kreathief`
3. Configure the following environment variables:

```bash
# Authentication
VITE_USE_QA_BYPASS=false

# Supabase (Get from your Supabase project settings)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini API (Get from Google AI Studio)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Dynamic Mockups API (Optional)
VITE_DYNAMIC_MOCKUPS_API_KEY=your-mockups-api-key

# Vecteezy API (Optional)
VITE_VECTEEZY_API_KEY=your-vecteezy-api-key
```

4. Click **Deploy**

### Option 2: Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Environment Variables Setup

### In Vercel Dashboard

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_USE_QA_BYPASS` | `false` | Production |
| `VITE_SUPABASE_URL` | Your Supabase URL | Production |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Key | Production |
| `VITE_GEMINI_API_KEY` | Your Gemini API Key | Production |
| `VITE_DYNAMIC_MOCKUPS_API_KEY` | Your Mockups API Key | Production (Optional) |
| `VITE_VECTEEZY_API_KEY` | Your Vecteezy API Key | Production (Optional) |

### Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **Create API Key**
3. Copy the key → `VITE_GEMINI_API_KEY`

## Build Configuration

The project is configured with:

- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### vercel.json Configuration

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": "dist"
}
```

## Post-Deployment Checklist

### 1. Verify Deployment

- [ ] Site loads successfully
- [ ] No console errors
- [ ] Authentication works (sign up/sign in)
- [ ] AI features work (Gemini API)
- [ ] Export functionality works
- [ ] File uploads work

### 2. Test Core Features

- [ ] Create new project
- [ ] Add text layers
- [ ] Add images
- [ ] Use AI tools
- [ ] Export design (PNG, PDF, PSD)
- [ ] Share design

### 3. Check Performance

- [ ] Initial load < 5s
- [ ] Editor loads < 10s
- [ ] No memory leaks
- [ ] Smooth interactions

## Custom Domain (Optional)

1. Go to **Project Settings** → **Domains**
2. Add your domain (e.g., `kreathief.com`)
3. Configure DNS records as instructed
4. Wait for verification (up to 48 hours)

## Automatic Deployments

Vercel automatically deploys:

- **Production**: Push to `main` branch
- **Preview**: Pull requests
- **Development**: `vercel --dev` locally

## Troubleshooting

### Build Fails

**Error: Out of Memory**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Error: TypeScript Errors**
```bash
# Check locally first
npm run type-check
```

**Error: ESLint Errors**
```bash
# Fix linting issues
npm run lint:fix
```

### Runtime Errors

**API Keys Not Working**
- Verify environment variables are set in Vercel
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

**Supabase Connection Fails**
- Verify RLS policies are configured
- Check Supabase URL and anon key
- Ensure Supabase project is active

## Monitoring

### Vercel Analytics

Enable in **Project Settings** → **Analytics**

### Vercel Speed Insights

Enable in **Project Settings** → **Speed Insights**

### Error Tracking

Consider integrating:
- Sentry
- LogRocket
- Vercel Analytics (built-in)

## Cost Optimization

**Free Tier Limits:**
- 100 GB bandwidth/month
- 6,000 minutes build time/month
- Unlimited deployments

**Pro Tips:**
- Enable caching for faster builds
- Use incremental static regeneration
- Optimize bundle size

## Security Notes

✅ **Production Ready:**
- `VITE_USE_QA_BYPASS=false` (real auth)
- Supabase RLS enabled
- Environment variables secured
- No API keys in code

⚠️ **Important:**
- Never commit `.env.production`
- Rotate API keys periodically
- Monitor usage in Vercel dashboard

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vite Docs**: [vitejs.dev](https://vitejs.dev)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test all features
3. ✅ Configure custom domain (optional)
4. ✅ Enable analytics
5. ✅ Set up monitoring
6. ✅ Share with users!

---

**Last Updated:** March 18, 2026  
**Status:** ✅ Production Ready
