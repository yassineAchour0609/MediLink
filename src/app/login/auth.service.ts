import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface SignupPayload {
  email: string;
  motDePasse: string;
  nom: string;
  prenom: string;
  role: 'patient' | 'medecin';
  sexe: string;
  age: number;
  date_naissance: string;
  telephone: string;
  num_cin: string;
  // pour médecin
  specialite?: string;
  cabinet?: string;
  tarif_consultation?: number;
  disponibilite?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  utilisateur?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3001/api/utilisateur';
  private TOKEN_KEY = 'medilink_token';
  private USER_KEY = 'medilink_user';

  constructor(private http: HttpClient) {}

  signup(data: SignupPayload): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, data);
  }

  login(email: string, motDePasse: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, motDePasse }).pipe(
      tap(res => {
        if (res.success && res.token) {
          this.saveToken(res.token);
          if (res.utilisateur) {
            this.saveUser(res.utilisateur);
          }
        }
      })
    );
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  saveUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): any | null {
    const data = localStorage.getItem(this.USER_KEY);
    return data ? JSON.parse(data) : null;
  }

  logout(): void {
    this.removeToken();
    localStorage.removeItem(this.USER_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }
}
