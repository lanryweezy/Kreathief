# Supabase Integration Guide (Development Mode)

**Status:** ✅ **READY FOR DEVELOPMENT**  
**QA Bypass:** ✅ Enabled (controlled by environment variable)  
**Real Auth:** ✅ Available when needed  

---

## 🎯 Overview

Your Supabase integration now supports **dual-mode operation**:

1. **Development Mode** - Uses QA bypass for rapid testing without real auth
2. **Production Mode** - Uses real Supabase authentication

This allows you to develop and test quickly while having production-ready auth when you need it.

---

## ⚙️ Configuration

### Enable QA Bypass (Development)

Add to your `.env.local`:

```bash
VITE_USE_QA_BYPASS=true
```

**What this does:**
- ✅ Skips real authentication
- ✅ Creates mock user automatically
- ✅ Stores session in localStorage
- ✅ Faster testing cycles
- ⚠️ **DO NOT USE IN PRODUCTION**

### Disable QA Bypass (Production)

Remove or set to false:

```bash
VITE_USE_QA_BYPASS=false
# or just remove the line
```

**What happens:**
- ✅ Real Supabase authentication
- ✅ Email/password verification
- ✅ Secure sessions
- ✅ RLS policies enforced
- ✅ Production-ready

---

## 🔧 How It Works

### Development Flow (QA Bypass ON)

```typescript
// User enters any email/password
await authService.signIn('test@example.com', 'password');

// System creates mock user:
{
  id: 'qa-user-id',
  email: 'test@example.com',
  name: 'test',
  plan: 'pro'
}

// Stored in localStorage as 'kreathief_qa_session'
// No real authentication happens
```

**Benefits:**
- ✅ Instant sign-in (no email verification)
- ✅ No password requirements
- ✅ Test all features immediately
- ✅ Skip email confirmation flows

### Production Flow (QA Bypass OFF)

```typescript
// User enters real credentials
await authService.signIn('user@example.com', 'SecurePass123');

// Supabase validates credentials
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Fetches real profile from database
// Returns actual user data
```

**Benefits:**
- ✅ Secure authentication
- ✅ Email verification required
- ✅ Password strength enforcement
- ✅ Real user isolation via RLS

---

## 📋 Features Implemented

### ✅ Complete Features

1. **Dual-Mode Authentication**
   - QA bypass for development
   - Real auth for production
   - Automatic switching based on env var

2. **Auth State Listener**
   - Listens to Supabase auth changes
   - Updates UI automatically
   - Handles token refresh

3. **Session Management**
   - Checks both localStorage and Supabase
   - Persistent sessions
   - Auto-recovery on reload

4. **Profile Integration**
   - Fetches profile from Supabase
   - Creates profile if missing
   - Updates user data

5. **Structured Logging**
   - All auth actions logged
   - Context-rich error messages
   - Debug mode for development

---

## 🚀 Usage Examples

### In Your App (App.tsx)

```typescript
import { authService } from './services/authService';

// Initialize auth listener once (in useEffect)
useEffect(() => {
  const unsubscribe = authService.onAuthChange((user) => {
    setUser(user);
    log.info('Auth state changed', { user: user?.email });
  });

  // Check for existing session
  authService.getSession().then(user => {
    if (user) {
      setUser(user);
    }
  });

  return () => unsubscribe();
}, []);
```

### Sign In Component

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const result = await authService.signIn(email, password);
  
  if (result.error) {
    setError(result.error);
    return;
  }

  if (result.user) {
    onLogin(result.user);
    // User is now authenticated!
  }
};
```

### Check Current Session

```typescript
const currentUser = await authService.getSession();

if (currentUser) {
  console.log('User is logged in:', currentUser.email);
} else {
  console.log('No active session');
}
```

### Sign Out

```typescript
await authService.signOut();
// Clears both localStorage and Supabase session
setUser(null);
```

---

## 🔍 Testing Scenarios

### Test with QA Bypass ON

```bash
# .env.local
VITE_USE_QA_BYPASS=true
```

**Test Cases:**
1. ✅ Sign in with any email (even fake ones)
2. ✅ No password validation
3. ✅ Instant access to all features
4. ✅ Projects save under 'qa-user-id'
5. ✅ Fast iteration for UI testing

**Expected Logs:**
```
[AuthService] Using QA bypass for development { email: "test@example.com" }
[AuthService] Found QA bypass session
```

### Test with QA Bypass OFF

```bash
# .env.local
VITE_USE_QA_BYPASS=false
# or remove the line
```

**Test Cases:**
1. ✅ Must use real registered email
2. ✅ Password must match
3. ✅ Email verification may be required
4. ✅ Projects save under real user ID
5. ✅ RLS policies enforced

**Expected Logs:**
```
[AuthService] Attempting Supabase sign in { email: "user@example.com" }
[AuthService] Sign in successful { userId: "real-uuid-here" }
```

---

## 🛡️ Security Notes

### Development Mode Security

⚠️ **WARNING:** QA bypass is NOT secure!

**Characteristics:**
- ❌ No password verification
- ❌ Anyone can access any account
- ❌ Data stored in localStorage
- ❌ RLS policies bypassed
- ❌ Session vulnerable to XSS

**Use ONLY for:**
- ✅ Local development
- ✅ UI testing
- ✅ Feature prototyping
- ✅ Rapid iteration

### Production Mode Security

✅ **SECURE:** Full Supabase auth

**Characteristics:**
- ✅ Password hashing
- ✅ Email verification
- ✅ Secure tokens
- ✅ RLS policies enforced
- ✅ CSRF protection
- ✅ Rate limiting

**Required for:**
- ✅ Production deployment
- ✅ User data
- ✅ Sensitive operations
- ✅ Public releases

---

## 📊 Migration Path

### Phase 1: Development (Current) ✅

```bash
VITE_USE_QA_BYPASS=true
```

**Focus:**
- Build features quickly
- Test UI/UX
- Iterate on design
- Don't worry about auth

### Phase 2: Pre-Production

```bash
VITE_USE_QA_BYPASS=false
```

**Tasks:**
1. Create real user accounts in Supabase
2. Test sign-up flow
3. Test password reset
4. Verify RLS policies
5. Test email verification

### Phase 3: Production

```bash
# Remove QA bypass entirely from code
# Or keep disabled via env var
VITE_USE_QA_BYPASS=false
```

**Final Steps:**
1. Enable email confirmation
2. Set strong password requirements
3. Add rate limiting
4. Monitor auth logs
5. Set up alerts

---

## 🔧 Troubleshooting

### Issue: Can't Sign In with QA Bypass

**Symptoms:**
- Sign in returns error
- Mock user not created

**Solution:**
```bash
# Ensure env var is set
VITE_USE_QA_BYPASS=true

# Restart dev server
npm run dev

# Clear localStorage
localStorage.removeItem('kreathief_qa_session');
```

### Issue: Auth Listener Not Working

**Symptoms:**
- UI doesn't update on sign in/out
- Session persists incorrectly

**Solution:**
```typescript
// Ensure listener is initialized in App.tsx
useEffect(() => {
  const unsubscribe = authService.onAuthChange((user) => {
    setUser(user);
  });
  
  return () => unsubscribe();
}, []);
```

### Issue: Mixed Sessions (QA + Real)

**Symptoms:**
- Both QA and real sessions exist
- Confusion about which is active

**Solution:**
```typescript
// Clear all sessions
localStorage.removeItem('kreathief_qa_session');
await supabase.auth.signOut();

// Then sign in with desired mode
```

---

## 📝 Best Practices

### For Development

1. ✅ Use QA bypass liberally
2. ✅ Test with different emails
3. ✅ Don't worry about passwords
4. ✅ Focus on UX
5. ⚠️ Remember it's not real auth

### For Production

1. ✅ Disable QA bypass completely
2. ✅ Enable email verification
3. ✅ Enforce password strength
4. ✅ Monitor auth logs
5. ✅ Test RLS policies thoroughly

### Code Organization

```typescript
// Good - Clear separation
const useQABypass = import.meta.env.DEV && 
                    import.meta.env.VITE_USE_QA_BYPASS === 'true';

if (useQABypass) {
  // Development flow
} else {
  // Production flow
}

// Bad - Mixed concerns
// Don't mix QA and real auth logic
```

---

## 🎯 Quick Reference

| Feature | QA Bypass ON | QA Bypass OFF |
|---------|--------------|---------------|
| **Sign In** | Instant (any credentials) | Real validation |
| **Password** | Not checked | Required & validated |
| **Email** | Any format | Must be verified |
| **Session** | localStorage | Supabase + localStorage |
| **User ID** | 'qa-user-id' | Real UUID |
| **RLS Policies** | Bypassed | Enforced |
| **Best For** | Development | Production |

---

## 📚 Related Files

- **Auth Service:** `services/authService.ts`
- **Supabase Client:** `lib/supabase/client.ts`
- **Config:** `config/index.ts`
- **Environment:** `.env.local`

---

## ✨ Summary

Your Supabase integration now provides:

✅ **Flexible Development**
- QA bypass for rapid testing
- No auth friction during dev
- Instant feature testing

✅ **Production Ready**
- Real Supabase auth available
- Secure authentication
- RLS policy enforcement

✅ **Easy Switching**
- One env var controls mode
- No code changes needed
- Clear logging for debugging

**Current Status:** ✅ Ready for development with QA bypass enabled!

---

**Last Updated:** February 14, 2026  
**Status:** Development Mode Active
