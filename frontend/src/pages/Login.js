import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import authService from '../services/authService';
import kpiService from '../services/kpiService';
import { swal } from '../utils/swal';
import { convertDateToYYYYMMDD } from '../utils/dateUtils';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [lockRemaining, setLockRemaining] = useState(0); // seconds
    const [attemptsRemaining, setAttemptsRemaining] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Fonction pour vérifier les jours manquants (7 derniers jours)
    const checkMissingDataDays = async (userAgenceId) => {
        try {
            const today = new Date();
            const missingDays = [];
            
            // Parcourir les 7 derniers jours (aujourd'hui inclus)
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date(today);
                checkDate.setDate(today.getDate() - i);
                checkDate.setHours(0, 0, 0, 0);
                
                const yyyy = checkDate.getFullYear();
                const mm = String(checkDate.getMonth() + 1).padStart(2, '0');
                const dd = String(checkDate.getDate()).padStart(2, '0');
                const dateKey = convertDateToYYYYMMDD(`${yyyy}-${mm}-${dd}`);
                
                // Vérifier si les données existent pour ce jour
                const existingData = await kpiService.getExistingData(dateKey, userAgenceId);
                
                // Si aucune donnée n'existe, ajouter à la liste
                if (!existingData || existingData.length === 0) {
                    missingDays.push({
                        date: checkDate,
                        dateKey: dateKey,
                        dateFormatted: `${dd}/${mm}/${yyyy}`
                    });
                }
            }
            
            return missingDays;
        } catch (error) {
            console.error('Erreur lors de la vérification des jours manquants:', error);
            return [];
        }
    };

    // Fonction pour afficher l'alerte avec la liste des jours manquants
    const showMissingDataAlert = async (user) => {
        const userAgenceId = user?.agenceId ? Number(user.agenceId) : null;
        
        if (!userAgenceId) {
            return;
        }
        
        // Charger les agences pour obtenir le nom
        let agenceName = 'votre agence';
        try {
            const agences = await kpiService.getAgences();
            const agence = agences.find(a => Number(a.AgenceId) === userAgenceId);
            if (agence) {
                agenceName = agence.Nom_Agence;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des agences:', error);
        }
        
        // Vérifier les jours manquants
        const missingDays = await checkMissingDataDays(userAgenceId);
        
        if (missingDays.length > 0) {
            // Créer le HTML de la liste
            const missingDaysList = missingDays
                .map(day => `<li style="text-align: left; padding: 4px 0;">• ${day.dateFormatted}</li>`)
                .join('');
            
            swal.fire({
                icon: 'warning',
                title: 'Jours sans données saisies',
                html: `
                    <p style="text-align: left; margin-bottom: 10px;">
                        Vous n'avez pas saisi de données pour <strong>${agenceName}</strong> aux dates suivantes (7 derniers jours) :
                    </p>
                    <ul style="text-align: left; list-style: none; padding: 0; margin: 10px 0;">
                        ${missingDaysList}
                    </ul>
                    <p style="text-align: left; margin-top: 10px; font-size: 0.9em; color: #666;">
                        ⚠️ Note: Vous pouvez uniquement modifier les données des 7 derniers jours.
                    </p>
                `,
                confirmButtonText: 'Aller à la saisie',
                showCancelButton: true,
                cancelButtonText: 'Fermer',
                allowOutsideClick: true,
                allowEscapeKey: true
            }).then((result) => {
                if (result.isConfirmed) {
                    // Rediriger vers la page KPI après fermeture de l'alerte
                    navigate('/kpi');
                }
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login(username, password);
            
            if (response.success) {
                const user = response.user;
                
                // Si l'utilisateur est standard, vérifier les jours manquants
                const isStandard = (user?.role || '').toString() === 'Standard';
                
                if (isStandard) {
                    // Attendre un peu que l'authentification soit bien établie
                    setTimeout(async () => {
                        await showMissingDataAlert(user);
                    }, 500);
                }
                
                // Rediriger vers le dashboard
                navigate('/dashboard');
            } else {
                setError(response.error || 'Erreur de connexion');
                if (typeof response.remainingAttempts === 'number') {
                    setAttemptsRemaining(response.remainingAttempts);
                }
                setIsShaking(true);
                setTimeout(() => setIsShaking(false), 500);
            }
        } catch (err) {
            if (err && typeof err.retryAfterSec === 'number') {
                setLockRemaining(Math.max(0, Math.floor(err.retryAfterSec)));
                setError('Trop de tentatives. Réessayez dans quelques instants.');
            } else {
                setError(err.error || 'Erreur de connexion au serveur');
                if (typeof err.remainingAttempts === 'number') {
                    setAttemptsRemaining(err.remainingAttempts);
                }
            }
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        } finally {
            setLoading(false);
        }
    };

    // countdown for lockRemaining
    useEffect(() => {
        if (!lockRemaining) return;
        const id = setInterval(() => {
            setLockRemaining((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
        return () => clearInterval(id);
    }, [lockRemaining]);

    const formatSeconds = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    };

    return (
        <div className="login-container">
            <div className={`login-card ${isShaking ? 'shake' : ''}`}>
                <div className="login-header">
                    <h1>ADE BRH</h1>
                    <p>Système de gestion commercial - Unité Médéa</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {lockRemaining > 0 ? (
                                <span>Compte temporairement bloqué. Réessayez dans {formatSeconds(lockRemaining)}.</span>
                            ) : (
                                <>
                                    <span>{error}</span>
                                    {typeof attemptsRemaining === 'number' && attemptsRemaining >= 0 && (
                                        <span style={{ display: 'block', marginTop: 4 }}>
                                            Tentatives restantes: {attemptsRemaining}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="username">Nom d'utilisateur</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Entrez votre nom d'utilisateur"
                            required
                            disabled={loading || lockRemaining > 0}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Mot de passe</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Entrez votre mot de passe"
                                required
                                disabled={loading || lockRemaining > 0}
                                className="w-full pr-10"
                            />
                            <button
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                onMouseDown={() => setShowPassword(true)}
                                onMouseUp={() => setShowPassword(false)}
                                onMouseLeave={() => setShowPassword(false)}
                                disabled={loading || lockRemaining > 0}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading || lockRemaining > 0}
                    >
                        {lockRemaining > 0 ? `Réessayez dans ${formatSeconds(lockRemaining)}` : (loading ? 'Connexion...' : 'Se connecter')}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2025 ADE - Tous droits réservés</p>
                </div>
            </div>
        </div>
    );
};

export default Login;