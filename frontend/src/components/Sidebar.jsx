import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, LogOut, FolderOpen, BarChart3, Target, MapPin, Sparkles, Settings as SettingsIcon, User, Crown } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import authService from '../services/authService';

const navItemBase = 'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors';
const navItemActive = 'bg-white/60 dark:bg-slate-800/60 text-water-700 dark:text-water-100 border border-water-100/60 dark:border-slate-700';
const navItemInactive = 'text-[rgb(var(--fg))]/80 hover:text-[rgb(var(--fg))] hover:bg-white/50 dark:hover:bg-slate-800/50';

function Sidebar() {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();

  const initials = React.useMemo(() => {
    if (!user?.username) return 'U';
    const parts = String(user.username).split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second || first).toUpperCase();
  }, [user]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <aside className="h-screen sticky top-0 hidden md:flex md:flex-col w-72 shrink-0 border-r border-water-100 dark:border-slate-800 bg-gradient-to-b from-white/80 to-blue-50/80 dark:from-slate-900/80 dark:to-slate-900/80 backdrop-blur-xl">
      <div className="px-4 pt-5 pb-4 border-b border-water-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-water-500 to-water-600 shadow-lg grid place-items-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold bg-gradient-to-r from-water-700 to-blue-600 dark:from-water-300 dark:to-blue-400 bg-clip-text text-transparent">
              ADE BRH
            </div>
            <div className="text-xs text-water-500 dark:text-water-400 font-medium">
              Système de Gestion
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <NavLink to="/dashboard" className={({ isActive }) => `${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
          <LayoutDashboard className="h-4 w-4" /> Tableau de bord
        </NavLink>
        <NavLink to="/centres" className={({ isActive }) => `${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
          <Building2 className="h-4 w-4" /> Centres
        </NavLink>
        <NavLink to="/dashboard/agences" className={({ isActive }) => `${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
          <Building2 className="h-4 w-4" /> Agences
        </NavLink>
        <NavLink to="/communes" className={({ isActive }) => `${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
          <MapPin className="h-4 w-4" /> Communes
        </NavLink>
        <NavLink to="/users" className={({ isActive }) => `${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
          <Users className="h-4 w-4" /> Utilisateurs
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => `${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
          <FolderOpen className="h-4 w-4" /> Catégories
        </NavLink>
        <NavLink to="/kpi" className={({ isActive }) => `${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
          <BarChart3 className="h-4 w-4" /> KPIs
        </NavLink>
        <NavLink to="/objectives" className={({ isActive }) => `${navItemBase} ${isActive ? navItemActive : navItemInactive}`}>
          <Target className="h-4 w-4" /> Objectifs
        </NavLink>
      </div>

      <div className="p-4 border-t border-water-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-water-500 to-water-600 text-white grid place-items-center font-bold text-sm">
              {initials}
            </div>
            {user?.role && (
              <span className="absolute -bottom-1 -right-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-water-500 to-blue-500 text-white border-2 border-white dark:border-slate-900 font-bold">
                {user.role === 'Administrateur' ? <Crown className="h-2 w-2 inline" /> : user.role}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-water-800 dark:text-water-100 truncate">{user?.username || 'Invité'}</div>
            <div className="text-xs text-water-500 dark:text-water-400 truncate">{user?.email || 'Non connecté'}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <ThemeToggle />
          <button onClick={handleLogout} className="inline-flex items-center gap-2 text-red-600 dark:text-red-400 hover:underline">
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
