export const USERNAME_MAX_LENGTH = 25;
export const USERNAME_MIN_LENGTH = 1;

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: "Username cannot be empty" };
  }
  
  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Username cannot be longer than ${USERNAME_MAX_LENGTH} characters` };
  }
  
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Username must be at least ${USERNAME_MIN_LENGTH} character` };
  }
  
  // Only allow alphanumeric characters, underscores and spaces
  const validPattern = /^[a-zA-Z0-9_ ]+$/;
  if (!validPattern.test(username)) {
    return { valid: false, error: "Username can only contain letters, numbers, underscores, and spaces" };
  }
  
  // Check for excessive spaces
  if (username.includes('  ')) {
    return { valid: false, error: "Username cannot have consecutive spaces" };
  }
  
  // Check that it doesn't start or end with space
  if (username.startsWith(' ') || username.endsWith(' ')) {
    return { valid: false, error: "Username cannot start or end with a space" };
  }
  
  return { valid: true };
};

export const normalizeUsername = (username: string): string => {
  return username.toLowerCase().trim();
};