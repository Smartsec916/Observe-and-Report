import CryptoJS from 'crypto-js';

// Secret key for encryption, in production this would be stored in environment variables
// For demonstration purposes, we'll use a static key here
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'b9c52730-4c56-43af-bf8a-4ade6c6dfd61';

/**
 * Encrypts sensitive data
 * @param data - The data to encrypt
 * @returns Encrypted string
 */
export function encryptData(data: any): string {
  if (!data) return '';
  
  // Convert to string if it's an object
  const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
  
  // Encrypt the data
  return CryptoJS.AES.encrypt(dataStr, SECRET_KEY).toString();
}

/**
 * Decrypts encrypted data
 * @param encryptedData - The encrypted data string
 * @returns Decrypted data (object or string)
 */
export function decryptData(encryptedData: string): any {
  if (!encryptedData) return '';
  
  try {
    // Decrypt the data
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    // Try to parse as JSON if possible
    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      // If not JSON, return as string
      return decryptedString;
    }
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

/**
 * Selectively encrypts sensitive fields in an object
 * @param data - Object containing data to partially encrypt
 * @param sensitiveFields - Array of field paths to encrypt (dot notation supported)
 * @returns Copy of original object with sensitive fields encrypted
 */
export function encryptSensitiveFields<T>(data: T, sensitiveFields: string[]): T {
  if (!data || typeof data !== 'object') return data;
  
  // Create a deep copy to avoid modifying the original
  const result = JSON.parse(JSON.stringify(data)) as T;
  
  // Process each sensitive field
  sensitiveFields.forEach(fieldPath => {
    const pathParts = fieldPath.split('.');
    let current: any = result;
    
    // Navigate to the parent object of the field to encrypt
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (current[pathParts[i]] === undefined) return;
      current = current[pathParts[i]];
    }
    
    // Get the field name to encrypt
    const fieldName = pathParts[pathParts.length - 1];
    
    // Encrypt the field if it exists
    if (current[fieldName] !== undefined) {
      current[fieldName] = encryptData(current[fieldName]);
    }
  });
  
  return result;
}

/**
 * Selectively decrypts encrypted fields in an object
 * @param data - Object containing encrypted data
 * @param encryptedFields - Array of field paths that are encrypted (dot notation supported)
 * @returns Copy of original object with fields decrypted
 */
export function decryptSensitiveFields<T>(data: T, encryptedFields: string[]): T {
  if (!data || typeof data !== 'object') return data;
  
  // Create a deep copy to avoid modifying the original
  const result = JSON.parse(JSON.stringify(data)) as T;
  
  // Process each encrypted field
  encryptedFields.forEach(fieldPath => {
    const pathParts = fieldPath.split('.');
    let current: any = result;
    
    // Navigate to the parent object of the field to decrypt
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (current[pathParts[i]] === undefined) return;
      current = current[pathParts[i]];
    }
    
    // Get the field name to decrypt
    const fieldName = pathParts[pathParts.length - 1];
    
    // Decrypt the field if it exists
    if (current[fieldName] !== undefined && current[fieldName] !== '') {
      current[fieldName] = decryptData(current[fieldName]);
    }
  });
  
  return result;
}