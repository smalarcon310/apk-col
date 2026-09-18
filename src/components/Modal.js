/**
 * SERMA - Modal Component
 * Componente reutilizable para modales y diálogos
 */

import React from 'react';
import { X } from 'lucide-react';

/**
 * Modal - Componente de modal
 * @param {Object} props - Propiedades
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {string} props.title - Título del modal
 * @param {Function} props.onClose - Callback para cerrar
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {React.ReactNode} props.footer - Contenido del pie
 * @param {string} props.size - Tamaño: 'sm', 'md', 'lg', 'xl'
 */
export const Modal = ({ 
  isOpen = false, 
  title, 
  onClose, 
  children, 
  footer,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl ${sizes[size]} w-full max-h-screen overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Cerrar"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-neutral-200 bg-neutral-50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
