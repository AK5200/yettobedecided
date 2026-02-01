import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export interface IdentifiedUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  company?: {
    id?: string;
    name?: string;
    plan?: string;
    monthlySpend?: number;
  };
}

export interface IdentifyPayload {
  // Trust Mode
  id?: string;
  email?: string;
  name?: string;
  avatar?: string;
  company?: IdentifiedUser['company'];
  
  // JWT Mode
  token?: string;
}

export type UserSource = 'guest' | 'identified' | 'verified_jwt';

export interface ProcessResult {
  user: IdentifiedUser | null;
  source: UserSource;
  error?: string;
}

/**
 * Generate secret key for JWT signing
 */
export function generateSecretKey(): string {
  return 'sk_live_' + crypto.randomBytes(32).toString('hex');
}

/**
 * Verify JWT token
 */
export function verifyJwtToken(
  token: string,
  secretKey: string
): { valid: boolean; payload: IdentifiedUser | null; error?: string } {
  try {
    const decoded = jwt.verify(token, secretKey, { algorithms: ['HS256'] }) as any;

    if (!decoded.id || !decoded.email) {
      return { valid: false, payload: null, error: 'Token missing id or email' };
    }

    return {
      valid: true,
      payload: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        avatar: decoded.avatar || decoded.avatarUrl || decoded.avatar_url,
        company: decoded.company,
      },
    };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, payload: null, error: 'Token expired' };
    }
    return { valid: false, payload: null, error: 'Invalid token' };
  }
}

/**
 * Process identified user - auto-detect mode
 */
export function processIdentifiedUser(
  payload: IdentifyPayload | null,
  secretKey: string | null
): ProcessResult {
  // No payload
  if (!payload) {
    return { user: null, source: 'guest' };
  }

  // JWT Mode
  if (payload.token) {
    if (!secretKey) {
      return { user: null, source: 'guest', error: 'SSO not configured' };
    }

    const result = verifyJwtToken(payload.token, secretKey);
    
    if (!result.valid) {
      // If JWT fails, don't fall back - return error
      return { user: null, source: 'guest', error: result.error };
    }

    return { user: result.payload!, source: 'verified_jwt' };
  }

  // Trust Mode
  if (payload.id && payload.email) {
    return {
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        avatar: payload.avatar,
        company: payload.company,
      },
      source: 'identified',
    };
  }

  return { user: null, source: 'guest' };
}
