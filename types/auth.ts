export type UserRole = "customer" | "seller" | "support" | "admin";
export type MemberTier = "Core" | "Silver" | "Gold" | "Platinum";
export type BackendState = "checking" | "ready" | "unavailable";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tier: MemberTier;
  verified: boolean;
};

export type AuthSession = {
  user: AuthUser;
  issuedAt: string;
  expiresAt: string;
};

export type LoginInput = {
  email: string;
  password: string;
  remember?: boolean;
};

export type RegisterInput = {
  name: string;
  email: string;
  phone?: string;
  password: string;
};

export type AuthContextValue = {
  session: AuthSession | null;
  ready: boolean;
  backend: BackendState;
  backendMessage: string;
  login: (input: LoginInput) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<AuthSession>;
  refreshSession: () => Promise<AuthSession | null>;
  signOut: () => Promise<void>;
};
