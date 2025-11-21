import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Patient, Rendezvous } from './patient';

const apiUrl = 'http://localhost:3001/api/utilisateur';
const rdvApiUrl = 'http://localhost:3001/api/rendezvous';
@Injectable({
  providedIn: 'root'
})
export class PatientService {
  constructor(private http: HttpClient) {}

  getPatientById(id: number): Observable<{ success: boolean, patient: Patient}> {
    return this.http.get<{ success: boolean, patient: Patient}>(`${apiUrl}/${id}`);
  }
  getRendezvousByPatientId(id: number): Observable<{ success: boolean, rendezvous: Rendezvous[]}> {
    return this.http.get<{ success: boolean, rendezvous: Rendezvous[]}>(`${rdvApiUrl}/patient/${id}`);
  }
  prendreRdv(rdv: { idMedecin: number; idPatient: number; date: string; heure: string; statut: string }): Observable<{ success: boolean; rendezvous: Rendezvous }> {
    return this.http.post<{ success: boolean; rendezvous: Rendezvous }>(rdvApiUrl, rdv);
  }
  annulerRendezvous(idRdv: number): Observable<{ success: boolean }> {
  return this.http.put<{ success: boolean }>(`${rdvApiUrl}/${idRdv}/annuler`, {});
  }
  updateRdv(rdv: { idRdv: number; date: string; heure: string }): Observable<{ success: boolean }> {
  return this.http.put<{ success: boolean }>(`${rdvApiUrl}/modifier/${rdv.idRdv}`, rdv);
}
}
