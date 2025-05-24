import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useSnackbar } from 'notistack';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(process.env.REACT_APP_ALERT_SERVICE_URL || 'http://localhost:8083', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setConnected(true);
        
        // Subscribe to user-specific events
        newSocket.emit('subscribe', { userId: user.id });
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setConnected(false);
      });

      newSocket.on('notification', (data) => {
        enqueueSnackbar(data.message, { 
          variant: data.priority === 'high' ? 'error' : 'info',
          autoHideDuration: data.priority === 'high' ? null : 5000,
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user, enqueueSnackbar]);

  const subscribeToPatient = (patientId) => {
    if (socket && connected) {
      socket.emit('subscribe', { patientId });
    }
  };

  const value = {
    socket,
    connected,
    subscribeToPatient,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};