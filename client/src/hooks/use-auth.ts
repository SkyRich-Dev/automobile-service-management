import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getCsrfToken } from "@/lib/queryClient";

function csrfHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  const token = getCsrfToken();
  if (token) headers["X-CSRFToken"] = token;
  return headers;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface Profile {
  id: number;
  role: string;
  branch: number | null;
  branch_name: string | null;
  phone: string | null;
  utilization: number;
  avatar: string | null;
}

interface AuthResponse {
  user: User;
  profile: Profile | null;
}

const API_BASE = "/api";

async function fetchUser(): Promise<AuthResponse | null> {
  const response = await fetch(`${API_BASE}/auth/user/`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function loginUser(credentials: { username: string; password: string }): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: csrfHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Login failed");
  }

  return response.json();
}

async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/register/`, {
    method: "POST",
    headers: csrfHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || "Registration failed");
  }

  return response.json();
}

async function logoutUser(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout/`, {
    method: "POST",
    headers: csrfHeaders(),
    credentials: "include",
  });
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery<AuthResponse | null>({
    queryKey: ["auth", "user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "user"], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "user"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(["auth", "user"], null);
      queryClient.clear();
    },
  });

  return {
    user: data?.user ?? null,
    profile: data?.profile ?? null,
    isLoading,
    isAuthenticated: !!data?.user,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

export type { User, Profile, AuthResponse };
