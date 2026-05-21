import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export type UserRole = 'admin' | 'usuario' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  constructor() {
    // El sessionStorage nativamente ya protege contra apertura de nuevas pestañas,
    // pero permitiremos que sobreviva a las recargas (F5) para mejor experiencia de usuario.
    this.syncRoleThemeFromStorage();
  }

  private mapRol(nombre_rol: string): UserRole {
    const rol = nombre_rol?.toLowerCase().trim();
    if (rol === 'admin' || rol === 'administrador') return 'admin';
    return 'usuario';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private getItem(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return sessionStorage.getItem(key);
  }

  login(username: string, password: string, rememberMe: boolean = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/login/`, {
      usuario: username,
      password: password
    }).pipe(
      tap((response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          const role: string = this.mapRol(response.usuario.nombre_rol) ?? 'usuario';
          
          sessionStorage.setItem('accessToken',     response.tokens.access);
          sessionStorage.setItem('refreshToken',    response.tokens.refresh);
          sessionStorage.setItem('isAuthenticated', 'true');
          sessionStorage.setItem('userRole',        role);
          sessionStorage.setItem('userName',        response.usuario.nombre);
          sessionStorage.setItem('userUsername',    response.usuario.usuario);
          sessionStorage.setItem('userId',          String(response.usuario.id_usuario));
          sessionStorage.setItem('userFull',        JSON.stringify(response.usuario));
          
          if (rememberMe) {
            localStorage.setItem('rememberedUsername', username);
          } else {
            localStorage.removeItem('rememberedUsername');
          }
          
          this.applyRoleTheme(role as UserRole);
        }
      })
    );
  }

  logout(): Observable<any> {
    const refreshToken = this.getItem('refreshToken');
    return this.http.post(`${this.apiUrl}/api/auth/logout/`, {
      refresh: refreshToken
    }).pipe(
      tap(() => {
        if (isPlatformBrowser(this.platformId)) {
          const rememberedUsername = localStorage.getItem('rememberedUsername');
          
          sessionStorage.clear();
          localStorage.clear();
          
          if (rememberedUsername) {
            localStorage.setItem('rememberedUsername', rememberedUsername);
          }
          
          this.applyRoleTheme(null);
        }
      })
    );
  }

  registrarEmpleado(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/register/`, data, {
      headers: this.getAuthHeaders()
    });
  }

  getEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/api/auth/usuarios/`, {
      headers: this.getAuthHeaders()
    });
  }

  editarEmpleado(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/auth/usuarios/${id}/`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  // ✅ NUEVO
  eliminarEmpleado(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/auth/usuarios/${id}/`, {
      headers: this.getAuthHeaders()
    });
  }

  // RECUPERACIÓN DE CONTRASEÑA
  forgotPassword(usuario_o_correo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/forgot-password/`, { usuario_o_correo });
  }

  verifyCode(usuario: string, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/verify-code/`, { usuario, codigo });
  }

  resetPassword(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/reset-password/`, payload);
  }

  getAccessToken(): string | null {
    return this.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getItem('accessToken');
  }

  getRole(): UserRole {
    return this.getItem('userRole') as UserRole;
  }

  getUserName(): string {
    return this.getItem('userName') || '';
  }

  getUsuario(): { id_usuario: number } | null {
    const id = this.getItem('userId');
    if (!id) return null;
    return { id_usuario: Number(id) };
  }

  getUserFull(): any | null {
    const userStr = this.getItem('userFull');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  getPerfil(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/auth/perfil/`, {
      headers: this.getAuthHeaders()
    });
  }

  isAdmin(): boolean   { return this.getRole() === 'admin'; }
  isUsuario(): boolean { return this.getRole() === 'usuario'; }

  syncRoleThemeFromStorage() {
    if (!isPlatformBrowser(this.platformId)) return;
    const role = sessionStorage.getItem('userRole') as UserRole;
    this.applyRoleTheme(role);
  }

  private applyRoleTheme(role: UserRole) {
    if (!isPlatformBrowser(this.platformId)) return;
    document.body.classList.remove('role-admin', 'role-usuario');
    if (role === 'admin')   document.body.classList.add('role-admin');
    if (role === 'usuario') document.body.classList.add('role-usuario');
  }

  actualizarCacheUsuario(data: any) {
    if (!isPlatformBrowser(this.platformId)) return;
    if (data.nombre)    sessionStorage.setItem('userName',     data.nombre);
    if (data.usuario)   sessionStorage.setItem('userUsername', data.usuario);
    sessionStorage.setItem('userFull', JSON.stringify(data));
  }
}