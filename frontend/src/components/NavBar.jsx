import React from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Building2, LogOut, Bell, Crown, Sparkles, FolderOpen, BarChart3, Target, MapPin, ChevronDown, FileText } from 'lucide-react';
import notificationsService from '../services/notificationsService';
import ThemeToggle from './ThemeToggle';
import authService from '../services/authService';

const NavBar = () => {
  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const [agenciesStatus, setAgenciesStatus] = React.useState({ agencies: [], summary: { total: 0, completed: 0, pending: 0 } });
  const [showAgenciesStatus, setShowAgenciesStatus] = React.useState(false);
  const [showDataMenu, setShowDataMenu] = React.useState(false);
  const navigate = useNavigate();

  const linkBase = "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 ease-out relative group overflow-hidden";
  const linkActive = "text-water-700 dark:text-water-200 bg-white/10 dark:bg-slate-900/20 ring-1 ring-inset ring-water-400/40 dark:ring-water-600/40 shadow-[0_0_20px_rgba(56,189,248,0.25)]";
  const linkInactive = "text-gray-600 dark:text-gray-400 hover:text-water-200 hover:shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:bg-gradient-to-r hover:from-water-500/10 hover:to-blue-500/10 dark:hover:from-slate-800/50 dark:hover:to-slate-800/20 hover:ring-1 hover:ring-inset hover:ring-water-400/30";

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
        console.log('Loading notifications...');
        const [count, status] = await Promise.all([
          notificationsService.getUnreadCount(),
          notificationsService.getAgenciesStatus()
        ]);
        console.log('Notifications loaded:', { count, status });
        if (mounted) {
          setUnread(count);
          setAgenciesStatus(status);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };
    load();
    const id = setInterval(load, 30000); // refresh toutes les 30s
    return () => { mounted = false; clearInterval(id); };
  }, []);

  // Fermer les dropdowns quand on clique à l'extérieur
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAgenciesStatus && !event.target.closest('.agencies-status-dropdown')) {
        setShowAgenciesStatus(false);
      }
      if (showDataMenu && !event.target.closest('.data-menu-dropdown')) {
        setShowDataMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAgenciesStatus, showDataMenu]);

  return (
    <>
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[radial-gradient(1200px_400px_at_0%_-20%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(1200px_400px_at_100%_-20%,rgba(59,130,246,0.15),transparent_60%)] dark:bg-[radial-gradient(1200px_400px_at_0%_-20%,rgba(56,189,248,0.08),transparent_60%),radial-gradient(1200px_400px_at_100%_-20%,rgba(59,130,246,0.08),transparent_60%)] border-b border-water-200/20 dark:border-slate-700/40 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.25)] overflow-visible">
      <div className="mx-auto max-w-7xl px-3 py-2 flex items-center justify-between overflow-visible">
        <div className="flex items-center gap-1.5">
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-water-200/40 dark:border-water-700/40 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md hover:bg-water-50/80 dark:hover:bg-slate-700/50 hover:scale-105 transition-all duration-200 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.25)]"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4 text-water-600 dark:text-water-300" /> : <Menu className="h-4 w-4 text-water-600 dark:text-water-300" />}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative group">
              <div className="h-7 w-7 rounded-lg bg-[conic-gradient(from_180deg_at_50%_50%,#22d3ee_0deg,#60a5fa_120deg,#22d3ee_240deg,#60a5fa_360deg)] p-[1px] shadow-[0_0_24px_rgba(56,189,248,0.35)]">
                <div className="h-full w-full rounded-[10px] bg-slate-50/80 dark:bg-slate-900/70 grid place-items-center">
                  <Sparkles className="h-3.5 w-3.5 text-water-600 dark:text-water-300" />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-water-400/0 group-hover:ring-water-400/30 transition duration-300"></div>
            </div>
            <div>
              <div className="text-sm font-extrabold tracking-wide bg-gradient-to-r from-water-500 to-blue-500 dark:from-water-300 dark:to-blue-400 bg-clip-text text-transparent">
                ADE BRH
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-water-500/90 dark:text-water-400/90 font-semibold hidden sm:block">Système</div>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1.5 px-1 py-1 rounded-[14px] bg-white/40 dark:bg-slate-900/30 backdrop-blur-md ring-1 ring-inset ring-water-400/20 dark:ring-water-600/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_0_20px_rgba(56,189,248,0.12)]">
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <LayoutDashboard className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" /> 
            <span className="hidden lg:inline">Dashboard</span>
          </NavLink>
          <NavLink to="/centres" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Building2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" /> 
            <span className="hidden lg:inline">Centres</span>
          </NavLink>
          <NavLink to="/agences" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Building2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" /> 
            <span className="hidden lg:inline">Agences</span>
          </NavLink>
          <NavLink to="/communes" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <MapPin className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" /> 
            <span className="hidden lg:inline">Communes</span>
          </NavLink>
          <NavLink to="/users" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Users className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" /> 
            <span className="hidden lg:inline">Utilisateurs</span>
          </NavLink>
          <NavLink to="/categories" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <FolderOpen className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" /> 
            <span className="hidden lg:inline">Catégories</span>
          </NavLink>
          <div className="relative group data-menu-dropdown">
            <button 
              onClick={() => setShowDataMenu(!showDataMenu)}
              className={`${linkBase} ${showDataMenu ? linkActive : linkInactive} cursor-pointer`}
            >
              <BarChart3 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" /> 
              <span className="hidden lg:inline">Saisie des Données</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showDataMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Sous-menu via portal (rendu externe) */}
          </div>
          <NavLink to="/objectives" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <Target className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" /> 
            <span className="hidden lg:inline">Objectifs</span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-1 overflow-visible">
          {/* Badge notifications avec statut des agences */}
          <div className="relative agencies-status-dropdown">
            <button 
              onClick={() => setShowAgenciesStatus(!showAgenciesStatus)}
              className={`relative inline-flex h-7 w-7 items-center justify-center rounded-md border backdrop-blur-sm hover:scale-105 transition-all duration-200 group ${
                agenciesStatus.summary.pending > 0
                  ? 'border-red-200/60 dark:border-red-700/60 bg-red-50/80 dark:bg-red-900/20'
                  : agenciesStatus.summary.completed > 0 && agenciesStatus.summary.pending === 0
                  ? 'border-green-200/60 dark:border-green-700/60 bg-green-50/80 dark:bg-green-900/20'
                  : 'border-water-200/40 dark:border-water-700/40 bg-white/60 dark:bg-slate-800/60'
              }`}
            >
              <Bell className={`h-3.5 w-3.5 transition-colors ${
                agenciesStatus.summary.pending > 0
                  ? 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300'
                  : agenciesStatus.summary.completed > 0 && agenciesStatus.summary.pending === 0
                  ? 'text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300'
                  : 'text-water-600 dark:text-water-300 group-hover:text-water-700 dark:group-hover:text-water-200'
              }`} />
              {agenciesStatus.summary.pending > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1 shadow-md animate-pulse">
                  {agenciesStatus.summary.pending}
                </span>
              )}
              {agenciesStatus.summary.completed > 0 && agenciesStatus.summary.pending === 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-1 shadow-md">
                  ✓
                </span>
              )}
            </button>
            
            {/* Dropdown du statut des agences */}
            {showAgenciesStatus && (
              <div className="fixed right-4 top-16 w-80 bg-white/95 dark:bg-slate-900/85 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-water-400/30 dark:ring-water-600/30 z-[9999] agencies-status-dropdown animate-in slide-in-from-top-2 duration-200 backdrop-blur-xl">
                <div className="p-3 border-b border-water-200/30 dark:border-slate-700/30">
                  <h3 className="text-sm font-semibold text-water-800 dark:text-water-200">
                    {agenciesStatus.summary.pending > 0 
                      ? `⚠️ ${agenciesStatus.summary.pending} agence(s) en retard` 
                      : '✅ Toutes les agences ont saisi leurs données'}
                  </h3>
                  <p className="text-xs text-water-600 dark:text-water-400 mt-1">
                    {agenciesStatus.summary.completed}/{agenciesStatus.summary.total} agences ont saisi leurs données du jour
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {agenciesStatus.agencies.map((agency) => (
                    <div key={agency.agenceId} className="flex items-center justify-between p-2 hover:bg-water-50/50 dark:hover:bg-slate-700/50">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          agency.hasDataToday 
                            ? 'bg-green-500 animate-pulse' 
                            : 'bg-red-500 animate-pulse'
                        }`}></div>
                        <div>
                          <div className="text-xs font-medium text-water-800 dark:text-water-200">
                            {agency.nomAgence}
                          </div>
                          <div className="text-xs text-water-600 dark:text-water-400">
                            {agency.nomCentre}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        agency.hasDataToday
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {agency.hasDataToday ? 'Complété' : 'En attente'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-2 border-t border-water-200/30 dark:border-slate-700/30">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {agenciesStatus.summary.completed} complétées
                    </span>
                    {agenciesStatus.summary.pending > 0 && (
                      <span className="text-red-600 dark:text-red-400 font-semibold">
                        ⚠ {agenciesStatus.summary.pending} en retard
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <ThemeToggle />

          {/* User info and logout */}
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl bg-white/40 dark:bg-slate-900/30 backdrop-blur-md ring-1 ring-inset ring-water-400/20 dark:ring-water-600/20 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]">
              <div className="h-7 w-7 rounded-lg bg-[conic-gradient(from_180deg_at_50%_50%,#22d3ee_0deg,#60a5fa_120deg,#22d3ee_240deg,#60a5fa_360deg)] p-[1px] text-white grid place-items-center font-bold text-xs shadow-[0_0_18px_rgba(56,189,248,0.35)]">
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
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 hover:scale-105 transition-all duration-200 ring-1 ring-inset ring-red-300/30"
                title="Déconnexion"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            ) : (
              <NavLink
                to="/login"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-green-600 dark:text-green-400 hover:bg-green-50/70 dark:hover:bg-green-900/20 hover:scale-105 transition-all duration-200 ring-1 ring-inset ring-emerald-300/30"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden sm:inline">Connexion</span>
              </NavLink>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-water-200/20 dark:border-slate-700/40 px-2 pb-2 bg-gradient-to-b from-white/90 to-blue-50/90 dark:from-slate-900/80 dark:to-slate-900/60 backdrop-blur-2xl">
          <div className="flex flex-col gap-1 pt-2">
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
            <NavLink onClick={() => setOpen(false)} to="/bilans-detailles" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <FileText className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Bilans Détaillés
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/detailed-data-by-agency" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Building2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Data par Agence
            </NavLink>
            <NavLink onClick={() => setOpen(false)} to="/objectives" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
              <Target className="h-3.5 w-3.5 group-hover:scale-110 transition-transform duration-200" /> Objectifs
            </NavLink>
          </div>
        </div>
      )}
    </header>
    {showDataMenu && createPortal(
      <div className="fixed right-4 top-16 w-64 bg-white/90 dark:bg-slate-900/80 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-water-400/30 dark:ring-water-600/30 z-[9999] backdrop-blur-xl data-menu-dropdown">
        <div className="py-2">
          <NavLink 
            to="/kpi" 
            className="flex items-center gap-3 px-4 py-3 text-sm text-water-800 dark:text-water-100 hover:bg-water-50/60 dark:hover:bg-slate-800/60 transition-colors duration-200 rounded-lg mx-2"
            onClick={() => setShowDataMenu(false)}
          >
            <BarChart3 className="h-4 w-4 text-water-500 drop-shadow-[0_0_8px_rgba(56,189,248,0.35)]" />
            <span>Saisie des Données</span>
          </NavLink>
          <NavLink 
            to="/bilans-detailles" 
            className="flex items-center gap-3 px-4 py-3 text-sm text-water-800 dark:text-water-100 hover:bg-water-50/60 dark:hover:bg-slate-800/60 transition-colors duration-200 rounded-lg mx-2"
            onClick={() => setShowDataMenu(false)}
          >
            <FileText className="h-4 w-4 text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.35)]" />
            <span>Bilans liste détaillés</span>
          </NavLink>
          <NavLink 
            to="/detailed-data-by-agency" 
            className="flex items-center gap-3 px-4 py-3 text-sm text-water-800 dark:text-water-100 hover:bg-water-50/60 dark:hover:bg-slate-800/60 transition-colors duration-200 rounded-lg mx-2"
            onClick={() => setShowDataMenu(false)}
          >
            <Building2 className="h-4 w-4 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]" />
            <span>Details Agence</span>
          </NavLink>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default NavBar;


