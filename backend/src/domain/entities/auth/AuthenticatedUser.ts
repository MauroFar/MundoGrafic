export interface AuthenticatedUser {
  id: number;
  rol: string;
  nombre: string | null;
  email: string;
  celular: string | null;
}
