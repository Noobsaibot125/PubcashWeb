// src/contexts/WebSocketContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  // Renvoie la valeur (peut être null) — ne throw plus ici.
  return useContext(WebSocketContext);
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        // auth: { token: localStorage.getItem('accessToken') } // si besoin
      });

      newSocket.on('connect', () => {
        console.log('Connecté au serveur WebSocket', newSocket.id);
        if (user.role === 'utilisateur') {
          newSocket.emit('user_online', user.id);
        }
      });

      newSocket.on('connect_error', (err) => {
        console.error('WebSocket connect_error:', err);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } else {
      // Si l'utilisateur se déconnecte, s'assurer de fermer la socket existante
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
};
