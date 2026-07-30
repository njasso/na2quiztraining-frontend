// src/components/ui/input.js
import React from 'react';

const Input = ({ value, onChange, placeholder, type = "text", className }) => {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`border border-gray-300 p-2 rounded w-full ${className}`}
    />
  );
};

export default Input;
