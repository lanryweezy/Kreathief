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
      // Use authService.signIn to handle mock persistence correctly
      const result = await authService.signIn(email, password);

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
    // For QA, also bypass Google sign in with a mock
    const result = await authService.signIn('google-test@gmail.com', 'dummy');
    if (result.user) {
      onLogin(result.user);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#0e1318] flex items-center justify-center relative overflow-hidden py-12 px-6">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md p-6 sm:p-8 bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative z-10 transition-all">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-xl flex items-center justify-center mb-3 sm:mb-4 shadow-lg shadow-purple-500/20">
            <Icons.Magic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1 sm:mb-2">Kreathief</h1>
          <p className="text-gray-400 text-xs sm:text-sm">The AI-Powered Design Suite</p>
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

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-[#00c4cc] hover:text-[#7d2ae8] font-bold transition-all underline underline-offset-4 decoration-[#00c4cc]/20 hover:decoration-[#7d2ae8]/20"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
