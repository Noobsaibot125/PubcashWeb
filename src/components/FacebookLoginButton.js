import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

const loadFacebookSdk = (appId, apiVersion) => {
  return new Promise((resolve, reject) => {
    if (window.FB && window.FB.__initialized) {
      return resolve(window.FB);
    }

    window.fbAsyncInit = function () {
      try {
        window.FB.init({
          appId: appId,
          cookie: true,
          xfbml: false,
          version: apiVersion
        });
        window.FB.__initialized = true;
        console.log('FB SDK initialisé', apiVersion);
        resolve(window.FB);
      } catch (e) {
        console.error('Erreur init FB', e);
        reject(e);
      }
    };

    if (!document.getElementById('facebook-jssdk')) {
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      // Utiliser locale FR si tu veux : fr_FR
      js.src = 'https://connect.facebook.net/fr_FR/sdk.js';
      js.async = true;
      js.defer = true;
      js.onerror = () => reject(new Error('Impossible de charger le SDK Facebook'));
      document.body.appendChild(js);
    }
  });
};

const FacebookLoginButton = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const fbAppId = process.env.REACT_APP_FB_APP_ID;
  const fbApiVersion = process.env.REACT_APP_FB_API_VERSION || 'v12.0';

  useEffect(() => {
    if (!fbAppId) {
      console.warn('REACT_APP_FB_APP_ID non défini !');
      return;
    }
    // avertir si page en HTTP — FB bloquera FB.login depuis HTTP
    if (window.location.protocol === 'http:') {
      console.warn('Page en HTTP — FB.login peut être bloqué. Lance le dev server en HTTPS (voir instructions).');
    }
    loadFacebookSdk(fbAppId, fbApiVersion).catch(err => {
      console.error('Impossible d\'initialiser FB SDK:', err);
    });
  }, [fbAppId, fbApiVersion]);

  const handleFacebookLogin = async () => {
    if (!fbAppId) {
      alert('L\'identifiant de l\'application Facebook est manquant.');
      return;
    }
    setLoading(true);

    try {
      await loadFacebookSdk(fbAppId, fbApiVersion);

      // PASSER une fonction NON-async au SDK, puis appeler une IIFE async à l'intérieur
      window.FB.login((response) => {
        (async () => {
          try {
            if (response.status === 'connected') {
              const fbAccessToken = response.authResponse.accessToken;
              const res = await api.post('/auth/facebook', { accessToken: fbAccessToken });
              const data = res.data;

              localStorage.setItem('accessToken', data.accessToken);
              localStorage.setItem('refreshToken', data.refreshToken);

              const decodedToken = jwtDecode(data.accessToken);
              localStorage.setItem('userRole', decodedToken.role);

              if (data.profileCompleted) {
                navigate("/user/dashboard", { replace: true });
              } else {
                navigate('/auth/complete-profile', { replace: true });
              }
            } else {
              console.warn('Connexion Facebook annulée ou échouée.');
            }
          } catch (err) {
            console.error('Erreur login FB -> backend:', err);
            const errorMessage = err.response?.data?.message || 'Erreur lors de la connexion avec le serveur.';
            alert(errorMessage);
          } finally {
            setLoading(false);
          }
        })();
      }, { scope: 'public_profile' });

    } catch (err) {
      console.error('Erreur dans handleFacebookLogin:', err);
      alert('Impossible d\'initialiser la connexion Facebook. Vérifie la console.');
      setLoading(false);
    }
  };

  return (
    <button className="btn btn-primary btn-facebook" onClick={handleFacebookLogin} disabled={loading}>
      {loading ? 'Connexion...' : 'Se connecter avec Facebook'}
    </button>
  );
};

export default FacebookLoginButton;
