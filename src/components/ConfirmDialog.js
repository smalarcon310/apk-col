import React from 'react';
import { Button } from './FormInputs';
import Modal from './Modal';

const ConfirmDialog = ({ isOpen = false, title = 'Confirmar', message = '', onConfirm, onCancel, confirmLabel = 'Sí', cancelLabel = 'Cancelar' }) => {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={(
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-2 border rounded bg-white">{cancelLabel}</button>
          <button onClick={onConfirm} className="px-3 py-2 bg-red-600 text-white rounded">{confirmLabel}</button>
        </div>
      )}
    >
      <div className="py-2 text-sm text-gray-700">{message}</div>
    </Modal>
  );
};

export default ConfirmDialog;
