import { UserRole } from './user-role';

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface BackendRoleEntry {
  role: { code: string };
}

export interface BackendCurrentUser {
  id: string;
  email: string | null;
  phone: string | null;
  status: string;
  profile: {
    displayName: string | null;
    language: string | null;
    timezone: string | null;
    preferences: Record<string, unknown> | null;
  } | null;
  roles: BackendRoleEntry[];
}

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  status: string;
  roles: UserRole[];
}

export interface ForgotPasswordRequest {
  identifier: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  revokeAllSessions: true;
}

export interface AuthSessionRecord {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string;
}
