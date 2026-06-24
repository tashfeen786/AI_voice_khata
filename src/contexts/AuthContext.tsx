import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  changePassword as apiChangePassword,
  getSession,
  loginWithPassword,
  logoutApi,
  ProfileDto,
  SessionDto,
  TenantDto,
  updateProfile as apiUpdateProfile,
  UserInfo,
} from "@/lib/api/auth-api";
import { tokenStore } from "@/lib/api/token-store";

interface AuthState {
  currentUser: UserInfo | null;
  profile: ProfileDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  features: string[];
  tenant: TenantDto | null;
  isHost: boolean;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string, tenant: string | null, remember?: boolean) => Promise<SessionDto>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (p: Partial<ProfileDto>) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isFeatureEnabled: (feature: string) => boolean;
  setTenant: (tenant: TenantDto | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    currentUser: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true,
    permissions: [],
    features: [],
    tenant: null,
    isHost: false,
  });
  const initCalled = useRef(false);

  const hydrate = useCallback(async (session: SessionDto) => {
    setState({
      currentUser: {
        sub: session.id,
        name: session.name ?? "",
        family_name: session.surname ?? "",
        preferred_username: session.userName ?? "",
        email: session.email ?? "",
        phone_number: session.phoneNumber,
        tenantid: session.tenantId ?? null,
        role: [],
      } as UserInfo,
      profile: {
        userName: session.userName ?? "",
        email: session.email ?? "",
        name: session.name ?? "",
        surname: session.surname ?? "",
        phoneNumber: session.phoneNumber,
      },
      permissions: session.permissions,
      features: session.enabledFeatures,
      isAuthenticated: true,
      isHost: session.isHost,
      isLoading: false,
      tenant: null,
    });
  }, []);

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;
    const token = tokenStore.getAccessToken();
    if (!token) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }
    (async () => {
      try {
        const session = await getSession();
        await hydrate(session);
      } catch (err) {
        console.error("Session load failed:", err);
        tokenStore.clear();
        setState(prev => ({ ...prev, isLoading: false }));
      }
    })();
  }, [hydrate]);

  const login: AuthContextValue["login"] = useCallback(async (username, password, tenant, remember) => {
    tokenStore.setTenant(tenant);
    const tokens = await loginWithPassword(username, password, tenant);
    tokenStore.setAccessToken(tokens.access_token, tokens.expires_in);
    tokenStore.setRefreshToken(tokens.refresh_token);
    if (remember) tokenStore.setRememberedUsername(username);
    else tokenStore.setRememberedUsername(null);
    const session = await getSession();
    await hydrate(session);
    return session;
  }, [hydrate]);

  const logout = useCallback(async () => {
    await logoutApi();
    tokenStore.clear();
    setState({
      currentUser: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      permissions: [],
      features: [],
      tenant: null,
      isHost: false,
    });
  }, []);

  const refreshProfile = useCallback(async () => {
    const session = await getSession();
    setState(prev => ({
      ...prev,
      profile: {
        userName: session.userName ?? "",
        email: session.email ?? "",
        name: session.name ?? "",
        surname: session.surname ?? "",
        phoneNumber: session.phoneNumber,
      },
    }));
  }, []);

  const updateProfile = useCallback(async (p: Partial<ProfileDto>) => {
    const profile = await apiUpdateProfile(p);
    setState(prev => ({ ...prev, profile }));
    toast.success("Profile updated");
  }, []);

  const changePassword = useCallback(async (current: string, next: string) => {
    await apiChangePassword(current, next);
    toast.success("Password changed");
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    login,
    logout,
    refreshProfile,
    updateProfile,
    changePassword,
    hasPermission: (p) => state.permissions.includes(p),
    isFeatureEnabled: (f) => state.features.includes(f),
    setTenant: (t) => {
      tokenStore.setTenant(t?.id ?? null);
      setState(prev => ({ ...prev, tenant: t }));
    },
  }), [state, login, logout, refreshProfile, updateProfile, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}