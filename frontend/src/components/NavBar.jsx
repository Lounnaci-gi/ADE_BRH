import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Building2, LogOut, Bell, ChevronDown, User, Settings as SettingsIcon } from 'lucide-react';
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
    <header className="sticky top-0 z-40 backdrop-blur bg-white/70 dark:bg-slate-950/70 border-b border-water-100 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-water-200 dark:border-water-700"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-lg font-semibold text-water-800 dark:text-water-100">ADE BRH</div>
        </div>

        <nav className="hidden md:flex items-center gap-2">
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <LayoutDashboard className="h-4 w-4" /> Tableau de bord
          </NavLink>
          {/* Sous-menu Administration */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAdminOpen((v) => !v)}
              className={`${linkBase} ${linkInactive} inline-flex items-center gap-2`}
            >
              <Building2 className="h-4 w-4" /> Administration <ChevronDown className={`h-4 w-4 transition-transform ${adminOpen ? 'rotate-180' : ''}`} />
            </button>
            {adminOpen && (
              <div className="absolute mt-2 w-56 rounded-lg border border-water-100 dark:border-water-800 bg-[rgb(var(--card))] shadow-soft p-2">
                <NavLink to="/dashboard/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} w-full`}>
                  Agences
                </NavLink>
                <NavLink to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} w-full`}>
                  <Users className="h-4 w-4" /> Utilisateurs
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-3">
          {/* Badge notifications (exemple) */}
          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-water-200 dark:border-water-700 bg-[rgb(var(--card))]">
            <Bell className="h-5 w-5 text-water-600 dark:text-water-300" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-water-500 text-white text-[10px] px-1">{unread}</span>
            )}
          </button>

          <ThemeToggle />

          {/* Profil */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="inline-flex items-center gap-2"
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-water-100 dark:bg-water-800 text-water-700 dark:text-water-100 grid place-items-center font-semibold">
                  {initials}
                </div>
                {user?.role && (
                  <span className="absolute -bottom-1 -right-1 text-[10px] px-1.5 py-0.5 rounded-full bg-water-500 text-white border border-white dark:border-slate-900">
                    {user.role === 'Administrateur' ? 'Admin' : user.role}
                  </span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium leading-4">{user?.username || 'Utilisateur'}</div>
                <div className="text-xs text-[rgb(var(--muted))]">{user?.email || ''}</div>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-water-100 dark:border-water-800 bg-[rgb(var(--card))] shadow-soft p-2">
                <div className="px-2 py-1 text-xs text-[rgb(var(--muted))]">Connecté</div>
                <div className="px-2 py-1 text-sm font-medium truncate">{user?.username || 'Utilisateur'}</div>
                <div className="h-px my-2 bg-water-100 dark:bg-slate-800" />
                <NavLink onClick={() => setProfileOpen(false)} to="/profile" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} w-full justify-start`}>
                  <User className="h-4 w-4" /> Profil
                </NavLink>
                <NavLink onClick={() => setProfileOpen(false)} to="/settings" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive} w-full justify-start`}>
                  <SettingsIcon className="h-4 w-4" /> Paramètres
                </NavLink>
                <button onClick={handleLogout} className={`${linkBase} ${linkInactive} w-full justify-start`}>
                  <LogOut className="h-4 w-4" /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-water-100 dark:border-slate-800 px-4 pb-3">
          <div className="flex flex-col gap-2 pt-3">
            <NavLink onClick={() => setOpen(false)} to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <LayoutDashboard className="h-4 w-4" /> Tableau de bord
            </NavLink>
            {/* Sous-menu sur mobile */}
            <details className="group">
              <summary className={`${linkBase} ${linkInactive} list-none cursor-pointer flex items-center gap-2`}> 
                <Building2 className="h-4 w-4" /> Administration
              </summary>
              <div className="pl-2 mt-1 flex flex-col gap-2">
                <NavLink onClick={() => setOpen(false)} to="/dashboard/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
                  Agences
                </NavLink>
                <NavLink onClick={() => setOpen(false)} to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
                  <Users className="h-4 w-4" /> Utilisateurs
                </NavLink>
              </div>
            </details>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;


