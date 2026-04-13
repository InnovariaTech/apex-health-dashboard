export interface AuthUser {
  id?: string | number;
  email: string;
  role?: string;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  full_name?: string;
  email: string;
  phone?: string;
  password: string;
  role?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface AuthResponseBody {
  user?: AuthUser;
  message?: string;
}

export interface AuthApi {
  signup(payload: SignupPayload): Promise<AuthUser | null>;
  login(payload: LoginPayload): Promise<AuthUser | null>;
  me(): Promise<AuthUser | null>;
  refresh(): Promise<AuthUser | null>;
  logout(): Promise<void>;
  forgotPassword(payload: ForgotPasswordPayload): Promise<unknown>;
  resetPassword(payload: ResetPasswordPayload): Promise<unknown>;
  updateMe(form: Partial<AuthUser>): Promise<AuthUser | null>;
  redirectToLogin(): void;
}

export interface AppApi {
  auth: AuthApi;
  entities: unknown;
  integrations: unknown;
}
