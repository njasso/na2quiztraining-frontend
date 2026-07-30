// src/components/ui/textarea.js
import React from 'react';

const Textarea = ({ value, onChange, placeholder, rows = 4, className }) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`border border-gray-300 p-2 rounded w-full ${className}`}
    />
  );
};

export default Textarea;
