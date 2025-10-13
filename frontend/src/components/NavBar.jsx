import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Building2, LogOut, Bell, Crown, Sparkles, FolderOpen, BarChart3, Target, MapPin } from 'lucide-react';
import notificationsService from '../services/notificationsService';
import ThemeToggle from './ThemeToggle';
import authService from '../services/authService';

const NavBar = () => {
  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const navigate = useNavigate();

  const linkBase = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  const linkActive = "bg-[rgb(var(--card))] text-water-700 dark:text-water-200 border border-water-100 dark:border-water-800";
  const linkInactive = "text-[rgb(var(--fg))]/80 hover:text-[rgb(var(--fg))] hover:bg-water-50 dark:hover:bg-slate-800";

  const user = authService.getCurrentUser();
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

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const count = await notificationsService.getUnreadCount();
        if (mounted) setUnread(count);
      } catch {}
    };
    load();
    const id = setInterval(load, 30000); // refresh toutes les 30s
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-white/90 via-blue-50/90 to-white/90 dark:from-slate-900/90 dark:via-slate-800/90 dark:to-slate-900/90 border-b border-water-200/50 dark:border-slate-700/50 shadow-lg shadow-water-100/20 dark:shadow-slate-900/20">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl border border-water-200/60 dark:border-water-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-water-50/80 dark:hover:bg-slate-700/50 transition-all duration-200"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5 text-water-600 dark:text-water-300" /> : <Menu className="h-5 w-5 text-water-600 dark:text-water-300" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-water-500 to-water-600 shadow-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-blue-400 to-water-500 animate-pulse"></div>
            </div>
            <div>
              <div className="text-lg font-bold bg-gradient-to-r from-water-700 to-blue-600 dark:from-water-300 dark:to-blue-400 bg-clip-text text-transparent">
                ADE BRH
              </div>
              <div className="text-xs text-water-500 dark:text-water-400 font-medium">
                Système de Gestion
              </div>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </NavLink>
          <NavLink to="/centres" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
            <Building2 className="h-4 w-4" /> Centres
          </NavLink>
          <NavLink to="/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
            <Building2 className="h-4 w-4" /> Agences
          </NavLink>
          <NavLink to="/communes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
            <MapPin className="h-4 w-4" /> Communes
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
            <Users className="h-4 w-4" /> Utilisateurs
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
            <FolderOpen className="h-4 w-4" /> Catégories
          </NavLink>
          <NavLink to="/kpi" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
            <BarChart3 className="h-4 w-4" /> KPIs
          </NavLink>
          <NavLink to="/objectives" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
            <Target className="h-4 w-4" /> Objectifs
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          {/* Badge notifications */}
          <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-water-200/60 dark:border-water-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-water-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 group">
            <Bell className="h-4 w-4 text-water-600 dark:text-water-300 group-hover:text-water-700 dark:group-hover:text-water-200 transition-colors" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1 shadow-lg animate-pulse">
                {unread}
              </span>
            )}
          </button>

          <ThemeToggle />

          {/* User info and logout */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-water-50/50 dark:bg-slate-800/50">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-water-500 to-water-600 text-white grid place-items-center font-bold text-xs shadow-sm">
                {initials}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-xs font-semibold text-water-800 dark:text-water-100">{user?.username || 'Invité'}</div>
                {user?.role && (
                  <div className="text-xs text-water-500 dark:text-water-400 flex items-center gap-1">
                    {user.role === 'Administrateur' ? <Crown className="h-2 w-2" /> : null}
                    {user.role}
                  </div>
                )}
              </div>
            </div>
            
            {user ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            ) : (
              <NavLink
                to="/login"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Connexion</span>
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-water-200/50 dark:border-slate-700/50 px-3 pb-2 bg-gradient-to-b from-white/95 to-blue-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl">
          <div className="flex flex-col gap-1 pt-2">
            <NavLink onClick={() => setOpen(false)} to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/centres" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
              <Building2 className="h-4 w-4" /> Centres
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
              <Building2 className="h-4 w-4" /> Agences
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/communes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
              <MapPin className="h-4 w-4" /> Communes
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
              <Users className="h-4 w-4" /> Utilisateurs
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/categories" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
              <FolderOpen className="h-4 w-4" /> Catégories
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/kpi" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
              <BarChart3 className="h-4 w-4" /> KPIs
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/objectives" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-3 py-2 rounded-lg text-sm`}>
              <Target className="h-4 w-4" /> Objectifs
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;


