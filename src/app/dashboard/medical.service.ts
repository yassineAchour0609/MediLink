import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

const baseUrl = 'http://localhost:3001';

@Injectable({
  providedIn: 'root'
})
export class MedicalService {
  constructor(private http: HttpClient) {}

  // Médecin - RDV
  getRendezvousByMedecin(idMedecin: number) {
    return this.http.get<{ success: boolean, rendezvous: any[] }>(`${baseUrl}/api/rendezvous/medecin/${idMedecin}`);
  }

  annulerRendezvous(idRdv: number) {
    return this.http.put<{ success: boolean }>(`${baseUrl}/api/rendezvous/${idRdv}/annuler`, {});
  }

  // Dossier médical complet
  getDossierByPatient(idPatient: number, options?: { idMedecin?: number }) {
    const params = options?.idMedecin ? { params: { idMedecin: String(options.idMedecin) } } : {};
    return this.http.get<{
      success: boolean,
      dossier: any,
      analyses: any[],
      ordonnances: any[],
      notes: any[]
    }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}`, params);
  }

  updateDossierInfos(idPatient: number, payload: any) {
    return this.http.put<{ success: boolean }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}`, payload);
  }

  addAnalyse(idPatient: number, payload: any) {
    return this.http.post<{ success: boolean, id: number }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/analyses`, payload);
  }

  updateAnalyse(idPatient: number, idAnalyse: number, payload: any) {
    return this.http.put<{ success: boolean }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/analyses/${idAnalyse}`, payload);
  }

  deleteAnalyse(idPatient: number, idAnalyse: number) {
    return this.http.delete<{ success: boolean }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/analyses/${idAnalyse}`);
  }

  addOrdonnance(idPatient: number, payload: any) {
    return this.http.post<{ success: boolean, id: number }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/ordonnances`, payload);
  }

  updateOrdonnance(idPatient: number, idOrdonnance: number, payload: any) {
    return this.http.put<{ success: boolean }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/ordonnances/${idOrdonnance}`, payload);
  }

  deleteOrdonnance(idPatient: number, idOrdonnance: number) {
    return this.http.delete<{ success: boolean }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/ordonnances/${idOrdonnance}`);
  }

  addNote(idPatient: number, payload: any) {
    return this.http.post<{ success: boolean, id: number }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/notes`, payload);
  }

  updateNote(idPatient: number, idNote: number, payload: any) {
    return this.http.put<{ success: boolean }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/notes/${idNote}`, payload);
  }

  deleteNote(idPatient: number, idNote: number) {
    return this.http.delete<{ success: boolean }>(`${baseUrl}/api/dossier-medical/patient/${idPatient}/notes/${idNote}`);
  }

  // Recherche de patients par nom/prénom
  searchPatientsByName(query: string) {
    return this.http.get<{ success: boolean, results: Array<{ id: number, nom: string, prenom: string, telephone: string }> }>(
      `${baseUrl}/api/utilisateur/search`,
      { params: { q: query } }
    );
  }
}


