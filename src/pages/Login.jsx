import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, User as UserIcon, Mail, Key, ArrowLeft, Loader2, Wifi, WifiOff, Send, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function Login() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState(localStorage.getItem('lastLoginEmail') || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState(email ? 'account' : 'full');
    const [connectionStatus, setConnectionStatus] = useState('checking'); // 'checking', 'online', 'offline'

    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        // Force recovery mode if URL contains the recovery type
        if (window.location.hash.includes('type=recovery')) {
            setViewMode('reset-password');
            toast.success('Modo de recuperación activado. Define tu nueva contraseña.');
        }

        // Detect recovery event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setViewMode('reset-password');
                toast.success('Por favor, ingresa tu nueva contraseña');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        // Only redirect if we are NOT in reset-password mode
        if (user && viewMode !== 'reset-password') {
            navigate('/');
        }
        checkConnection();
    }, [user, navigate, viewMode]);

    const checkConnection = async () => {
        try {
            const { error } = await supabase.from('_non_existent_table_').select('count').limit(1);
            if (error && error.message === 'Failed to fetch') {
                setConnectionStatus('offline');
            } else {
                setConnectionStatus('online');
            }
        } catch (err) {
            setConnectionStatus('offline');
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            toast.success('¡Bienvenido de nuevo!');
        } catch (error) {
            toast.error(error.message === 'Failed to fetch'
                ? 'Error de conexión. Revisa tu internet o el estado del servidor.'
                : 'Credenciales inválidas. ¿Olvidaste tu contraseña?');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) return toast.error('Ingresa tu correo electrónico para enviarte el enlace');
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login`,
            });
            if (error) throw error;
            toast.success('Se ha enviado un enlace de recuperación a tu correo');
        } catch (error) {
            console.error('Password reset error:', error);
            const msg = error.message === 'Load failed' || error.message === 'Failed to fetch'
                ? 'Error de conexión. Por favor, refresca la página y vuelve a intentar.'
                : error.message;
            toast.error('Error: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            toast.success('¡Contraseña actualizada con éxito!');
            navigate('/');
        } catch (error) {
            toast.error('Error al actualizar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>

            <div className="max-w-md w-full glass-panel p-8 md:p-10 relative z-10 border-white/10 shadow-2xl overflow-hidden rounded-3xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-6">
                        <TrendingUp size={40} className="text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Guapacha</h2>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-[0.3em]">Intelligence Dashboard</p>
                </div>

                {/* Reset Password View */}
                {viewMode === 'reset-password' && (
                    <form onSubmit={handleUpdatePassword} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-4">
                            <h3 className="text-xl font-bold text-white mb-2">Nueva Contraseña</h3>
                            <p className="text-sm text-slate-400">Por favor, elige tu nueva clave de acceso.</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nueva Contraseña</label>
                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 text-lg placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : 'Guardar y Entrar'}
                        </button>
                    </form>
                )}

                {/* Account Selection View */}
                {viewMode === 'account' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div
                            onClick={() => setViewMode('password')}
                            className="group p-5 rounded-2xl bg-slate-900 border border-white/20 hover:border-indigo-500 cursor-pointer transition-all hover:bg-slate-800 flex items-center gap-4"
                        >
                            <div className="w-14 h-14 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg text-white">
                                <UserIcon size={28} />
                            </div>
                            <div className="flex-1 overflow-hidden text-left">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bienvenido</p>
                                <p className="text-lg text-white font-bold truncate leading-none">{email.split('@')[0]}</p>
                                <p className="text-xs text-slate-500 truncate">{email}</p>
                            </div>
                            <LogIn size={20} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </div>

                        <button
                            onClick={() => setViewMode('full')}
                            className="w-full text-center text-sm text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest"
                        >
                            Usar otra cuenta
                        </button>
                    </div>
                )}

                {/* Password Entry View or Full Login */}
                {(viewMode === 'password' || viewMode === 'full') && (
                    <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {viewMode === 'password' && (
                            <button
                                type="button"
                                onClick={() => setViewMode('account')}
                                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-widest mb-4"
                            >
                                <ArrowLeft size={16} /> Volver
                            </button>
                        )}

                        <div className="space-y-5">
                            {viewMode === 'full' && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                        <input
                                            type="email"
                                            placeholder="ejemplo@correo.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 text-lg placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                    <input
                                        type="password"
                                        placeholder="Tu contraseña"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white border-2 border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 text-lg placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
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
                                className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wide"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-lg uppercase tracking-widest"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : (
                                <>
                                    <span>Ingresar</span>
                                    <LogIn size={20} />
                                </>
                            )}
                        </button>

                        {viewMode === 'full' && email && (
                            <div className="pt-4 border-t border-white/5 text-center">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('account')}
                                    className="text-xs text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
                                >
                                    Ver cuentas recordadas
                                </button>
                            </div>
                        )}
                    </form>
                )}

                {/* Connection Indicator */}
                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center">
                    {connectionStatus === 'online' ? (
                        <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"></span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sistema en línea</span>
                        </div>
                    ) : connectionStatus === 'offline' ? (
                        <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Falla de conexión</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-slate-500/10 px-4 py-2 rounded-full">
                            <Loader2 className="w-3 h-3 text-slate-500 animate-spin" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verificando...</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

