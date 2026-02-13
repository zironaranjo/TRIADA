import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Building2,
    FileText,
    Settings,
    LogOut,
    ChevronRight,
    Menu,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

const OwnerLayout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { signOut, profile, isOwner, isAdmin } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // Only owners (and admins for testing) can access this layout
    if (!isOwner && !isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    const isActive = (path: string) => location.pathname.startsWith(path);

    useEffect(() => {
        const loadAvatar = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const savedPath = localStorage.getItem(`triadak_avatar_${user.id}`);
            if (savedPath) {
                const { data } = supabase.storage.from('property-images').getPublicUrl(savedPath);
                try {
                    const res = await fetch(data.publicUrl, { method: 'HEAD' });
                    if (res.ok) {
                        setAvatarUrl(data.publicUrl + '?t=' + Date.now());
                        return;
                    }
                } catch { /* fallback below */ }
            }

            try {
                const { data: files } = await supabase.storage.from('property-images').list(`avatars/${user.id}`);
                if (files && files.length > 0) {
                    const filePath = `avatars/${user.id}/${files[0].name}`;
                    localStorage.setItem(`triadak_avatar_${user.id}`, filePath);
                    const { data } = supabase.storage.from('property-images').getPublicUrl(filePath);
                    setAvatarUrl(data.publicUrl + '?t=' + Date.now());
                }
            } catch { /* no avatar */ }
        };
        loadAvatar();
    }, []);

    const navItems = [
        { path: '/owner/dashboard', labelKey: 'ownerPortal.nav.dashboard', icon: LayoutDashboard },
        { path: '/owner/properties', labelKey: 'ownerPortal.nav.properties', icon: Building2 },
        { path: '/owner/statements', labelKey: 'ownerPortal.nav.statements', icon: FileText },
    ];

    const handleNavClick = () => {
        setSidebarOpen(false);
    };

    const SidebarContent = () => (
        <>
            {/* Logo Area */}
            <div className="flex flex-col items-center justify-center py-6 lg:py-8 border-b border-white/5">
                <img src="/logotriadak.png" alt="TRIADAK" className="h-28 lg:h-40 w-auto max-w-full px-2 object-contain mb-1 drop-shadow-xl" />
                <span className="text-[10px] font-bold text-emerald-400/80 tracking-[0.25em] uppercase">
                    {t('ownerPortal.title')}
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 lg:py-6 space-y-1 overflow-y-auto">
                <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('ownerPortal.nav.menu')}</p>
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden",
                                active
                                    ? "text-white bg-white/5 shadow-inner"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            {active && (
                                <motion.div
                                    layoutId="ownerActiveNav"
                                    className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                            <item.icon className={cn("h-5 w-5 transition-colors", active ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300")} />
                            <span className="flex-1">{t(item.labelKey)}</span>
                            {active && <ChevronRight className="h-4 w-4 text-slate-500" />}
                        </Link>
                    );
                })}

                {/* Back to Admin (only for admins) */}
                {isAdmin && (
                    <div className="mt-8">
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('ownerPortal.nav.admin')}</p>
                        <Link
                            to="/dashboard"
                            onClick={handleNavClick}
                            className="group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-amber-400/80 hover:text-amber-300 hover:bg-white/5"
                        >
                            <Settings className="h-5 w-5 text-amber-500/60" />
                            {t('ownerPortal.nav.backToAdmin')}
                        </Link>
                    </div>
                )}
            </nav>

            {/* User Profile Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20">
                <div className="rounded-xl bg-white/5 p-3">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-sm font-bold text-white">
                                    {profile?.email?.charAt(0).toUpperCase() || 'O'}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {profile?.full_name || profile?.email?.split('@')[0] || 'Owner'}
                            </p>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                                {t('ownerPortal.role')}
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={signOut}
                    className="mt-3 flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full justify-center"
                >
                    <LogOut className="h-3 w-3" />
                    {t('layout.signOut')}
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#0f172a]">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-2">
                    <img src="/logotriadak.png" alt="TRIADAK" className="h-10 object-contain" />
                    <span className="text-[9px] font-bold text-emerald-400/70 tracking-wider uppercase">OWNER</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-xs font-bold text-white">
                            {profile?.email?.charAt(0).toUpperCase() || 'O'}
                        </span>
                    )}
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] z-50 bg-[#0f172a] border-r border-white/5 flex flex-col"
                        >
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white transition-colors z-10"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-white/5 bg-[#0f172a]/50 backdrop-blur-xl flex-col">
                <SidebarContent />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] relative pt-14 lg:pt-0">
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default OwnerLayout;
