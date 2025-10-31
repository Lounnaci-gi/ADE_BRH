import React from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, Users, Building2, LogOut, Bell, Crown, Sparkles, FolderOpen, BarChart3, Target, MapPin, ChevronDown, FileText, Settings } from 'lucide-react';
import notificationsService from '../services/notificationsService';
import ThemeToggle from './ThemeToggle';
import authService from '../services/authService';

const NavBar = () => {
  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  const [agenciesStatus, setAgenciesStatus] = React.useState({ agencies: [], summary: { total: 0, completed: 0, pending: 0 } });
  const [showAgenciesStatus, setShowAgenciesStatus] = React.useState(false);
  const [showDataMenu, setShowDataMenu] = React.useState(false);
  const dataMenuButtonRef = React.useRef(null);
  const dataMenuRef = React.useRef(null);
  const [dataMenuPos, setDataMenuPos] = React.useState({ top: 0, left: 0, width: 0 });
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuButtonRef = React.useRef(null);
  const userMenuRef = React.useRef(null);
  const [userMenuPos, setUserMenuPos] = React.useState({ top: 0, left: 0, width: 0 });
  const [showGestionMenu, setShowGestionMenu] = React.useState(false);
  const gestionMenuButtonRef = React.useRef(null);
  const gestionMenuRef = React.useRef(null);
  const [gestionMenuPos, setGestionMenuPos] = React.useState({ top: 0, left: 0, width: 0 });
  const navigate = useNavigate();

  const linkBase = "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 relative group";
  const linkActive = "text-water-700 dark:text-water-200 bg-water-50/60 dark:bg-slate-800/60 border border-water-200/40 dark:border-slate-700/50";
  const linkInactive = "text-gray-600 dark:text-gray-400 hover:text-water-700 dark:hover:text-water-200 hover:bg-water-50/50 dark:hover:bg-slate-800/50";

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
      if (showUserMenu && !event.target.closest('.user-menu-dropdown')) {
        setShowUserMenu(false);
      }
      if (showGestionMenu && !event.target.closest('.gestion-menu-dropdown')) {
        setShowGestionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (showAgenciesStatus) setShowAgenciesStatus(false);
        if (showDataMenu) setShowDataMenu(false);
        if (showUserMenu) setShowUserMenu(false);
        if (showGestionMenu) setShowGestionMenu(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showAgenciesStatus, showDataMenu, showUserMenu, showGestionMenu]);

  // Calculer la position du sous-menu "Saisie des Données" pour l'afficher en dehors du navbar
  React.useEffect(() => {
    const updatePosition = () => {
      const buttonEl = dataMenuButtonRef.current;
      const menuEl = dataMenuRef.current;
      if (!buttonEl) return;
      const rect = buttonEl.getBoundingClientRect();
      const viewportPadding = 8;

      const desiredWidth = Math.max(256, Math.round(rect.width));
      const maxLeft = window.innerWidth - desiredWidth - viewportPadding;
      const left = Math.min(Math.max(Math.round(rect.left), viewportPadding), Math.max(maxLeft, viewportPadding));

      // par défaut en dessous du bouton
      let top = Math.round(rect.bottom + 8);
      if (menuEl) {
        const menuHeight = menuEl.offsetHeight || 0;
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < menuHeight + 16) {
          // ouvrir au-dessus si pas assez d'espace en bas
          top = Math.max(viewportPadding, Math.round(rect.top - menuHeight - 8));
        }
      }

      setDataMenuPos({ top, left, width: desiredWidth });
    };

    if (showDataMenu) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
    }

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [showDataMenu]);

  // Positionnement du menu utilisateur
  React.useEffect(() => {
    const updateUserMenuPosition = () => {
      const buttonEl = userMenuButtonRef.current;
      const menuEl = userMenuRef.current;
      if (!buttonEl) return;
      const rect = buttonEl.getBoundingClientRect();
      const viewportPadding = 8;

      const desiredWidth = Math.max(220, Math.round(rect.width));
      const maxLeft = window.innerWidth - desiredWidth - viewportPadding;
      const left = Math.min(Math.max(Math.round(rect.left), viewportPadding), Math.max(maxLeft, viewportPadding));

      let top = Math.round(rect.bottom + 8);
      if (menuEl) {
        const menuHeight = menuEl.offsetHeight || 0;
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < menuHeight + 16) {
          top = Math.max(viewportPadding, Math.round(rect.top - menuHeight - 8));
        }
      }

      setUserMenuPos({ top, left, width: desiredWidth });
    };

    if (showUserMenu) {
      updateUserMenuPosition();
      window.addEventListener('resize', updateUserMenuPosition);
      window.addEventListener('scroll', updateUserMenuPosition, true);
    }

    return () => {
      window.removeEventListener('resize', updateUserMenuPosition);
      window.removeEventListener('scroll', updateUserMenuPosition, true);
    };
  }, [showUserMenu]);

  // Positionnement du menu Gestion
  React.useEffect(() => {
    const updateGestionMenuPosition = () => {
      const buttonEl = gestionMenuButtonRef.current;
      const menuEl = gestionMenuRef.current;
      if (!buttonEl) return;
      const rect = buttonEl.getBoundingClientRect();
      const viewportPadding = 8;

      const desiredWidth = Math.max(220, Math.round(rect.width));
      const maxLeft = window.innerWidth - desiredWidth - viewportPadding;
      const left = Math.min(Math.max(Math.round(rect.left), viewportPadding), Math.max(maxLeft, viewportPadding));

      let top = Math.round(rect.bottom + 8);
      if (menuEl) {
        const menuHeight = menuEl.offsetHeight || 0;
        const spaceBelow = window.innerHeight - rect.bottom;
        if (spaceBelow < menuHeight + 16) {
          top = Math.max(viewportPadding, Math.round(rect.top - menuHeight - 8));
        }
      }

      setGestionMenuPos({ top, left, width: desiredWidth });
    };

    if (showGestionMenu) {
      updateGestionMenuPosition();
      window.addEventListener('resize', updateGestionMenuPosition);
      window.addEventListener('scroll', updateGestionMenuPosition, true);
    }

    return () => {
      window.removeEventListener('resize', updateGestionMenuPosition);
      window.removeEventListener('scroll', updateGestionMenuPosition, true);
    };
  }, [showGestionMenu]);

  return (
    <>
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 dark:bg-slate-900/70 border-b border-slate-200/60 dark:border-slate-800/60 overflow-visible">
      <div className="mx-auto max-w-7xl px-3 py-2 flex items-center justify-between overflow-visible">
        <div className="flex items-center gap-1.5">
          <button
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors duration-200"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4 text-water-600 dark:text-water-300" /> : <Menu className="h-4 w-4 text-water-600 dark:text-water-300" />}
          </button>
          <div className="flex items-center gap-1.5">
            <div className="relative group">
              <div className="h-7 w-7 rounded-md border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 grid place-items-center">
                <Sparkles className="h-3.5 w-3.5 text-water-600 dark:text-water-300" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold tracking-wide text-slate-800 dark:text-slate-100">
                ADE BRH
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500/90 dark:text-slate-400/90 font-semibold hidden sm:block">Système</div>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1.5">
          <NavLink to="/dashboard" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>
            <LayoutDashboard className="h-3.5 w-3.5" /> 
            <span className="hidden lg:inline">Dashboard</span>
          </NavLink>
          <div className="relative group">
            <button
              ref={gestionMenuButtonRef}
              onClick={() => setShowGestionMenu(!showGestionMenu)}
              className={`${linkBase} ${showGestionMenu ? linkActive : linkInactive} cursor-pointer`}
            >
              <Settings className="h-3.5 w-3.5" /> 
              <span className="hidden lg:inline">Gestion</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showGestionMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Sous-menu via portal (rendu externe) */}
          </div>
          <div className="relative group">
            <button
              ref={dataMenuButtonRef}
              onClick={() => setShowDataMenu(!showDataMenu)}
              className={`${linkBase} ${showDataMenu ? linkActive : linkInactive} cursor-pointer`}
            >
              <BarChart3 className="h-3.5 w-3.5" /> 
              <span className="hidden lg:inline">Saisie des Données</span>
              <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showDataMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Sous-menu via portal (rendu externe) */}
          </div>
        </nav>

        <div className="flex items-center gap-1 overflow-visible">
          {/* Badge notifications avec statut des agences */}
          <div className="relative agencies-status-dropdown">
            <button 
              onClick={() => setShowAgenciesStatus(!showAgenciesStatus)}
              className={`relative inline-flex h-7 w-7 items-center justify-center rounded-md border bg-white/60 dark:bg-slate-800/60 transition-colors duration-200 ${
                agenciesStatus.summary.pending > 0
                  ? 'border-red-200/60 dark:border-red-700/60 bg-red-50/80 dark:bg-red-900/20'
                  : agenciesStatus.summary.completed > 0 && agenciesStatus.summary.pending === 0
                  ? 'border-green-200/60 dark:border-green-700/60 bg-green-50/80 dark:bg-green-900/20'
                  : 'border-slate-200/70 dark:border-slate-700/60'
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
            <button
              ref={userMenuButtonRef}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-md border border-slate-200/70 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-700/50 transition-colors"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              <div className="h-7 w-7 rounded-md bg-slate-900/80 text-white grid place-items-center font-bold text-[10px]">
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
            </button>
            
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
      <div
        ref={dataMenuRef}
        className="fixed bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/70 dark:border-slate-700/60 z-[9999] data-menu-dropdown"
        style={{ top: `${dataMenuPos.top}px`, left: `${dataMenuPos.left}px`, minWidth: dataMenuPos.width }}
        role="menu"
        aria-label="Saisie des Données"
      >
        <div className="py-2">
          <NavLink 
            to="/kpi" 
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowDataMenu(false)}
          >
                    <BarChart3 className="h-4 w-4 text-slate-500" />
            <span>Saisie des Données</span>
          </NavLink>
          <NavLink 
            to="/bilans-detailles" 
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowDataMenu(false)}
          >
                    <FileText className="h-4 w-4 text-slate-500" />
            <span>Bilans liste détaillés</span>
          </NavLink>
          <NavLink 
            to="/detailed-data-by-agency" 
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowDataMenu(false)}
          >
                    <Building2 className="h-4 w-4 text-slate-500" />
            <span>Details Agence</span>
          </NavLink>
        </div>
      </div>,
      document.body
    )}
    {showUserMenu && createPortal(
      <div
        ref={userMenuRef}
        className="fixed bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/70 dark:border-slate-700/60 z-[9999] user-menu-dropdown"
        style={{ top: `${userMenuPos.top}px`, left: `${userMenuPos.left}px`, minWidth: userMenuPos.width }}
        role="menu"
        aria-label="Menu utilisateur"
      >
        <div className="py-2">
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowUserMenu(false)}
          >
            <Users className="h-4 w-4 text-slate-500" />
            <span>Mon profil</span>
          </NavLink>
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowUserMenu(false)}
          >
            <LogOut className="h-4 w-4 rotate-180 text-slate-500" />
            <span>Changer le mot de passe</span>
          </NavLink>
        </div>
      </div>,
      document.body
    )}
    {showGestionMenu && createPortal(
      <div
        ref={gestionMenuRef}
        className="fixed bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200/70 dark:border-slate-700/60 z-[9999] gestion-menu-dropdown"
        style={{ top: `${gestionMenuPos.top}px`, left: `${gestionMenuPos.left}px`, minWidth: gestionMenuPos.width }}
        role="menu"
        aria-label="Menu Gestion"
      >
        <div className="py-2">
          <NavLink
            to="/centres"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowGestionMenu(false)}
          >
            <Building2 className="h-4 w-4 text-slate-500" />
            <span>Centres</span>
          </NavLink>
          <NavLink
            to="/agences"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowGestionMenu(false)}
          >
            <Building2 className="h-4 w-4 text-slate-500" />
            <span>Agences</span>
          </NavLink>
          <NavLink
            to="/communes"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowGestionMenu(false)}
          >
            <MapPin className="h-4 w-4 text-slate-500" />
            <span>Communes</span>
          </NavLink>
          <NavLink
            to="/users"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowGestionMenu(false)}
          >
            <Users className="h-4 w-4 text-slate-500" />
            <span>Utilisateurs</span>
          </NavLink>
          <NavLink
            to="/categories"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowGestionMenu(false)}
          >
            <FolderOpen className="h-4 w-4 text-slate-500" />
            <span>Catégories</span>
          </NavLink>
          <NavLink
            to="/objectives"
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors duration-150 rounded-lg mx-2"
            onClick={() => setShowGestionMenu(false)}
          >
            <Target className="h-4 w-4 text-slate-500" />
            <span>Objectifs</span>
          </NavLink>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default NavBar;


