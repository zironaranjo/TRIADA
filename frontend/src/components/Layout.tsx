import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Building2,
    CalendarDays,
    Users,
    ContactIcon,
    PiggyBank,
    Settings,
    LogOut,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
    const location = useLocation();
    const { signOut, profile } = useAuth();

    const isActive = (path: string) => location.pathname.startsWith(path);

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/properties', label: 'Properties', icon: Building2 },
        { path: '/bookings', label: 'Bookings', icon: CalendarDays },
        { path: '/owners', label: 'Owners', icon: Users },
        { path: '/crm', label: 'CRM', icon: ContactIcon },
        { path: '/accounting', label: 'Finance Engine', icon: PiggyBank },
    ];

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#0f172a]">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-[#0f172a]/50 backdrop-blur-xl flex flex-col">
                {/* Logo Area */}
                <div className="flex flex-col items-center justify-center py-8 border-b border-white/5">
                    <img src="/logotriadak.png" alt="TRIADA" className="h-52 w-auto max-w-full px-2 object-contain mb-0 drop-shadow-xl" />
                    <span className="text-xs font-bold text-slate-500 tracking-[0.3em] uppercase opacity-80 -mt-2">
                        Vacational Renting
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative overflow-hidden",
                                    active
                                        ? "text-white bg-white/5 shadow-inner"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {active && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                                <item.icon className={cn("h-5 w-5 transition-colors", active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300")} />
                                <span className="flex-1">{item.label}</span>
                                {active && <ChevronRight className="h-4 w-4 text-slate-500" />}
                            </Link>
                        );
                    })}

                    <div className="mt-8">
                        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">System</p>
                        <Link
                            to="/billing"
                            className={cn(
                                "group flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                                isActive('/billing')
                                    ? "text-white bg-white/5 shadow-inner"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Settings className="h-5 w-5 text-slate-500" />
                            Billing
                        </Link>
                    </div>
                </nav>

                {/* User Profile Footer */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <div className="rounded-xl bg-white/5 p-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">
                                    {profile?.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {profile?.full_name || profile?.email?.split('@')[0] || 'User'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${profile?.role === 'admin'
                                        ? 'bg-amber-500/20 text-amber-400'
                                        : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {profile?.role || 'owner'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={signOut}
                        className="mt-4 flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full justify-center"
                    >
                        <LogOut className="h-3 w-3" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] relative">
                {/* Background decorative elements */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
