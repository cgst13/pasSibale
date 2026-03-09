import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faInfoCircle, faTrash } from '@fortawesome/free-solid-svg-icons';

interface ConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  icon?: 'warning' | 'info' | 'trash';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  onHide,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  icon
}) => {
  
  const getIcon = () => {
    switch (icon) {
      case 'warning':
        return <FontAwesomeIcon icon={faExclamationTriangle} className={`text-${variant} mb-3`} size="2x" />;
      case 'trash':
        return <FontAwesomeIcon icon={faTrash} className={`text-${variant} mb-3`} size="2x" />;
      case 'info':
      default:
        return <FontAwesomeIcon icon={faInfoCircle} className={`text-${variant} mb-3`} size="2x" />;
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className={`text-${variant} px-3 pt-3`}>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 py-4 text-center">
        {icon && getIcon()}
        <div className="text-start">
          {typeof message === 'string' ? <p className="mb-0">{message}</p> : message}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 px-4 pb-4">
        <Button variant="secondary" onClick={onHide}>
          {cancelText}
        </Button>
        <Button variant={variant} onClick={() => { onConfirm(); onHide(); }}>
          {confirmText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmationModal;
