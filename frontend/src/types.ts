export type Screen =
  | 'intro'
  | 'auth'
  | 'access-code'
  | 'quiz'
  | 'loading'
  | 'result'
  | 'dashboard'
  | 'staff-login'
  | 'admin-users'
  | 'admin-departments';

export type UserRole = 'admin' | 'gestor' | 'lider' | 'colaborador';

export interface Department {
  id: number;
  name: string;
}

export interface DashboardData {
  totalUsers: number;
  sectorDistribution: Record<string, number>;
  discDistribution: { name: string; value: number }[];
  sectorData: { name: string; value: number }[];
  analysis: {
    culture_summary: string;
    leadership_focus: string[];
    strategic_advice: string;
    potential_risks: string;
    growth_opportunities: string;
    attention_needed: string[];
  } | null;
}

export interface Analysis {
  headline: string;
  description: string;
  strengths: string[];
  challenges: string[];
  management_tips: string[];
  ideal_roles: string;
  combo_insight: string;
}

export interface StaffSession {
  token: string;
  role: UserRole;
  nomeCompleto: string;
  departmentId: number | null;
}

export interface CollaboratorUser {
  id: number;
  nomeCompleto: string;
  email: string;
  departmentId: number | null;
  idade: number;
  regiao: string;
  role: UserRole;
  primaryType?: string | null;
  secondaryType?: string | null;
  analiseResult?: string | null;
  createdAt?: string;
}

export interface StaffUser {
  id: number;
  nomeCompleto: string;
  email: string;
  role: UserRole;
  departmentId: number | null;
  createdAt?: string;
}

// Formato retornado pelos endpoints públicos (GET /users/email/:email, POST /users)
// — nunca inclui analiseResult/scores, que exigem o código de acesso.
export interface PublicUserSummary {
  id: number;
  nomeCompleto: string;
  email: string;
  departmentId: number | null;
  idade: number;
  regiao: string;
  hasResult: boolean;
}

// Formato retornado após verificar e-mail + código de acesso (POST /users/verify-access).
export interface PublicUserResult {
  id: number;
  nomeCompleto: string;
  email: string;
  departmentId: number | null;
  idade: number;
  regiao: string;
  analiseResult: string | null;
  scoreD: number | null;
  scoreI: number | null;
  scoreS: number | null;
  scoreC: number | null;
  primaryType: string | null;
  secondaryType: string | null;
}

export interface UserFormData {
  nomeCompleto: string;
  email: string;
  departmentId: string;
  idade: string;
  regiao: string;
}
