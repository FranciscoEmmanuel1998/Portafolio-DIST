import React, { useState, useCallback } from 'react';

// Estado global para los toasts
let toastCounter = 0;
const toastListeners = new Set();

// Hook para manejar toasts
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  // Registrar listener para actualizaciones
  React.useEffect(() => {
    const updateToasts = (newToasts) => {
      setToasts(newToasts);
    };
    toastListeners.add(updateToasts);
    
    return () => {
      toastListeners.delete(updateToasts);
    };
  }, []);

  const toast = useCallback(({ title, description, variant = 'default' }) => {
    const id = `toast-${++toastCounter}`;
    const newToast = {
      id,
      title,
      description,
      variant,
      createdAt: Date.now()
    };

    // Actualizar todos los listeners
    toastListeners.forEach(listener => {
      listener(prev => [...prev, newToast]);
    });

    // Remover toast después de 3 segundos
    setTimeout(() => {
      toastListeners.forEach(listener => {
        listener(prev => prev.filter(t => t.id !== id));
      });
    }, 3000);

    return id;
  }, []);

  return { toast, toasts };
};

// Función toast independiente para usar sin hook
const toast = ({ title, description, variant = 'default' }) => {
  const id = `toast-${++toastCounter}`;
  const newToast = {
    id,
    title,
    description,
    variant,
    createdAt: Date.now()
  };

  // Actualizar todos los listeners
  toastListeners.forEach(listener => {
    listener(prev => [...prev, newToast]);
  });

  // Remover toast después de 3 segundos
  setTimeout(() => {
    toastListeners.forEach(listener => {
      listener(prev => prev.filter(t => t.id !== id));
    });
  }, 3000);

  return id;
};

export { useToast, toast };
