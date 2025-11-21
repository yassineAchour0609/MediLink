import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Botservice {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  envoyerMessage(message: string): Observable<{ reply: string }> {
    return this.http.post<{ reply: string }>(`${this.apiUrl}/chat`, { message });
  }

  getSpecialites(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/specialites`);
  }
}
