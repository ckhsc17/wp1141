import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export class PasswordService {
  /**
   * 雜湊密碼
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * 驗證密碼
   */
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * 驗證密碼強度
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('密碼至少需要 8 個字元');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('密碼需要包含至少一個大寫字母');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('密碼需要包含至少一個小寫字母');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('密碼需要包含至少一個數字');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密碼需要包含至少一個特殊字元');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}