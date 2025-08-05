// ConfirmationSnackbar.jsx
import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const ConfirmationSnackbar = ({ open, onClose, message, error = false }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert 
        onClose={onClose} 
        severity={error ? 'error' : 'success'} 
        variant="filled" 
        sx={{
          width: 400,
          borderRadius: '12px',
          boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
          fontSize: '0.8rem',
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default ConfirmationSnackbar;
