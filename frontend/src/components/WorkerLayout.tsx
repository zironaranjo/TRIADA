import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  DollarSign,
  LogOut,
  Menu,
  X,
  HardHat,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function WorkerLayout() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: '/worker/tasks',    labelKey: 'worker.nav.tasks',    icon: ClipboardList },
    { path: '/worker/earnings', labelKey: 'worker.nav.earnings', icon: DollarSign },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className="p-5 border-b border-cyan-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <HardHat className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Triadak</p>
            <p className="text-cyan-400 text-xs">{t('worker.portal')}</p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-cyan-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-sm">
            {profile?.full_name?.charAt(0)?.toUpperCase() || profile?.email?.charAt(0)?.toUpperCase() || 'W'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{profile?.full_name || profile?.email}</p>
            <p className="text-cyan-400 text-xs">{t('worker.role')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-cyan-400' : '')} />
                <span className="flex-1">{t(item.labelKey)}</span>
                {isActive && <ChevronRight className="w-3 h-3 text-cyan-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-cyan-800/40">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
          {t('layout.signOut')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#0f172a] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-slate-900/80 border-r border-cyan-900/40">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900/95 border-b border-cyan-900/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardHat className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-bold text-sm">Triadak Worker</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-slate-400 hover:text-white">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-64 z-50 bg-slate-900 border-r border-cyan-900/40 md:hidden"
            >
              <div className="flex justify-end p-4">
                <button onClick={() => setMobileOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="pt-16 md:pt-0 p-4 md:p-6 max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
