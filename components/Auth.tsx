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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isForgotPassword) {
        const { error: resetError } = await authService.resetPassword(email);
        if (resetError) {
          setError(resetError);
        } else {
          setResetEmailSent(true);
        }
        setLoading(false);
        return;
      }

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
      setError('Failed to start Google Sign In');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[140px] animate-pulse-slow"></div>
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[140px] animate-pulse-slow"
          style={{ animationDelay: '2s' }}
        ></div>
      </div>

      {/* Back to Home */}
      <a
        href="/"
        className="absolute top-8 left-8 z-50 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white transition-colors group"
      >
        <Icons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </a>

      <div className="flex w-full max-w-[1000px] h-[700px] bg-[#0a0a0a] rounded-[32px] border border-white/5 shadow-2xl relative z-10 overflow-hidden m-6">
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
                Design is AI.
              </span>
            </h2>
            <p className="text-gray-400 text-lg max-w-sm leading-relaxed font-medium">
              Join thousands of professionals creating high-end graphics at the speed of thought.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-[#111] bg-gray-800 flex items-center justify-center text-[10px] font-black"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trusted by 50k+ Creators</p>
            </div>

            <div className="flex items-center gap-6">
              {['Design', 'AI', 'Export'].map((f) => (
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
                {isForgotPassword ? 'Reset Password' : isSignUp ? 'Create your account' : 'Welcome back'}
              </h3>
              <p className="text-gray-500 font-medium leading-relaxed">
                {resetEmailSent
                  ? 'Check your inbox for a recovery link.'
                  : isForgotPassword
                    ? 'Enter your email to receive a password reset link.'
                    : isSignUp
                      ? 'Start your 14-day free trial of Pro.'
                      : ''}
              </p>
            </div>

            {resetEmailSent ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetEmailSent(false);
                }}
                className="w-full py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all"
              >
                Back to Sign In
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div role="alert" aria-live="assertive" className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs font-bold animate-shake flex items-center gap-3">
                    <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {isSignUp && (
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 tracking-[0.2em]"
                    >
                      Full Name
                    </label>
                    <div className="relative group">
                      <Icons.Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#00c4cc] transition-colors" />
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#13161a] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-[#00c4cc] focus:ring-4 focus:ring-[#00c4cc]/5 transition-all font-medium"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-[10px] font-black text-gray-500 uppercase mb-2 ml-1 tracking-[0.2em]"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-black group-focus-within:text-[#00c4cc] transition-colors">
                      @
                    </span>
                    <input
                      id="auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#13161a] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-[#00c4cc] focus:ring-4 focus:ring-[#00c4cc]/5 transition-all font-medium"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                {!isForgotPassword && (
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label
                        htmlFor="auth-password"
                        className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]"
                      >
                        Password
                      </label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-[9px] font-black text-[#7d2ae8] hover:text-[#00c4cc] uppercase tracking-widest transition-colors"
                        >
                          Forgot?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Icons.Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-[#7d2ae8] transition-colors" />
                      <input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#13161a] border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-[#7d2ae8] focus:ring-4 focus:ring-[#7d2ae8]/5 transition-all font-medium"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                    </div>
                    {isSignUp && (
                      <p className="mt-2 text-[9px] text-gray-600 font-medium ml-1 uppercase tracking-wider">
                        Must be at least 8 characters
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black hover:bg-[#00c4cc] hover:text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      {isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Create My Account' : 'Sign In'}
                      <Icons.ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {!isForgotPassword && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/5"></div>
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase font-black tracking-[0.3em] leading-none">
                    <span className="bg-[#0a0a0a] px-4 text-gray-600">Or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl py-4 px-6 text-white text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 disabled:opacity-50 group"
                >
                  <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}

            <div className="mt-12 text-center">
              <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">
                {isForgotPassword ? 'Remember your password?' : isSignUp ? 'Already a creator?' : 'New to Kreathief?'}
                <button
                  onClick={() => {
                    if (isForgotPassword) {
                      setIsForgotPassword(false);
                    } else {
                      setIsSignUp(!isSignUp);
                    }
                    setError(null);
                  }}
                  className="ml-3 text-white hover:text-[#00c4cc] font-black transition-all underline underline-offset-4 decoration-white/10 hover:decoration-[#00c4cc]/40"
                >
                  {isForgotPassword ? 'Sign In' : isSignUp ? 'Log In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
