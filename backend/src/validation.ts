import validator from 'validator';
import { ConnectionRecord } from './types';
// Updated validation for multi-label support

export const validatePatternData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate label (required) - can be comma-separated
  if (!data.label || typeof data.label !== 'string') {
    errors.push('Label is required and must be a string');
  } else {
    // Split by comma and validate each label
    const labels = data.label.split(',').map((label: string) => label.trim()).filter(Boolean);
    if (labels.length === 0) {
      errors.push('At least one label is required');
    } else {
      const invalidLabels = labels.filter((label: string) => !/^[a-z0-9_-]+$/.test(label));
      if (invalidLabels.length > 0) {
        errors.push(`Invalid label format for: ${invalidLabels.join(', ')}. Each label must be lowercase alphanumeric with hyphens or underscores only`);
      }
    }
  }

  // Validate pattern (required)
  if (!data.pattern || typeof data.pattern !== 'string') {
    errors.push('Pattern is required and must be a string');
  } else if (!validator.isAscii(data.pattern)) {
    errors.push('Pattern must contain only ASCII characters');
  }

  // Description is optional
  if (data.description !== undefined && data.description !== null && data.description !== '') {
    if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (!validator.isAscii(data.description)) {
      errors.push('Description must contain only ASCII characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizePatternData = (data: any): Partial<ConnectionRecord> => {
  return {
    label: validator.escape(String(data.label || '')),
    pattern: validator.escape(String(data.pattern || '')),
    description: validator.escape(String(data.description || ''))
  };
};