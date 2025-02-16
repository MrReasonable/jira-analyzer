import React from 'react';

export const FormField = ({ 
  name, 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  label,
  error,
  className = ""
}) => (
  <div className={`relative ${className}`}>
    {label && (
      <label 
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
    )}
    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={(e) => onChange(name, e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-md border bg-white text-zinc-900 shadow-sm 
                 placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                 transition duration-200 ease-in-out
                 ${error ? 'border-red-500' : 'border-zinc-200'}`}
    />
    {error && (
      <p className="mt-1 text-sm text-red-600">
        {error}
      </p>
    )}
  </div>
);

export default FormField;
