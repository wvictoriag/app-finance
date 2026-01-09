import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, User as UserIcon, Mail, Key, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState(localStorage.getItem('lastLoginEmail') || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'account' | 'full' | 'password' | 'reset-password'>(email ? 'account' : 'full');
    const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (window.location.hash.includes('type=recovery')) {
            setViewMode('reset-password');
            toast.success('Modo de recuperación activado');
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setViewMode('reset-password');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (user && viewMode !== 'reset-password') {
            navigate('/');
        }
        checkConnection();
    }, [user, navigate, viewMode]);

    const checkConnection = async () => {
        try {
            const { error } = await supabase.from('_non_existent_table_').select('count').limit(1);
            setConnectionStatus(error && error.message === 'Failed to fetch' ? 'offline' : 'online');
        } catch {
            setConnectionStatus('offline');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            localStorage.setItem('lastLoginEmail', email);
            toast.success('¡Bienvenido de nuevo!');
        } catch (error: any) {
            toast.error(error.message === 'Failed to fetch' ? 'Error de conexión' : 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) return toast.error('Ingresa tu correo');
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });
            if (error) throw error;
            toast.success('Enlace de recuperación enviado');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) return toast.error('Mínimo 6 caracteres');
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success('Contraseña actualizada');
            navigate('/');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans relative overflow-hidden">
            {/* Animated Background */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-indigo-600/10 blur-[120px] rounded-full"
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, -90, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute bottom-[-20%] left-[-20%] w-[80%] h-[80%] bg-blue-600/10 blur-[120px] rounded-full"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full glass-panel p-8 md:p-10 relative z-10 border-white/10 shadow-2xl rounded-[2.5rem] bg-slate-900/40 backdrop-blur-xl"
            >
                <div className="text-center mb-10">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-6 cursor-pointer"
                    >
                        <TrendingUp size={40} className="text-white" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Guapacha</h2>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Finance Intelligence</p>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'reset-password' && (
                        <motion.form
                            key="reset"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleUpdatePassword}
                            className="space-y-6"
                        >
                            <div className="text-center mb-4">
                                <h3 className="text-xl font-bold text-white mb-2">Nueva Contraseña</h3>
                                <p className="text-sm text-slate-400">Por favor, elige tu nueva clave.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-lg placeholder-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg uppercase tracking-widest"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : 'Guardar y Entrar'}
                            </button>
                        </motion.form>
                    )}

                    {viewMode === 'account' && (
                        <motion.div
                            key="account"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div
                                onClick={() => setViewMode('password')}
                                className="group p-5 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-indigo-600/20 flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg text-white">
                                    <UserIcon size={28} />
                                </div>
                                <div className="flex-1 overflow-hidden text-left">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Bienvenido</p>
                                    <p className="text-lg text-white font-bold truncate leading-none">{email.split('@')[0]}</p>
                                    <p className="text-xs text-slate-500 truncate">{email}</p>
                                </div>
                                <LogIn size={20} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                            </div>

                            <button
                                onClick={() => setViewMode('full')}
                                className="w-full text-center text-[10px] text-slate-500 hover:text-white transition-colors font-black uppercase tracking-[0.2em]"
                            >
                                Usar otra cuenta
                            </button>
                        </motion.div>
                    )}

                    {(viewMode === 'password' || viewMode === 'full') && (
                        <motion.form
                            key="login"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            onSubmit={handleLogin}
                            className="space-y-6"
                        >
                            {viewMode === 'password' && (
                                <button
                                    type="button"
                                    onClick={() => setViewMode('account')}
                                    className="flex items-center gap-2 text-[10px] text-slate-500 hover:text-white transition-colors font-black uppercase tracking-widest mb-4"
                                >
                                    <ArrowLeft size={16} /> Volver
                                </button>
                            )}

                            <div className="space-y-5">
                                {viewMode === 'full' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                            <input
                                                type="email"
                                                placeholder="ejemplo@correo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-lg placeholder-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                    <div className="relative group">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                                        <input
                                            type="password"
                                            placeholder="Tu contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-lg placeholder-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg uppercase tracking-widest"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                    <>
                                        <span>Ingresar</span>
                                        <LogIn size={20} />
                                    </>
                                )}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Connection Indicator */}
                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center">
                    {connectionStatus === 'online' ? (
                        <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Sistema Activo</span>
                        </div>
                    ) : connectionStatus === 'offline' ? (
                        <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em]">Falla Crítica</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-500/10 px-4 py-2 rounded-full">
                            <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Sincronizando...</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
