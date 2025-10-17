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

  const linkBase = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ease-out relative group";
  const linkActive = "bg-gradient-to-r from-water-500/10 to-blue-500/10 text-water-700 dark:text-water-200 border border-water-200/50 dark:border-water-700/50 shadow-sm";
  const linkInactive = "text-gray-600 dark:text-gray-400 hover:text-water-600 dark:hover:text-water-300 hover:bg-water-50/50 dark:hover:bg-slate-800/50 hover:shadow-sm hover:scale-105";

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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-gradient-to-r from-white/95 via-blue-50/95 to-white/95 dark:from-slate-900/95 dark:via-slate-800/95 dark:to-slate-900/95 border-b border-water-200/30 dark:border-slate-700/30 shadow-sm">
      <div className="mx-auto max-w-7xl px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg border border-water-200/40 dark:border-water-700/40 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-water-50/80 dark:hover:bg-slate-700/50 hover:scale-105 transition-all duration-200"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4 text-water-600 dark:text-water-300" /> : <Menu className="h-4 w-4 text-water-600 dark:text-water-300" />}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative group">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-water-500 to-water-600 shadow-md flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-400 to-water-500 animate-pulse"></div>
            </div>
            <div>
              <div className="text-sm font-bold bg-gradient-to-r from-water-700 to-blue-600 dark:from-water-300 dark:to-blue-400 bg-clip-text text-transparent">
                ADE BRH
              </div>
              <div className="text-xs text-water-500 dark:text-water-400 font-medium hidden sm:block">
                Système
              </div>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <LayoutDashboard className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> 
            <span className="hidden lg:inline">Dashboard</span>
          </NavLink>
          <NavLink to="/centres" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Building2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> 
            <span className="hidden lg:inline">Centres</span>
          </NavLink>
          <NavLink to="/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Building2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> 
            <span className="hidden lg:inline">Agences</span>
          </NavLink>
          <NavLink to="/communes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <MapPin className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> 
            <span className="hidden lg:inline">Communes</span>
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Users className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> 
            <span className="hidden lg:inline">Utilisateurs</span>
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <FolderOpen className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> 
            <span className="hidden lg:inline">Catégories</span>
          </NavLink>
          <NavLink to="/kpi" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <BarChart3 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> 
            <span className="hidden lg:inline">Saisie des Données</span>
          </NavLink>
          <NavLink to="/objectives" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Target className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> 
            <span className="hidden lg:inline">Objectifs</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-1">
          {/* Badge notifications */}
          <button className="relative inline-flex h-7 w-7 items-center justify-center rounded-md border border-water-200/40 dark:border-water-700/40 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-water-50/80 dark:hover:bg-slate-700/50 hover:scale-105 transition-all duration-200 group">
            <Bell className="h-3.5 w-3.5 text-water-600 dark:text-water-300 group-hover:text-water-700 dark:group-hover:text-water-200 transition-colors" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1 shadow-md animate-pulse">
                {unread}
              </span>
            )}
          </button>

          <ThemeToggle />

          {/* User info and logout */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-md bg-water-50/50 dark:bg-slate-800/50">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-water-500 to-water-600 text-white grid place-items-center font-bold text-xs shadow-sm">
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
                className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-105 transition-all duration-200"
                title="Déconnexion"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            ) : (
              <NavLink
                to="/login"
                className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:scale-105 transition-all duration-200"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Connexion</span>
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-water-200/30 dark:border-slate-700/30 px-2 pb-1.5 bg-gradient-to-b from-white/95 to-blue-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl">
          <div className="flex flex-col gap-0.5 pt-1.5">
            <NavLink onClick={() => setOpen(false)} to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <LayoutDashboard className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Dashboard
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/centres" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Building2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Centres
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Building2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Agences
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/communes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <MapPin className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Communes
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Users className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Utilisateurs
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/categories" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <FolderOpen className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Catégories
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/kpi" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <BarChart3 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> KPIs
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/objectives" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Target className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Objectifs
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;


