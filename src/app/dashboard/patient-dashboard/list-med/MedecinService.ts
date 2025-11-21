import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medecin } from './medecin';

const apiUrl = 'http://localhost:3001/api/medecins';

@Injectable({
  providedIn: 'root'
})
export class MedecinService {
  constructor(private http: HttpClient) {}
  getAllMedecins(): Observable<{ success: boolean; medecins: Medecin[] }> {
    return this.http.get<{ success: boolean; medecins: Medecin[] }>(apiUrl);
  }
  getMedecinById(id: number): Observable<{success:boolean; medecin:Medecin}> {
    return this.http.get<{ success: boolean; medecin: Medecin}>(`${apiUrl}/${id}`);
  }
}
