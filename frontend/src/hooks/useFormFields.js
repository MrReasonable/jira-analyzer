import { useState } from 'react';

export const useFormFields = (initialFields, onFieldsChange) => {
  const [fields, setFields] = useState(initialFields);

  const handleFieldChange = (name, value) => {
    const updatedFields = {
      ...fields,
      [name]: value
    };
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  const setFieldValue = (name, value) => {
    handleFieldChange(name, value);
  };

  const setMultipleFields = (updates) => {
    const updatedFields = {
      ...fields,
      ...updates
    };
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  return {
    fields,
    handleFieldChange,
    setFieldValue,
    setMultipleFields
  };
};
