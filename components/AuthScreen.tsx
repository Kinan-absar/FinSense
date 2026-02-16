import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth } from '../firebase';
import { Language } from '../translations';
import { Wallet, Mail, Lock, ArrowRight, Loader2, UserPlus, LogIn, Languages } from 'lucide-react';

interface Props {
  lang: Language;
  onLanguageToggle: () => void;
}

const AuthScreen: React.FC<Props> = ({ lang, onLanguageToggle }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-gradient flex items-center justify-center p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full">
        <div className="flex justify-end mb-4">
          <button 
            onClick={onLanguageToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur rounded-full text-xs font-bold text-blue-600 border border-white/50"
          >
            <Languages className="w-4 h-4" />
            {lang === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-200 mx-auto mb-6">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">FinSense AI</h1>
          <p className="text-gray-500 mt-2 font-medium">
            {isLogin 
              ? (lang === 'ar' ? 'مرحباً بك مجدداً في مستقبلك المالي' : 'Welcome back to your financial future')
              : (lang === 'ar' ? 'ابدأ رحلتك المالية الذكية اليوم' : 'Start your smart financial journey today')}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100">
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">
                {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium`}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <Lock className={`absolute ${lang === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  <span>{isLogin ? (lang === 'ar' ? 'تسجيل الدخول' : 'Sign In') : (lang === 'ar' ? 'إنشاء حساب' : 'Create Account')}</span>
                  <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors"
            >
              {isLogin 
                ? (lang === 'ar' ? 'ليس لديك حساب؟ انضم إلينا' : "Don't have an account? Join us")
                : (lang === 'ar' ? 'لديك حساب بالفعل؟ سجل دخولك' : 'Already have an account? Sign In')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;