import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './login/auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getFormDataHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Méthode pour déterminer la route en fonction du rôle de l'utilisateur
  private getProfileRoute(): string {
    const user = this.authService.getUser();
    return user && user.role === 'medecin' ? 'medecin/profile' : 'patient/profile';
  }

  getProfile(): Observable<any> {
    return this.http.get(`http://localhost:3001/api/utilisateur/profile`, { headers: this.getHeaders() });
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`http://localhost:3001/api/utilisateur/profile`, profileData, { headers: this.getHeaders() });
  }

  changePassword(passwordData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/utilisateur/change-password`, passwordData, {
      headers: this.getHeaders()
    });
  }





  // Méthode utilitaire pour obtenir le rôle de l'utilisateur
  getUserRole(): string {
    const user = this.authService.getUser();
    return user ? user.role : 'patient'; // Par défaut patient
  }
}
