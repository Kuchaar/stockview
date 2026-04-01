import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { X, Loader2, Mail, Lock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({ open, onClose }) {
  const { signIn, signUp } = useAuth();
  const { lang } = useLang();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const t = {
    pl: {
      loginTitle: 'Zaloguj się',
      registerTitle: 'Zarejestruj się',
      email: 'Email',
      password: 'Hasło',
      confirmPassword: 'Potwierdź hasło',
      loginBtn: 'Zaloguj się',
      registerBtn: 'Zarejestruj się',
      noAccount: 'Nie masz konta?',
      hasAccount: 'Masz już konto?',
      switchToRegister: 'Zarejestruj się',
      switchToLogin: 'Zaloguj się',
      passwordMismatch: 'Hasła nie są zgodne.',
      passwordTooShort: 'Hasło musi mieć min. 6 znaków.',
      checkEmail: 'Sprawdź email aby potwierdzić konto.',
      invalidCredentials: 'Nieprawidłowy email lub hasło.',
    },
    en: {
      loginTitle: 'Sign in',
      registerTitle: 'Sign up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      loginBtn: 'Sign in',
      registerBtn: 'Sign up',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      switchToRegister: 'Sign up',
      switchToLogin: 'Sign in',
      passwordMismatch: 'Passwords do not match.',
      passwordTooShort: 'Password must be at least 6 characters.',
      checkEmail: 'Check your email to confirm your account.',
      invalidCredentials: 'Invalid email or password.',
    },
  }[lang];

  function resetForm() {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setRegistered(false);
  }

  function switchMode(newMode) {
    resetForm();
    setMode(newMode);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    setLoading(false);

    if (err) {
      setError(t.invalidCredentials);
    } else {
      resetForm();
      onClose();
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t.passwordTooShort);
      return;
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch);
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email, password);
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setRegistered(true);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            className="glass card w-full max-w-md relative !p-0 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center
                       text-surface-400 hover:text-surface-600 dark:hover:text-surface-200
                       hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-8">
              {/* Title */}
              <h2 className="font-display font-bold text-xl mb-6">
                {mode === 'login' ? t.loginTitle : t.registerTitle}
              </h2>

              {/* Success after registration */}
              {registered ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <p className="text-sm text-surface-500">{t.checkEmail}</p>
                  <button
                    onClick={() => switchMode('login')}
                    className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline mt-2"
                  >
                    {t.switchToLogin}
                  </button>
                </div>
              ) : (
                <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.email}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-900
                               border border-surface-200/60 dark:border-surface-800/50
                               text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40
                               placeholder:text-surface-400 transition-all duration-200"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.password}
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-900
                               border border-surface-200/60 dark:border-surface-800/50
                               text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40
                               placeholder:text-surface-400 transition-all duration-200"
                    />
                  </div>

                  {/* Confirm password (register only) */}
                  {mode === 'register' && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t.confirmPassword}
                        minLength={6}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-900
                                 border border-surface-200/60 dark:border-surface-800/50
                                 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40
                                 placeholder:text-surface-400 transition-all duration-200"
                      />
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <p className="text-red-500 dark:text-red-400 text-xs font-medium px-1">
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white
                             py-2.5 rounded-xl text-sm font-medium shadow-md shadow-brand-600/20
                             hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed
                             transition-all duration-200"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {mode === 'login' ? t.loginBtn : t.registerBtn}
                  </button>

                  {/* Switch mode */}
                  <p className="text-center text-xs text-surface-500 pt-2">
                    {mode === 'login' ? t.noAccount : t.hasAccount}{' '}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                      className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
                    >
                      {mode === 'login' ? t.switchToRegister : t.switchToLogin}
                    </button>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
