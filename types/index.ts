// User roles
export type UserRole = 'startup' | 'agency';

// Experience levels
export type ExperienceLevel = 'early-stage' | 'growth' | 'enterprise';

// Thinking styles
export type ThinkingStyle = 'creative' | 'data' | 'hybrid';

// Categories
export type Category = 
  | 'SEO' 
  | 'Branding' 
  | 'Performance' 
  | 'Web' 
  | 'Social Media' 
  | 'Content Marketing'
  | 'Email Marketing'
  | 'PR'
  | 'Influencer Marketing';

// Industries
export type Industry = 
  | 'SaaS' 
  | 'D2C' 
  | 'Fintech' 
  | 'Edtech' 
  | 'Healthcare'
  | 'E-commerce'
  | 'B2B'
  | 'Consumer';

// Base User entity
export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

// Agency Profile entity
export interface AgencyProfile {
  id: string;
  userId: string;
  name: string;
  categories: Category[];
  industries: Industry[];
  budgetMin: number;
  budgetMax: number;
  areas: string[];
  keywords: string[];
  experienceLevel: ExperienceLevel;
  thinkingStyle: ThinkingStyle;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Startup preferences for matching
export interface StartupPreferences {
  budget: number;
  categories: Category[];
  industries?: Industry[];
  areas?: string[];
  thinkingPreference: ThinkingStyle;
  experienceLevel?: ExperienceLevel;
  keywords?: string[];
}

// Match result
export interface MatchResult {
  agency: AgencyProfile;
  thinkingMatchScore: number;
  overallScore: number;
  whyMatched: string[];
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

// Auth types
export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Saved agency (for startups)
export interface SavedAgency {
  id: string;
  startupUserId: string;
  agencyId: string;
  savedAt: Date;
  agency?: AgencyProfile;
}

// Match history (for startups)
export interface MatchHistory {
  id: string;
  startupUserId: string;
  preferences: StartupPreferences;
  matchCount: number;
  topMatchAgencyId?: string;
  topMatchScore?: number;
  createdAt: Date;
}

// Agency stats
export interface AgencyStats {
  profileCompleteness: number;
  totalViews: number;
  savedCount: number;
}

// Agency filter params
export interface AgencyFilterParams {
  category?: Category;
  area?: string;
  budgetMin?: number;
  budgetMax?: number;
  keyword?: string;
  industry?: Industry;
  thinkingStyle?: ThinkingStyle;
  experienceLevel?: ExperienceLevel;
}
