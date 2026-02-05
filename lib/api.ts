import type {
  ApiResponse,
  AuthResponse,
  AgencyProfile,
  MatchResult,
  SignupRequest,
  LoginRequest,
  AgencyFilterParams,
  StartupPreferences,
  SavedAgency,
  MatchHistory,
  AgencyStats,
} from "@/types";

const API_BASE = "/api";

// Get auth token from localStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

// Set auth token
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

// Clear auth token
export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

// Base fetch helper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // Check if response is successful
    if (!response.ok) {
      // Try to parse error message from JSON
      try {
        const errorData = await response.json();
        return {
          success: false,
          data: null,
          error: errorData.error || {
            code: `HTTP_${response.status}`,
            message: errorData.message || `Request failed with status ${response.status}`,
          },
        };
      } catch (e) {
        // If not JSON (e.g. 404 HTML or 500 server crash), return generic error
        return {
          success: false,
          data: null,
          error: {
            code: `HTTP_${response.status}`,
            message: `Server returned status ${response.status} (${response.statusText})`,
          },
        };
      }
    }

    // Parse successful response
    try {
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (e) {
      return {
        success: false,
        data: null,
        error: {
          code: "INVALID_JSON",
          message: "Failed to parse server response",
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error occurred",
      },
    };
  }
}

// Auth API
export async function signup(data: SignupRequest): Promise<ApiResponse<AuthResponse>> {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Agencies API
interface AgenciesListResponse {
  agencies: AgencyProfile[];
  total: number;
  filters: AgencyFilterParams;
}

export async function getAgencies(
  filters?: AgencyFilterParams
): Promise<ApiResponse<AgenciesListResponse>> {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/agencies?${queryString}` : "/agencies";

  return apiFetch<AgenciesListResponse>(endpoint);
}

export async function getAgency(id: string): Promise<ApiResponse<AgencyProfile>> {
  return apiFetch<AgencyProfile>(`/agencies/${id}`);
}

export async function createAgency(
  data: Omit<AgencyProfile, "id" | "userId" | "createdAt" | "updatedAt">
): Promise<ApiResponse<AgencyProfile>> {
  return apiFetch<AgencyProfile>("/agencies", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAgency(
  id: string,
  data: Partial<Omit<AgencyProfile, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<ApiResponse<AgencyProfile>> {
  return apiFetch<AgencyProfile>(`/agencies/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// Get current user's agency profile
export async function getMyAgencyProfile(): Promise<ApiResponse<AgencyProfile | null>> {
  return apiFetch<AgencyProfile | null>("/agencies/me");
}

// Get agency stats
export async function getAgencyStats(): Promise<ApiResponse<AgencyStats>> {
  return apiFetch<AgencyStats>("/agencies/me/stats");
}

// Match API
interface MatchResponse {
  matches: MatchResult[];
  total_matches: number;
  preferences_used: StartupPreferences;
}

export async function findMatches(
  preferences: StartupPreferences & { minScore?: number; limit?: number }
): Promise<ApiResponse<MatchResponse>> {
  return apiFetch<MatchResponse>("/match", {
    method: "POST",
    body: JSON.stringify(preferences),
  });
}

// Startup: Saved agencies
interface SavedAgenciesResponse {
  savedAgencies: SavedAgency[];
  total: number;
}

export async function getSavedAgencies(): Promise<ApiResponse<SavedAgenciesResponse>> {
  return apiFetch<SavedAgenciesResponse>("/startup/saved");
}

export async function saveAgency(agencyId: string): Promise<ApiResponse<SavedAgency>> {
  return apiFetch<SavedAgency>("/startup/saved", {
    method: "POST",
    body: JSON.stringify({ agencyId }),
  });
}

export async function unsaveAgency(agencyId: string): Promise<ApiResponse<{ message: string }>> {
  return apiFetch<{ message: string }>(`/startup/saved/${agencyId}`, {
    method: "DELETE",
  });
}

// Startup: Match history
interface MatchHistoryResponse {
  history: MatchHistory[];
  total: number;
}

export async function getMatchHistory(): Promise<ApiResponse<MatchHistoryResponse>> {
  return apiFetch<MatchHistoryResponse>("/startup/matches");
}
