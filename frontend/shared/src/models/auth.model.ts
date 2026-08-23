export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  points: number;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  user: CurrentUser;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface CreateAdminRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
}
