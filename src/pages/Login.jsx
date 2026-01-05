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

    useEffect(() => {
        if (user) {
            navigate('/');
        }
        checkConnection();
    }, [user, navigate]);

    const checkConnection = async () => {
        try {
            const { error } = await supabase.from('_non_existent_table_').select('count').limit(1);
            // If we get an error that isn't a network error (like table doesn't exist), we are online
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

    const handleMagicLink = async () => {
        if (!email) return toast.error('Ingresa un correo primero');
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                },
            });
            if (error) throw error;
            toast.success('Link enviado! Revisa tu correo.');
        } catch (error) {
            toast.error('Error al enviar el link: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>

            <div className="max-w-md w-full glass-panel p-10 relative z-10 border-white/5 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-6">
                        <TrendingUp size={32} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Guapacha Finance</h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Intelligence Dashboard</p>
                </div>

                {/* Account Selection View */}
                {viewMode === 'account' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div
                            onClick={() => setViewMode('password')}
                            className="group p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/50 cursor-pointer transition-all hover:bg-white/10 flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all text-indigo-400">
                                <UserIcon size={24} />
                            </div>
                            <div className="flex-1 overflow-hidden text-left">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cuenta recordada</p>
                                <p className="text-white font-medium truncate">{email}</p>
                            </div>
                            <LogIn size={18} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>

                        <button
                            onClick={() => setViewMode('full')}
                            className="w-full text-center text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest"
                        >
                            Usar otra cuenta
                        </button>
                    </div>
                )}

                {/* Password Entry View */}
                {(viewMode === 'password' || viewMode === 'full') && (
                    <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {viewMode === 'password' && (
                            <button
                                onClick={() => setViewMode('account')}
                                className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors uppercase tracking-widest mb-4"
                            >
                                <ArrowLeft size={14} /> Volver
                            </button>
                        )}

                        <div className="space-y-4">
                            {viewMode === 'full' && (
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                    <input
                                        type="email"
                                        placeholder="Correo electrónico"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                        required
                                    />
                                </div>
                            )}

                            <div className="relative group">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Iniciar Sesión'}
                        </button>

                        <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={handleMagicLink}
                                disabled={loading}
                                className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                            >
                                <Send size={14} /> Acceso Rápido sin Contraseña
                            </button>
                            {viewMode === 'full' && email && (
                                <button
                                    type="button"
                                    onClick={() => setViewMode('account')}
                                    className="w-full text-center text-[10px] text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-colors"
                                >
                                    Cuentas recordadas
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* Connection Indicator */}
                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        {connectionStatus === 'online' ? (
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sistema en línea</span>
                            </div>
                        ) : connectionStatus === 'offline' ? (
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Falla de conexión</span>
                            </div>
                        ) : (
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verificando...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

