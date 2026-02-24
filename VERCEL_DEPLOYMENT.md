# 🚀 Vercel Deployment Guide for Kreathief

## ⚠️ SECURITY WARNING

**Your API keys are currently exposed in vercel.json!** This is acceptable for development but **NOT for production**. 

For production, use Vercel's Environment Variables UI instead (see below).

---

## 📋 All API Keys (Copy These)

```bash
# Google Gemini AI (Text & Image Generation)
VITE_GEMINI_API_KEY=AIzaSyCaKWA1N7JU9jDyPw1i8n3X4n1Q0DtZL5A

# Unsplash (Stock Photos)
VITE_UNSPLASH_ACCESS_KEY=TMihMwpAViRw5m_quB3jRuz5E1JqM6lq80tk61Te0NE
VITE_UNSPLASH_SECRET_KEY=r33Rec9tdBFW63HyuGFNKfsZSlNcIIzNqizbcabIijo

# Streamline Icons
VITE_STREAMLINE_API_KEY=IsccadJVao54BJh4.54e8c4f46c3b677f75f3cfc5a7b24af1

# Freepik (Vectors & Icons)
VITE_FREEPIK_API_KEY=FPSX40ef8a80843a35ba41580998f686b7e4

# Dynamic Mockups
VITE_DYNAMIC_MOCKUPS_API_KEY=dd5e6fd8-e221-4264-aed6-387914b460ed:e0467e1585bb1aa2b35b32f36baa07a5d25b001ad027129fae9b4febd6aaa7c5

# Vecteezy (Vectors)
VITE_VECTEEZY_API_KEY=IsccadJVao54BJh4.54e8c4f46c3b677f75f3cfc5a7b24af1
```

---

## 🎯 Method 1: Vercel CLI (Recommended)

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Login to Vercel**
```bash
vercel login
```

### **Step 3: Link Your Project**
```bash
vercel link
```

### **Step 4: Add Environment Variables**
```bash
# Add each API key one by one
vercel env add VITE_GEMINI_API_KEY
# Paste: AIzaSyCaKWA1N7JU9jDyPw1i8n3X4n1Q0DtZL5A

vercel env add VITE_UNSPLASH_ACCESS_KEY
# Paste: TMihMwpAViRw5m_quB3jRuz5E1JqM6lq80tk61Te0NE

vercel env add VITE_UNSPLASH_SECRET_KEY
# Paste: r33Rec9tdBFW63HyuGFNKfsZSlNcIIzNqizbcabIijo

vercel env add VITE_STREAMLINE_API_KEY
# Paste: IsccadJVao54BJh4.54e8c4f46c3b677f75f3cfc5a7b24af1

vercel env add VITE_FREEPIK_API_KEY
# Paste: FPSX40ef8a80843a35ba41580998f686b7e4

vercel env add VITE_DYNAMIC_MOCKUPS_API_KEY
# Paste: dd5e6fd8-e221-4264-aed6-387914b460ed:e0467e1585bb1aa2b35b32f36baa07a5d25b001ad027129fae9b4febd6aaa7c5

vercel env add VITE_VECTEEZY_API_KEY
# Paste: IsccadJVao54BJh4.54e8c4f46c3b677f75f3cfc5a7b24af1
```

### **Step 5: Deploy**
```bash
vercel --prod
```

---

## 🎯 Method 2: Vercel Dashboard (Easiest)

### **Step 1: Go to Vercel Dashboard**
https://vercel.com/dashboard

### **Step 2: Import Your Project**
1. Click "Add New Project"
2. Import from GitHub
3. Select your `kreathief` repository

### **Step 3: Add Environment Variables**

During import, click "Environment Variables" and add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_GEMINI_API_KEY` | `AIzaSyCaKWA1N7JU9jDyPw1i8n3X4n1Q0DtZL5A` | Production, Preview, Development |
| `VITE_UNSPLASH_ACCESS_KEY` | `TMihMwpAViRw5m_quB3jRuz5E1JqM6lq80tk61Te0NE` | Production, Preview, Development |
| `VITE_UNSPLASH_SECRET_KEY` | `r33Rec9tdBFW63HyuGFNKfsZSlNcIIzNqizbcabIijo` | Production, Preview, Development |
| `VITE_STREAMLINE_API_KEY` | `IsccadJVao54BJh4.54e8c4f46c3b677f75f3cfc5a7b24af1` | Production, Preview, Development |
| `VITE_FREEPIK_API_KEY` | `FPSX40ef8a80843a35ba41580998f686b7e4` | Production, Preview, Development |
| `VITE_DYNAMIC_MOCKUPS_API_KEY` | `dd5e6fd8-e221-4264-aed6-387914b460ed:e0467e1585bb1aa2b35b32f36baa07a5d25b001ad027129fae9b4febd6aaa7c5` | Production, Preview, Development |
| `VITE_VECTEEZY_API_KEY` | `IsccadJVao54BJh4.54e8c4f46c3b677f75f3cfc5a7b24af1` | Production, Preview, Development |

### **Step 4: Deploy**
Click "Deploy" and wait for build to complete (~2-3 minutes)

---

## 🎯 Method 3: Using vercel.json (Current - Not Recommended for Production)

Your `vercel.json` already has all keys configured. Just run:

```bash
vercel --prod
```

⚠️ **Warning**: This exposes your keys in the repository. Only use for development!

---

## 🔒 Security Best Practices

### **DO:**
✅ Use Vercel Environment Variables UI  
✅ Keep keys in `.env.local` (gitignored)  
✅ Rotate keys regularly  
✅ Use different keys for dev/production  

### **DON'T:**
❌ Commit `.env.local` to git  
❌ Hardcode keys in vercel.json for production  
❌ Share API keys publicly  
❌ Use the same key across multiple projects  

---

## 📝 Quick Deploy Commands

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Deploy to production
vercel --prod

# View deployment logs
vercel logs

# List environment variables
vercel env ls
```

---

## 🧪 Test After Deployment

### **1. Check Deployment URL**
After deployment, Vercel will give you a URL like:
```
https://kreathief.vercel.app
```

### **2. Test AI Features**
- Go to Magic tab
- Try generating an image
- Try Magic Write on text

### **3. Test Photos**
- Go to Photos tab
- Verify Unsplash images load

### **4. Test Mockups**
- Go to Mockup tab
- Verify mockups load
- Test corner pinning

---

## 🔧 Troubleshooting

### **Build Fails**
```bash
# Check build locally first
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### **API Keys Not Working**
1. Verify keys are set correctly in Vercel dashboard
2. Redeploy after adding environment variables
3. Check browser console for errors

### **CORS Errors**
Some APIs may need CORS configuration:
- Unsplash: Add your Vercel URL to Unsplash dashboard
- Freepik: Add domain to Freepik dashboard

---

## 📊 Deployment Checklist

- [ ] All API keys added to Vercel
- [ ] Environment set to Production
- [ ] Build completes successfully
- [ ] AI features work (Gemini)
- [ ] Photos load (Unsplash)
- [ ] Mockups work
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Canvas maintains size
- [ ] Corner pinning works

---

## 🎉 Post-Deployment

### **Custom Domain (Optional)**
1. Go to Vercel Dashboard → Your Project
2. Settings → Domains
3. Add your domain: `yourdomain.com`
4. Update DNS records as instructed

### **Analytics (Optional)**
1. Go to Vercel Dashboard → Your Project
2. Analytics → Enable Vercel Analytics
3. View traffic and performance

### **Environment Variables Management**
```bash
# Pull environment variables from Vercel
vercel env pull

# This creates .env.local with all your keys
```

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all API keys are correct
3. Check browser console for errors
4. Review Vercel documentation: https://vercel.com/docs

---

**Your app is ready to deploy!** 🚀

Run `vercel --prod` to deploy now!
