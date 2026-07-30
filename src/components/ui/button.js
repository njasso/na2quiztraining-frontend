// src/components/ui/button.js
import React from 'react';

const Button = ({ children, onClick, className, disabled }) => {
  return (
    <button
      onClick={onClick}
      className={`bg-blue-500 text-white px-4 py-2 rounded ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
