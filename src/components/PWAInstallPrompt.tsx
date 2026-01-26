import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show prompt after 30 seconds if not dismissed
            setTimeout(() => {
                const dismissed = localStorage.getItem('pwa-install-dismissed');
                if (!dismissed) {
                    setShowPrompt(true);
                }
            }, 30000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    if (!showPrompt || !deferredPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-24 lg:bottom-8 left-4 right-4 lg:left-auto lg:right-8 lg:max-w-md z-[70]"
            >
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 shadow-2xl border border-white/20">
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                    >
                        <X size={16} className="text-white" />
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                            <Download className="text-blue-600" size={24} />
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-black text-white mb-2 tracking-tight">
                                ¡Instala Guapacha Finance!
                            </h3>
                            <p className="text-sm text-blue-100 mb-4 leading-relaxed font-medium">
                                Accede más rápido y úsala sin conexión. Instálala en tu dispositivo con un solo clic.
                            </p>

                            <button
                                onClick={handleInstall}
                                className="w-full py-3 bg-white text-blue-600 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all"
                            >
                                Instalar Ahora
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
