/**
 * SERMA - Alert Component
 * Componente reutilizable para mostrar alertas y notificaciones
 */

import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

/**
 * Alert - Componente de alerta
 * @param {Object} props - Propiedades
 * @param {string} props.type - Tipo: 'success', 'error', 'warning', 'info'
 * @param {string} props.title - Título de la alerta
 * @param {string} props.message - Mensaje de la alerta
 * @param {Function} props.onClose - Callback para cerrar
 * @param {number} props.duration - Duración antes de cerrar automáticamente (ms)
 */
export const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-600" />,
    error: <AlertCircle className="w-5 h-5 text-red-600" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    info: <Info className="w-5 h-5 text-blue-600" />,
  };

  return (
    <div className={`border-l-4 p-4 rounded ${styles[type]}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="font-medium">
              {title}
            </h3>
          )}
          {message && (
            <div className="mt-1 text-sm">
              {message}
            </div>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 inline-flex flex-shrink-0 hover:opacity-75 transition-opacity"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
