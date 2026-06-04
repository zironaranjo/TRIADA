import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Building2,
    CalendarDays,
    Users,
    ContactIcon,
    PiggyBank,
    FileText,
    Settings,
    LogOut,
    ChevronRight,
    Menu,
    X,
    ExternalLink,
    HardHat,
    UsersRound,
    Globe,
    BarChart3,
    MessageSquare,
    ScrollText,
    TrendingUp,
    Trophy,
    ShieldCheck,
    Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import NotificationCenter from './NotificationCenter';

const Layout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { signOut, profile } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
        { path: '/dashboard', labelKey: 'layout.nav.dashboard', icon: LayoutDashboard },
        { path: '/properties', labelKey: 'layout.nav.properties', icon: Building2 },
        { path: '/bookings', labelKey: 'layout.nav.bookings', icon: CalendarDays },
        { path: '/owners', labelKey: 'layout.nav.owners', icon: Users },
        { path: '/crm', labelKey: 'layout.nav.crm', icon: ContactIcon },
        { path: '/accounting', labelKey: 'layout.nav.financeEngine', icon: PiggyBank },
        { path: '/statements', labelKey: 'layout.nav.ownerStatements', icon: FileText },
        { path: '/staff', labelKey: 'layout.nav.staffOps', icon: HardHat },
        { path: '/team', labelKey: 'layout.nav.teamChat', icon: UsersRound },
        { path: '/channels', labelKey: 'layout.nav.channels', icon: Globe },
        { path: '/occupancy', labelKey: 'layout.nav.occupancy', icon: BarChart3 },
        { path: '/messaging', labelKey: 'layout.nav.messaging', icon: MessageSquare },
        { path: '/contracts', labelKey: 'layout.nav.contracts', icon: ScrollText },
        { path: '/revenue', labelKey: 'layout.nav.revenue', icon: TrendingUp },
        { path: '/benchmarking', labelKey: 'layout.nav.benchmarking', icon: Trophy },
        { path: '/audit', labelKey: 'layout.nav.audit', icon: ShieldCheck },
        { path: '/backup', labelKey: 'layout.nav.backup', icon: Database },
    ];

    const handleNavClick = () => {
        setSidebarOpen(false);
    };

    const Avatar = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
        <div className={cn('avatar-ring', size === 'sm' ? 'h-8 w-8' : 'h-8 w-8')}>
            {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
                <span className="text-xs font-medium">
                    {profile?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
            )}
        </div>
    );

    const SidebarContent = () => (
        <>
            <div className="flex flex-col items-center justify-center border-b border-border py-6 lg:py-7">
                <img src="/logotriadak.png" alt="TRIADAK" className="h-28 lg:h-40 w-auto max-w-full px-3 object-contain" />
                <span className="text-label mt-2 opacity-80">
                    {t('layout.tagline')}
                </span>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 lg:py-5">
                <p className="text-label mb-2 px-3">{t('layout.mainMenu')}</p>
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleNavClick}
                            className={cn(
                                'group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-accent text-foreground'
                                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                            )}
                        >
                            {active && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="nav-active-bar"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                            <item.icon className={cn('h-5 w-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground')} />
                            <span className="flex-1">{t(item.labelKey)}</span>
                            {active && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                        </Link>
                    );
                })}

                <div className="mt-8">
                    <p className="text-label mb-2 px-3">{t('layout.system')}</p>
                    <Link
                        to="/settings"
                        onClick={handleNavClick}
                        className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                            isActive('/settings')
                                ? 'bg-accent text-foreground'
                                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        )}
                    >
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        {t('layout.nav.settings')}
                    </Link>
                    <Link
                        to="/owner/dashboard"
                        onClick={handleNavClick}
                        className="group mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-emerald-600/90 transition-colors hover:bg-accent/60 hover:text-emerald-500"
                    >
                        <ExternalLink className="h-5 w-5 opacity-70" />
                        {t('layout.nav.ownerPortal')}
                    </Link>
                </div>
            </nav>

            <div className="border-t border-border bg-background p-4">
                <div className="surface-card-muted rounded-xl p-3">
                    <div className="flex items-center gap-3">
                        <Avatar />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                                {profile?.full_name || profile?.email?.split('@')[0] || 'User'}
                            </p>
                            <span
                                className={cn(
                                    'mt-0.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                                    profile?.role === 'admin'
                                        ? 'bg-amber-500/15 text-amber-500'
                                        : 'bg-primary/15 text-primary',
                                )}
                            >
                                {profile?.role || 'owner'}
                            </span>
                        </div>
                        <div className="hidden lg:block">
                            <NotificationCenter />
                        </div>
                    </div>
                </div>

                <button
                    onClick={signOut}
                    className="mt-3 flex w-full items-center justify-center gap-2 text-xs text-muted-foreground transition-colors hover:text-destructive"
                >
                    <LogOut className="h-3 w-3" />
                    {t('layout.signOut')}
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <div className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur-sm lg:hidden">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <img src="/logotriadak.png" alt="TRIADAK" className="h-16 object-contain" />
                <div className="flex items-center gap-2">
                    <NotificationCenter />
                    <Avatar size="sm" />
                </div>
            </div>

            <AnimatePresence>
                {sidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 top-0 z-50 flex w-[280px] flex-col border-r border-border bg-background lg:hidden"
                        >
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="absolute right-4 top-4 z-10 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
                <SidebarContent />
            </aside>

            <main className="relative flex-1 overflow-y-auto bg-background pt-14 lg:pt-0">
                <div className="relative z-10 min-h-full p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
