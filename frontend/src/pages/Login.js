import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [lockRemaining, setLockRemaining] = useState(0); // seconds
    const [attemptsRemaining, setAttemptsRemaining] = useState(null);
    const [isShaking, setIsShaking] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login(username, password);
            
            if (response.success) {
                console.log('Connexion réussie:', response.user);
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
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Entrez votre mot de passe"
                            required
                            disabled={loading || lockRemaining > 0}
                        />
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