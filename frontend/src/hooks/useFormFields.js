export const useFormFields = (initialFields, onFieldsChange) => {
  const handleFieldChange = (name, value) => {
    const updatedFields = {
      ...initialFields,
      [name]: value
    };
    onFieldsChange(updatedFields);
  };

  const setFieldValue = (name, value) => {
    handleFieldChange(name, value);
  };

  const setMultipleFields = (updates) => {
    const updatedFields = {
      ...initialFields,
      ...updates
    };
    onFieldsChange(updatedFields);
  };

  return {
    fields: initialFields,
    handleFieldChange,
    setFieldValue,
    setMultipleFields
  };
};
