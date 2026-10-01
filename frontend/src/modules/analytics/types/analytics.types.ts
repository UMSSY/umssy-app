export type UserRole =
  | "Estudiante"
  | "Egresado"
  | "Titulado"
  | "Mentor"
  | "Empresa"
  | "Administrador";

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  identifier: string;
  document: string;
  registrationDate: string;
}

export interface UsersReportFilters {
  role?: string;
  searchQuery?: string;
}

export interface PaginatedUsersResponse {
  users: RegisteredUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
