
import React from 'react';

export const Input = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  required = false, 
  className = '',
  label,
  min,
  options = [] // for select inputs
}) => {
  const baseClasses = 'w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  
  if (type === 'select') {
    return (
      <div>
        {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
        <select
          value={value}
          onChange={onChange}
          className={`${baseClasses} ${className}`}
          required={required}
        >
          <option value="">{placeholder}</option>
          {options.map((option, index) => (
            <option key={index} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        className={`${baseClasses} ${className}`}
      />
    </div>
  );
};
