import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Building2, LogOut, Bell, ChevronDown, User, Settings as SettingsIcon, Shield, Crown, Sparkles, FolderOpen, BarChart3, Target } from 'lucide-react';
import notificationsService from '../services/notificationsService';
import ThemeToggle from './ThemeToggle';
import authService from '../services/authService';

const NavBar = () => {
  const [open, setOpen] = React.useState(false);
  const [adminOpen, setAdminOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
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
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-xl border border-water-200/60 dark:border-water-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-water-50/80 dark:hover:bg-slate-700/50 transition-all duration-200"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5 text-water-600 dark:text-water-300" /> : <Menu className="h-5 w-5 text-water-600 dark:text-water-300" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-water-500 to-water-600 shadow-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-blue-400 to-water-500 animate-pulse"></div>
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

        <nav className="hidden md:flex items-center gap-3">
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-2.5 rounded-xl font-medium`}>
            <LayoutDashboard className="h-4 w-4" /> Tableau de bord
          </NavLink>
          <NavLink to="/dashboard/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-2.5 rounded-xl font-medium`}>
            <Building2 className="h-4 w-4" /> Agences
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-2.5 rounded-xl font-medium`}>
            <Users className="h-4 w-4" /> Utilisateurs
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-2.5 rounded-xl font-medium`}>
            <FolderOpen className="h-4 w-4" /> Catégories
          </NavLink>
          <NavLink to="/kpi" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-2.5 rounded-xl font-medium`}>
            <BarChart3 className="h-4 w-4" /> KPIs
          </NavLink>
          <NavLink to="/objectives" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-2.5 rounded-xl font-medium`}>
            <Target className="h-4 w-4" /> Objectifs
          </NavLink>
          <NavLink to="/centres" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-2.5 rounded-xl font-medium`}>
            <Building2 className="h-4 w-4" /> Centres
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          {/* Badge notifications */}
          <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-water-200/60 dark:border-water-700/60 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-water-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 group">
            <Bell className="h-5 w-5 text-water-600 dark:text-water-300 group-hover:text-water-700 dark:group-hover:text-water-200 transition-colors" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 shadow-lg animate-pulse">
                {unread}
              </span>
            )}
          </button>

          <ThemeToggle />

          {/* Profil */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="inline-flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-water-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 group"
            >
              <div className="relative">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-water-500 to-water-600 text-white grid place-items-center font-bold text-sm shadow-lg group-hover:shadow-xl transition-shadow">
                  {initials}
                </div>
                {user?.role && (
                  <span className="absolute -bottom-1 -right-1 text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-water-500 to-blue-500 text-white border-2 border-white dark:border-slate-900 font-bold shadow-lg">
                    {user.role === 'Administrateur' ? <Crown className="h-2 w-2 inline" /> : user.role}
                  </span>
                )}
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-sm font-semibold leading-4 text-water-800 dark:text-water-100">{user?.username || 'Invité'}</div>
                <div className="text-xs text-water-500 dark:text-water-400 truncate max-w-[120px]">{user?.email || 'Non connecté'}</div>
              </div>
              <ChevronDown className={`h-4 w-4 text-water-600 dark:text-water-300 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-water-200/60 dark:border-water-700/60 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-xl shadow-water-100/20 dark:shadow-slate-900/20 p-4 animate-in slide-in-from-top-2 duration-200">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-2">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-water-500 to-water-600 text-white grid place-items-center font-bold shadow-lg">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-water-800 dark:text-water-100 truncate">{user.username}</div>
                        <div className="text-xs text-water-500 dark:text-water-400 truncate">{user.email}</div>
                        <div className="flex items-center gap-1 mt-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></div>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">En ligne</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-px my-3 bg-gradient-to-r from-transparent via-water-200 dark:via-water-700 to-transparent" />
                    <div className="space-y-1">
                      <NavLink onClick={() => setProfileOpen(false)} to="/profile" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} w-full px-3 py-2.5 rounded-xl`}>
                        <User className="h-4 w-4" /> Mon Profil
                      </NavLink>
                      <NavLink onClick={() => setProfileOpen(false)} to="/settings" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} w-full px-3 py-2.5 rounded-xl`}>
                        <SettingsIcon className="h-4 w-4" /> Paramètres
                      </NavLink>
                      <button onClick={handleLogout} className={`${linkBase} ${linkInactive} w-full px-3 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20`}>
                        <LogOut className="h-4 w-4" /> Déconnexion
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <div className="px-2 py-2 text-sm text-water-600 dark:text-water-400">Non connecté</div>
                    <NavLink onClick={() => setProfileOpen(false)} to="/login" className={`${linkBase} ${linkInactive} w-full px-3 py-2.5 rounded-xl text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20`}>
                      <User className="h-4 w-4" /> Connexion
                    </NavLink>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-water-200/50 dark:border-slate-700/50 px-6 pb-4 bg-gradient-to-b from-white/95 to-blue-50/95 dark:from-slate-800/95 dark:to-slate-900/95 backdrop-blur-xl">
          <div className="flex flex-col gap-2 pt-4">
            <NavLink onClick={() => setOpen(false)} to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-3 rounded-xl font-medium`}>
              <LayoutDashboard className="h-4 w-4" /> Tableau de bord
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/dashboard/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-3 rounded-xl font-medium`}>
              <Building2 className="h-4 w-4" /> Agences
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-3 rounded-xl font-medium`}>
              <Users className="h-4 w-4" /> Utilisateurs
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/categories" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-3 rounded-xl font-medium`}>
              <FolderOpen className="h-4 w-4" /> Catégories
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/kpi" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-3 rounded-xl font-medium`}>
              <BarChart3 className="h-4 w-4" /> KPIs
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/objectives" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} px-4 py-3 rounded-xl font-medium`}>
              <Target className="h-4 w-4" /> Objectifs
            </NavLink>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;


