export interface NivelDificultad {
  getNombre(): string;
  getIntensidad(): number; // 1-10
  getColor(): string;
  getDuracionRecomendada(duracionBase: number): number;
  getRequisitos(): string[];
  puedeParticipar(usuario: any): boolean;
  getDescripcion(): string;
  getBadgeClass(): string;
}