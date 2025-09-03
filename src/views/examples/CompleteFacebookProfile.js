// src/views/examples/CompleteFacebookProfile.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // 1. IMPORTER API
import { jwtDecode } from 'jwt-decode'; // Utile pour récupérer le nouveau rôle

const CompleteFacebookProfile = () => {
  const navigate = useNavigate();
  // On ne peut plus se fier à l'ancien 'authUser'
  const [formData, setFormData] = useState({
    commune_choisie: 'Choisir une commune',
    date_naissance: '',
    contact: ''
  });
  const [error, setError] = useState('');
  const accessToken = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!accessToken) {
      navigate('/auth/login');
    }
  }, [accessToken, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 2. CORRIGER handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.date_naissance || !formData.commune_choisie || formData.commune_choisie === 'Choisir une commune') {
      setError('Commune et date de naissance sont obligatoires.');
      return;
    }

    try {
      const res = await api.patch('/auth/utilisateur/complete-profile', formData);
      const data = res.data;

      // Mettre à jour les nouvelles clés dans le localStorage
      localStorage.setItem('accessToken', data.token); // Le backend renvoie un nouveau token
      
      // Décoder le nouveau token pour obtenir le rôle mis à jour
      const decodedToken = jwtDecode(data.token);
      localStorage.setItem('userRole', decodedToken.role);

      navigate('/user/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  };

  return (
    <div className="container mt-5">
      {/* Le JSX reste identique */}
      <h4>Compléter votre profil</h4>
      <p>Certaines informations manquent pour finaliser votre compte.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Commune</label>
          <select name="commune_choisie" className="form-control" value={formData.commune_choisie} onChange={handleChange} required>
            <option value="Choisir une commune" disabled>Choisir une commune</option>
            <option value="plateau">Plateau</option><option value="yopougon">Yopougon</option>
            <option value="cocody">Cocody</option><option value="abobo">Abobo</option>
            <option value="koumassi">Koumassi</option><option value="marcory">Marcory</option>
            <option value="portbouet">Port-Bouët</option>
          </select>
        </div>
        <div className="form-group"><label>Date de naissance</label><input type="date" name="date_naissance" className="form-control" value={formData.date_naissance} onChange={handleChange} required /></div>
        <div className="form-group"><label>Contact (optionnel)</label><input type="tel" name="contact" className="form-control" value={formData.contact} onChange={handleChange} /></div>
        {error && <div className="text-danger my-2">{error}</div>}
        <button className="btn btn-primary mt-3" type="submit">Mettre à jour mon profil</button>
      </form>
    </div>
  );
};
export default CompleteFacebookProfile;