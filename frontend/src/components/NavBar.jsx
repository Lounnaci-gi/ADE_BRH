import React from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, Users, Building2, LogOut, LogIn, Bell, Crown,
  Sparkles, FolderOpen, BarChart3, Target, MapPin, ChevronDown, FileText,
  Settings, TrendingUp, KeyRound, Droplets
} from 'lucide-react';
import notificationsService from '../services/notificationsService';
import ThemeToggle from './ThemeToggle';
import authService from '../services/authService';

const GESTION_ITEMS = [
  { to: '/centres', icon: Building2, label: 'Centres' },
  { to: '/agences', icon: Building2, label: 'Agences' },
  { to: '/communes', icon: MapPin, label: 'Communes' },
  { to: '/users', icon: Users, label: 'Utilisateurs' },
  { to: '/categories', icon: FolderOpen, label: 'Catégories' },
  { to: '/objectives', icon: Target, label: 'Objectifs' },
];

const DATA_ITEMS = [
  { to: '/kpi', icon: BarChart3, label: 'Saisie des Données' },
  { to: '/bilans-detailles', icon: FileText, label: 'Bilans détaillés' },
  { to: '/detailed-data-by-agency', icon: Building2, label: 'Détails par agence' },
];

const MAIN_LINKS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/statistiques', icon: TrendingUp, label: 'Statistiques' },
];

function useDropdownPosition(isOpen, buttonRef, menuRef, minWidth = 220) {
  const [pos, setPos] = React.useState({ top: 0, left: 0, width: minWidth });

  React.useEffect(() => {
    const update = () => {
      const buttonEl = buttonRef.current;
      const menuEl = menuRef.current;
      if (!buttonEl) return;

      const rect = buttonEl.getBoundingClientRect();
      const padding = 8;
      const width = Math.max(minWidth, Math.round(rect.width));
      const maxLeft = window.innerWidth - width - padding;
      const left = Math.min(Math.max(Math.round(rect.left), padding), Math.max(maxLeft, padding));

      let top = Math.round(rect.bottom + 10);
      if (menuEl) {
        const menuHeight = menuEl.offsetHeight || 0;
        if (window.innerHeight - rect.bottom < menuHeight + 16) {
          top = Math.max(padding, Math.round(rect.top - menuHeight - 10));
        }
      }
      setPos({ top, left, width });
    };

    if (isOpen) {
      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, buttonRef, menuRef, minWidth]);

  return pos;
}

function DropdownPanel({ title, subtitle, children, pos, panelRef, className = '' }) {
  return createPortal(
    <div
      ref={panelRef}
      className={`fixed z-[9999] overflow-hidden rounded-2xl border border-water-200/60 bg-white/95 shadow-[0_20px_50px_-12px_rgba(2,132,199,0.25)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/95 dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] ${className}`}
      style={{ top: `${pos.top}px`, left: `${pos.left}px`, minWidth: pos.width }}
      role="menu"
    >
      {(title || subtitle) && (
        <div className="border-b border-water-100/80 px-4 py-3 dark:border-slate-700/60">
          {title && <p className="text-xs font-semibold uppercase tracking-wider text-water-600 dark:text-water-400">{title}</p>}
          {subtitle && <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{subtitle}</p>}
        </div>
      )}
      <div className="p-1.5">{children}</div>
    </div>,
    document.body
  );
}

function DropdownNavLink({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
          isActive
            ? 'bg-gradient-to-r from-water-500/10 to-water-400/5 text-water-800 ring-1 ring-water-200/60 dark:from-water-500/20 dark:to-water-600/10 dark:text-water-100 dark:ring-water-700/50'
            : 'text-slate-700 hover:bg-water-50/80 dark:text-slate-200 dark:hover:bg-slate-800/80'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
            isActive
              ? 'bg-water-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-500 group-hover:bg-water-100 group-hover:text-water-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-water-900/40 dark:group-hover:text-water-300'
          }`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}

const NavBar = () => {
  const [open, setOpen] = React.useState(false);
  const [agenciesStatus, setAgenciesStatus] = React.useState({ agencies: [], summary: { total: 0, completed: 0, pending: 0 } });
  const [showAgenciesStatus, setShowAgenciesStatus] = React.useState(false);
  const [showDataMenu, setShowDataMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showGestionMenu, setShowGestionMenu] = React.useState(false);

  const dataMenuButtonRef = React.useRef(null);
  const dataMenuRef = React.useRef(null);
  const userMenuButtonRef = React.useRef(null);
  const userMenuRef = React.useRef(null);
  const gestionMenuButtonRef = React.useRef(null);
  const gestionMenuRef = React.useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const dataMenuPos = useDropdownPosition(showDataMenu, dataMenuButtonRef, dataMenuRef, 280);
  const userMenuPos = useDropdownPosition(showUserMenu, userMenuButtonRef, userMenuRef, 240);
  const gestionMenuPos = useDropdownPosition(showGestionMenu, gestionMenuButtonRef, gestionMenuRef, 260);

  const user = authService.getCurrentUser();
  const initials = React.useMemo(() => {
    if (!user?.username) return 'U';
    const parts = String(user.username).split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
  }, [user]);

  const isGestionActive = GESTION_ITEMS.some((item) => location.pathname.startsWith(item.to));
  const isDataActive = DATA_ITEMS.some((item) => location.pathname.startsWith(item.to));

  const closeAllMenus = () => {
    setShowAgenciesStatus(false);
    setShowDataMenu(false);
    setShowUserMenu(false);
    setShowGestionMenu(false);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white text-water-700 shadow-sm ring-1 ring-water-200/70 dark:bg-slate-800 dark:text-water-100 dark:ring-water-700/50'
        : 'text-slate-600 hover:bg-white/60 hover:text-water-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-water-200'
    }`;

  const dropdownTriggerClass = (isActive) =>
    `flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white text-water-700 shadow-sm ring-1 ring-water-200/70 dark:bg-slate-800 dark:text-water-100 dark:ring-water-700/50'
        : 'text-slate-600 hover:bg-white/60 hover:text-water-700 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-water-200'
    }`;

  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [_, status] = await Promise.all([
          notificationsService.getUnreadCount(),
          notificationsService.getAgenciesStatus(),
        ]);
        if (mounted) setAgenciesStatus(status);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAgenciesStatus && !event.target.closest('.agencies-status-dropdown')) setShowAgenciesStatus(false);
      if (showDataMenu && !event.target.closest('.data-menu-dropdown')) setShowDataMenu(false);
      if (showUserMenu && !event.target.closest('.user-menu-dropdown')) setShowUserMenu(false);
      if (showGestionMenu && !event.target.closest('.gestion-menu-dropdown')) setShowGestionMenu(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') closeAllMenus();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showAgenciesStatus, showDataMenu, showUserMenu, showGestionMenu]);

  React.useEffect(() => {
    setOpen(false);
    closeAllMenus();
  }, [location.pathname]);

  const { pending, completed, total } = agenciesStatus.summary;
  const bellVariant = pending > 0 ? 'alert' : completed > 0 && pending === 0 ? 'success' : 'neutral';

  return (
    <>
      <header className="sticky top-0 z-50 overflow-visible border-b border-water-200/50 bg-white/80 shadow-[0_1px_0_rgba(2,132,199,0.06)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
          {/* Brand */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-water-200/70 bg-white/80 text-water-700 shadow-sm transition-all hover:border-water-300 hover:bg-water-50 md:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-water-300 dark:hover:bg-slate-800"
              onClick={() => setOpen(!open)}
              aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={open}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <NavLink to="/dashboard" className="group flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-water-500 to-water-700 text-white shadow-md shadow-water-500/25 ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
                <Droplets className="h-5 w-5" />
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">ADE BRH</div>
                <div className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-water-600/80 dark:text-water-400/80">
                  Système KPI
                </div>
              </div>
            </NavLink>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 rounded-2xl border border-water-100/80 bg-water-50/50 p-1 dark:border-slate-800 dark:bg-slate-900/50 md:flex">
            {MAIN_LINKS.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}

            <div className="gestion-menu-dropdown relative">
              <button
                ref={gestionMenuButtonRef}
                type="button"
                onClick={() => { setShowGestionMenu(!showGestionMenu); setShowDataMenu(false); }}
                className={dropdownTriggerClass(showGestionMenu || isGestionActive)}
                aria-expanded={showGestionMenu}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">Gestion</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showGestionMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="data-menu-dropdown relative">
              <button
                ref={dataMenuButtonRef}
                type="button"
                onClick={() => { setShowDataMenu(!showDataMenu); setShowGestionMenu(false); }}
                className={dropdownTriggerClass(showDataMenu || isDataActive)}
                aria-expanded={showDataMenu}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span className="hidden lg:inline">Données</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showDataMenu ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="agencies-status-dropdown relative">
              <button
                type="button"
                onClick={() => setShowAgenciesStatus(!showAgenciesStatus)}
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200 ${
                  bellVariant === 'alert'
                    ? 'border-red-200/70 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800/60 dark:bg-red-950/40 dark:text-red-400'
                    : bellVariant === 'success'
                    ? 'border-emerald-200/70 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'border-water-200/70 bg-white/80 text-water-600 hover:bg-water-50 dark:border-slate-700 dark:bg-slate-900 dark:text-water-300 dark:hover:bg-slate-800'
                }`}
                aria-label="Statut des agences"
              >
                <Bell className="h-4 w-4" />
                {pending > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                    {pending}
                  </span>
                )}
              </button>

              {showAgenciesStatus && (
                <div className="agencies-status-dropdown fixed right-4 top-[4.5rem] z-[9999] w-80 overflow-hidden rounded-2xl border border-water-200/60 bg-white/95 shadow-[0_20px_50px_-12px_rgba(2,132,199,0.25)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/95">
                  <div className={`border-b px-4 py-3 ${
                    pending > 0
                      ? 'border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/20'
                      : 'border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20'
                  }`}>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {pending > 0 ? `${pending} agence(s) en retard` : 'Saisies du jour complètes'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {completed}/{total} agences ont saisi leurs données
                    </p>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {agenciesStatus.agencies.map((agency) => (
                      <div
                        key={agency.agenceId}
                        className="flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-water-50/60 dark:hover:bg-slate-800/60"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${agency.hasDataToday ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{agency.nomAgence}</div>
                            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{agency.nomCentre}</div>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          agency.hasDataToday
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {agency.hasDataToday ? 'OK' : 'Attente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <ThemeToggle />

            <div className="user-menu-dropdown flex items-center gap-2 pl-1">
              <button
                ref={userMenuButtonRef}
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl border border-water-200/70 bg-white/80 py-1 pl-1 pr-2.5 transition-all hover:border-water-300 hover:bg-water-50/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-[11px] font-bold text-white shadow-sm">
                  {initials}
                </div>
                <div className="hidden text-left lg:block">
                  <div className="max-w-[120px] truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                    {user?.username || 'Invité'}
                  </div>
                  {user?.role && (
                    <div className="flex items-center gap-1 text-[10px] text-water-600 dark:text-water-400">
                      {user.role === 'Administrateur' && <Crown className="h-2.5 w-2.5" />}
                      {user.role}
                    </div>
                  )}
                </div>
                <ChevronDown className={`hidden h-3.5 w-3.5 text-slate-400 lg:block transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="hidden items-center gap-1.5 rounded-xl border border-red-200/60 bg-red-50/50 px-3 py-2 text-xs font-medium text-red-600 transition-all hover:bg-red-100 sm:inline-flex dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                  title="Déconnexion"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Déconnexion</span>
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="hidden items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-xs font-medium text-slate-600 transition-all hover:bg-slate-50 sm:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span className="hidden xl:inline">Connexion</span>
                </NavLink>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="border-t border-water-100/80 bg-white/95 px-3 pb-4 pt-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 md:hidden">
            <div className="space-y-4">
              <section>
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-water-600/70 dark:text-water-400/70">Navigation</p>
                <div className="space-y-1">
                  {MAIN_LINKS.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} onClick={() => setOpen(false)} className={navLinkClass}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </section>

              <section>
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-water-600/70 dark:text-water-400/70">Gestion</p>
                <div className="space-y-1">
                  {GESTION_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} onClick={() => setOpen(false)} className={navLinkClass}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </section>

              <section>
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-water-600/70 dark:text-water-400/70">Données</p>
                <div className="space-y-1">
                  {DATA_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink key={to} to={to} onClick={() => setOpen(false)} className={navLinkClass}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  ))}
                </div>
              </section>

              {user && (
                <section className="border-t border-water-100/80 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => { setOpen(false); handleLogout(); }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/60 bg-red-50/60 px-4 py-2.5 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </section>
              )}
            </div>
          </div>
        )}
      </header>

      {showGestionMenu && (
        <DropdownPanel
          title="Administration"
          subtitle="Gestion du référentiel"
          pos={gestionMenuPos}
          panelRef={gestionMenuRef}
          className="gestion-menu-dropdown"
        >
          {GESTION_ITEMS.map((item) => (
            <DropdownNavLink key={item.to} {...item} onNavigate={() => setShowGestionMenu(false)} />
          ))}
        </DropdownPanel>
      )}

      {showDataMenu && (
        <DropdownPanel
          title="Saisie & rapports"
          subtitle="Données opérationnelles"
          pos={dataMenuPos}
          panelRef={dataMenuRef}
          className="data-menu-dropdown"
        >
          {DATA_ITEMS.map((item) => (
            <DropdownNavLink key={item.to} {...item} onNavigate={() => setShowDataMenu(false)} />
          ))}
        </DropdownPanel>
      )}

      {showUserMenu && (
        <DropdownPanel pos={userMenuPos} panelRef={userMenuRef} className="user-menu-dropdown">
          <DropdownNavLink to="/profile" icon={Users} label="Mon profil" onNavigate={() => setShowUserMenu(false)} />
          <DropdownNavLink to="/settings" icon={KeyRound} label="Changer le mot de passe" onNavigate={() => setShowUserMenu(false)} />
          <button
            type="button"
            onClick={() => { setShowUserMenu(false); handleLogout(); }}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <LogOut className="h-4 w-4" />
            </span>
            Déconnexion
          </button>
        </DropdownPanel>
      )}
    </>
  );
};

export default NavBar;
