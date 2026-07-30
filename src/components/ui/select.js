// src/components/ui/select.js
import React from 'react';

const Select = ({ value, onChange, children, className }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`border border-gray-300 p-2 rounded w-full ${className}`}
    >
      {children}
    </select>
  );
};

export default Select;
