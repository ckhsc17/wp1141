import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_EXPIRY = '1h';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * 生成 Access Token
   */
  static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, secret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      issuer: 'treasure-map-api',
      audience: 'treasure-map-app'
    });
  }

  /**
   * 生成 Refresh Token
   */
  static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, secret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'treasure-map-api',
      audience: 'treasure-map-app'
    });
  }

  /**
   * 驗證 Access Token
   */
  static verifyAccessToken(token: string): JWTPayload {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
      return jwt.verify(token, secret, {
        issuer: 'treasure-map-api',
        audience: 'treasure-map-app'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * 驗證 Refresh Token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
    }

    try {
      return jwt.verify(token, secret, {
        issuer: 'treasure-map-api',
        audience: 'treasure-map-app'
      }) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * 從 token 中解析 payload（不驗證簽名）
   */
  static decodeToken(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      return null;
    }
  }
}