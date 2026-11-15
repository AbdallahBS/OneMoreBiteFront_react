import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginAdminRequest, loginRequest } from '../api/auth';
import { ROLE } from '../lib/roles';
import Brand from '../components/Brand';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Veuillez renseigner votre email administratif et votre mot de passe.');
      return;
    }

    setLoading(true);

    try {
      await login('admin', { email: email.trim(), motDePasse: password });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err?.message || 'Accès refusé. Vérifiez vos identifiants administrateur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#140F11] text-[#F3ECEE] flex flex-col justify-between selection:bg-[#7B263A] selection:text-white">
      {/* Top minimal header */}
      <header className="w-full px-6 py-5 flex items-center justify-between border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 group">
          <Brand showTagline={false} />
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 text-xs font-semibold tracking-wider uppercase">
            Portail Officiel
          </span>
        </Link>
        <Link
          to="/"
          className="text-xs font-medium text-white/70 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Retour au site public</span>
        </Link>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md bg-[#1F171A] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle burgundy ambient glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#7B263A]/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#496640]/30 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-red-400">admin_panel_settings</span>
              <span>Espace Restreint — Direction & Modération</span>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
              Connexion Administrateur
            </h1>
            <p className="text-sm text-white/60">
              Accédez à la supervision des commerçants, validation des comptes et statistiques globales.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
              <span className="material-symbols-outlined text-red-400 text-[18px] shrink-0 mt-0.5">
                error
              </span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Email Administrateur
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-[18px]">
                  alternate_email
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@onemorebite.tn"
                  className="w-full bg-black/40 border border-white/15 focus:border-[#7B263A] focus:ring-2 focus:ring-[#7B263A]/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 transition-all outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70">
                  Mot de passe sécurisé
                </label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-[18px]">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/40 border border-white/15 focus:border-[#7B263A] focus:ring-2 focus:ring-[#7B263A]/40 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/30 transition-all outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#7B263A] to-[#9E334D] hover:from-[#8C2C43] hover:to-[#B03A56] text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  <span>Vérification des accès...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">security</span>
                  <span>Accéder au Dashboard Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Quick info / dev credentials hint */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-white/40">
            <p>
              Accès réservé au personnel habilité. Toute tentative d'accès non autorisé est journalisée.
            </p>
          </div>
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="w-full px-6 py-4 text-center text-xs text-white/40 border-t border-white/10">
        © 2026 One More Bite Inc. — Système de Sauvetage Alimentaire Tunisien
      </footer>
    </div>
  );
}

