import { useState } from 'react';
import { ZodSchema, ZodError } from 'zod';

interface ValidationResult<T> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

export const useFormValidation = <T extends Record<string, any>>() => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (schema: ZodSchema<T>, data: T): ValidationResult<T> => {
    try {
      const validatedData = schema.parse(data);
      setErrors({});
      return {
        isValid: true,
        errors: {},
        data: validatedData
      };
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        return {
          isValid: false,
          errors: fieldErrors
        };
      }
      return {
        isValid: false,
        errors: { general: 'Validation failed' }
      };
    }
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validate,
    clearError,
    clearAllErrors,
    setErrors
  };
};
