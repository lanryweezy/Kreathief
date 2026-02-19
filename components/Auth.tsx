import React, { useState } from 'react';
import { Icons } from '../constants';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const user: User = {
        id: 'user_' + Date.now(),
        name: name || email.split('@')[0] || 'Designer',
        email: email,
        plan: 'free',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      };
      setLoading(false);
      onLogin(user);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#0e1318] flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md p-8 bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-[#00c4cc] to-[#7d2ae8] rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <Icons.Magic className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">Kreathief</h1>
          <p className="text-gray-400 text-sm">The AI-Powered Design Suite</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Full Name</label>
              <div className="relative">
                <Icons.Bot className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#13161a] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#7d2ae8] transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#13161a] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#7d2ae8] transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Password</label>
            <div className="relative">
              <Icons.Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#13161a] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-[#7d2ae8] transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00c4cc] to-[#7d2ae8] hover:from-[#00b3ba] hover:to-[#6b23c5] text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="ml-2 text-[#00c4cc] hover:text-white font-bold transition-colors"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
