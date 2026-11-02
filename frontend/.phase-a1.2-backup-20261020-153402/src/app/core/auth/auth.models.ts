import { UserRole } from './user-role';

export interface AuthUser {
  id: string;
  email: string;
  roles: UserRole[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSession {
  user: AuthUser;
  tokens: AuthTokens;
}
