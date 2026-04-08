import React, { useState } from 'react';
import { Icons } from '../constants';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      
      if (isSignUp) {
        result = await authService.signUp(email, password, name || email.split('@')[0]);
      } else {
        result = await authService.signIn(email, password);
      }

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.user) {
        onLogin(result.user);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.signInWithGoogle();
      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // Valid OAuth handshakes will navigate away. No further state updates needed here.
    } catch (err) {
      setError('Failed to initialize Google Sign In');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[140px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[140px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Back to Home */}
      <a
        href="/"
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors group"
      >
        <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </a>

      <div className="flex w-full max-w-[1200px] h-[800px] bg-[#0a0a0a] rounded-[32px] border border-white/5 shadow-2xl relative z-10 overflow-hidden m-6">
        {/* Left Side: Illustration/Text (Desktop Only) */}
        <div className="hidden lg:flex flex-1 bg-[#111] relative overflow-hidden p-16 flex-col justify-between border-r border-white/5">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent"></div>
            <img
              src="/images/hero_abstract_glass_1772614949077.png"
              className="absolute -right-20 -bottom-20 w-[120%] h-auto opacity-20 grayscale"
              alt="Decorative"
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Icons.Magic className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter uppercase">Kreathief</span>
            </div>

            <h2 className="text-5xl font-black tracking-tighter text-white mb-6 leading-[0.9]">
              The future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Design is AI.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-sm leading-relaxed font-medium">
              Join thousands of professionals creating high-end graphics at the speed of thought.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#111] bg-gray-800 flex items-center justify-center text-[10px] font-black">
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Trusted by 50k+ Creators
              </p>
            </div>

            <div className="flex items-center gap-6">
              {['Design', 'AI', 'Export'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Icons.Check className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-16 relative bg-[#0a0a0a]">
          <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-[#7d2ae8] to-[#00c4cc] rounded-2xl flex items-center justify-center mb-4 shadow-xl">
              <Icons.Magic className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white uppercase">Kreathief</h1>
          </div>

          <div className="mb-10">
            <h3 className="text-3xl font-black text-white tracking-tighter mb-2">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h3>
            <p className="text-gray-500 font-medium">
              {isSignUp ? 'Start your 14-day free trial of Pro.' : 'Enter your details to access your workspace.'}
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm animate-shake">
              {error}
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 tracking-wider">Full Name</label>
              <div className="relative group">
                <Icons.Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#00c4cc] transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#13161a] border border-gray-700/50 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#00c4cc] focus:ring-1 focus:ring-[#00c4cc]/20 transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 tracking-wider">Email Address</label>
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs group-focus-within:text-[#00c4cc] transition-colors">@</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#13161a] border border-gray-700/50 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#00c4cc] focus:ring-1 focus:ring-[#00c4cc]/20 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 ml-1 tracking-wider">Password</label>
            <div className="relative group">
              <Icons.Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#7d2ae8] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#13161a] border border-gray-700/50 rounded-lg py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#7d2ae8] focus:ring-1 focus:ring-[#7d2ae8]/20 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] hover:brightness-110 text-white font-bold py-2.5 sm:py-3 rounded-lg shadow-lg shadow-purple-900/20 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest leading-none">
            <span className="bg-[#1e1e1e] px-3 text-gray-600">Or continue with</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-[#13161a] hover:bg-[#1a1d21] border border-gray-800 rounded-lg py-2.5 sm:py-3 px-4 text-white text-sm font-medium transition-all flex items-center justify-center gap-3 disabled:opacity-50 group"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500 font-medium">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="ml-2 text-white hover:text-[#00c4cc] font-black transition-all underline underline-offset-4 decoration-white/20 hover:decoration-[#00c4cc]/20"
                >
                  {isSignUp ? 'Log In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
