import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  tipoUsuario: string;
  idPersona: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  idUsuario?: string;
  username?: string;
  tipoUsuario?: string;
  idPersona?: string;
  nombreRol?: string;
  nombreCompleto?: string;
  permisos?: string;
  ultimoLogin?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(loginRequest: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 Enviando solicitud de login a:', `${this.apiUrl}/login`);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginRequest)
      .pipe(
        tap(response => {
          console.log('📥 Respuesta del login recibida:', response);
          if (response.success) {
            this.saveUserData(response);
            console.log('✅ Usuario guardado en localStorage');
          }
        })
      );
  }

  register(registerRequest: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerRequest)
      .pipe(
        tap(response => {
          if (response.success) {
            this.saveUserData(response);
          }
        })
      );
  }

  checkUsernameAvailability(username: string): Observable<any> {
    const params = new HttpParams().set('username', username);
    return this.http.get(`${this.apiUrl}/verificar-username`, { params });
  }

  changePassword(username: string, nuevaPassword: string): Observable<any> {
    const params = new HttpParams()
      .set('username', username)
      .set('nuevaPassword', nuevaPassword);
    
    return this.http.post(`${this.apiUrl}/cambiar-password`, null, { params });
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    console.log('🚪 Usuario cerró sesión');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('currentUser');
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  saveUserData(user: AuthResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  // Método para verificar el estado del servidor
  checkServerStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/status`);
  }
}