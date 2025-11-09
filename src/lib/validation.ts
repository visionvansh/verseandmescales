export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.toLowerCase());
};

export const validatePassword = (password: string): string => {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)");
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password should not contain repeated characters");
  }
  
  // Check for sequential characters
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push("Password should not contain sequential characters");
  }
  
  return errors.join('. ');
};

export const validatePhone = (phone: string): boolean => {
  // Remove all non-digit characters for validation
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid international phone number (10-15 digits)
  if (cleaned.length < 10 || cleaned.length > 15) {
    return false;
  }
  
  // Basic phone number format validation
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateUsername = (username: string): string => {
  if (!username) {
    return "Username is required";
  }
  
  if (username.length < 3) {
    return "Username must be at least 3 characters long";
  }
  
  if (username.length > 20) {
    return "Username must be no more than 20 characters long";
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return "Username can only contain letters, numbers, and underscores";
  }
  
  if (/^[0-9]/.test(username)) {
    return "Username cannot start with a number";
  }
  
  // Check for reserved usernames
  const reserved = [
    'admin', 'administrator', 'root', 'system', 'user', 'guest', 'test',
    'api', 'www', 'mail', 'email', 'support', 'help', 'info', 'contact',
    'about', 'privacy', 'terms', 'login', 'register', 'signup', 'signin',
    'logout', 'profile', 'account', 'settings', 'dashboard', 'home'
  ];
  
  if (reserved.includes(username.toLowerCase())) {
    return "This username is reserved and cannot be used";
  }
  
  return "";
};

export const validateName = (name: string, fieldName: string = "Name"): string => {
  if (!name || !name.trim()) {
    return `${fieldName} is required`;
  }
  
  if (name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  
  if (name.trim().length > 50) {
    return `${fieldName} must be no more than 50 characters long`;
  }
  
  if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  
  return "";
};

export const sanitizeInput = (input: string): string => {
  return input.trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
};

export const generateSecureCode = (length: number = 6): string => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateUsernamesuggestions = (baseName: string): string[] => {
  const suggestions: string[] = [];
  const cleanBase = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (cleanBase.length < 3) return suggestions;
  
  // Add numbers to the end
  for (let i = 1; i <= 999; i++) {
    suggestions.push(`${cleanBase}${i}`);
    if (suggestions.length >= 5) break;
  }
  
  // Add random suffixes
  const suffixes = ['pro', 'elite', 'star', 'ace', 'master', 'king', 'legend'];
  for (const suffix of suffixes) {
    suggestions.push(`${cleanBase}_${suffix}`);
    if (suggestions.length >= 8) break;
  }
  
  // Add prefixes
  const prefixes = ['the', 'real', 'official', 'mr', 'ms'];
  for (const prefix of prefixes) {
    suggestions.push(`${prefix}_${cleanBase}`);
    if (suggestions.length >= 10) break;
  }
  
  return suggestions.slice(0, 6); // Return max 6 suggestions
};

export const isStrongPassword = (password: string): boolean => {
  return validatePassword(password) === "";
};

export const getPasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 15;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
  
  // Bonus points
  if (/[^\w\s]/.test(password)) score += 5; // Special characters
  if (password.length >= 20) score += 5; // Very long password
  
  // Penalties
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/(?:abc|bcd|cde|123|234|345)/i.test(password)) score -= 15; // Sequential
  
  score = Math.max(0, Math.min(100, score));
  
  let label: string;
  let color: string;
  
  if (score < 30) {
    label = "Weak";
    color = "#ef4444";
  } else if (score < 60) {
    label = "Fair";
    color = "#f59e0b";
  } else if (score < 80) {
    label = "Good";
    color = "#eab308";
  } else {
    label = "Strong";
    color = "#22c55e";
  }
  
  return { score, label, color };
};