import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DossierMedical {
  idDossier: number;
  idPatient: number;
  date_creation: string;
  groupe_sanguin?: string;
  antecedents_medicaux?: string;
  traitements_en_cours?: string;
  vaccinations?: string;
  diagnostic?: string;
  der_mise_a_jour?: string;
}

export interface Analyse {
  idAnalyse: number;
  idDossier: number;
  type_analyse: string;
  date_analyse: string;
  resultats?: string;
  laboratoire?: string;
  idMedecinPrescripteur?: number;
  notes?: string;
  url_document?: string;
  created_at: string;
  medecin_nom?: string;
  medecin_prenom?: string;
}

export interface Ordonnance {
  idOrdonnance: number;
  idDossier: number;
  date_ordonnance: string;
  idMedecinPrescripteur?: number;
  medicaments: string;
  posologie?: string;
  duree_traitement?: string;
  notes?: string;
  url_document?: string;
  created_at: string;
  medecin_nom?: string;
  medecin_prenom?: string;
}

export interface DossierMedicalNote {
  idNote: number;
  idDossier?: number;
  idPatient?: number;
  idMedecin: number;
  type_note?: string;
  contenu_note: string;
  created_at: string;
  medecin_nom?: string;
  medecin_prenom?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DossierMedicalService {
  private readonly baseUrl = 'http://localhost:3001/api/dossiers';

  constructor(private http: HttpClient) {}

  getDossierByPatient(idPatient: number): Observable<{
    success: boolean;
    dossier: DossierMedical | null;
    notes: DossierMedicalNote[];
    analyses?: Analyse[];
    ordonnances?: Ordonnance[];
  }> {
    return this.http.get<{
      success: boolean;
      dossier: DossierMedical | null;
      notes: DossierMedicalNote[];
      analyses?: Analyse[];
      ordonnances?: Ordonnance[];
    }>(`${this.baseUrl}/patient/${idPatient}`);
  }

  upsertDossier(
    idPatient: number,
    payload: Partial<Pick<DossierMedical, 'groupe_sanguin' | 'antecedents_medicaux' | 'traitements_en_cours' | 'vaccinations'>>
  ): Observable<{ success: boolean; dossier: DossierMedical }> {
    return this.http.put<{ success: boolean; dossier: DossierMedical }>(`${this.baseUrl}/patient/${idPatient}`, payload);
  }

  ajouterNote(
    idPatient: number,
    payload: { idMedecin: number; contenu_note: string; type_note?: string }
  ): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.baseUrl}/patient/${idPatient}/notes`, payload);
  }

  ajouterAnalyse(
    idPatient: number,
    payload: {
      type_analyse: string;
      date_analyse: string;
      resultats?: string;
      laboratoire?: string;
      idMedecinPrescripteur?: number;
      notes?: string;
      url_document?: string;
    }
  ): Observable<{ success: boolean; message: string; idAnalyse?: number }> {
    return this.http.post<{ success: boolean; message: string; idAnalyse?: number }>(
      `${this.baseUrl}/patient/${idPatient}/analyses`,
      payload
    );
  }

  ajouterOrdonnance(
    idPatient: number,
    payload: {
      date_ordonnance: string;
      idMedecinPrescripteur?: number;
      medicaments: string;
      posologie?: string;
      duree_traitement?: string;
      notes?: string;
      url_document?: string;
    }
  ): Observable<{ success: boolean; message: string; idOrdonnance?: number }> {
    return this.http.post<{ success: boolean; message: string; idOrdonnance?: number }>(
      `${this.baseUrl}/patient/${idPatient}/ordonnances`,
      payload
    );
  }

  mettreAJourDiagnostic(
    idPatient: number,
    diagnostic: string
  ): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/patient/${idPatient}/diagnostic`,
      { diagnostic }
    );
  }

  // CRUD for Analyses
  mettreAJourAnalyse(
    idAnalyse: number,
    payload: {
      type_analyse: string;
      date_analyse: string;
      resultats?: string;
      laboratoire?: string;
      notes?: string;
      url_document?: string;
    }
  ): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/analyses/${idAnalyse}`,
      payload
    );
  }

  supprimerAnalyse(idAnalyse: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/analyses/${idAnalyse}`
    );
  }

  // CRUD for Ordonnances
  mettreAJourOrdonnance(
    idOrdonnance: number,
    payload: {
      date_ordonnance: string;
      medicaments: string;
      posologie?: string;
      duree_traitement?: string;
      notes?: string;
      url_document?: string;
    }
  ): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/ordonnances/${idOrdonnance}`,
      payload
    );
  }

  supprimerOrdonnance(idOrdonnance: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/ordonnances/${idOrdonnance}`
    );
  }

  // CRUD for Notes
  mettreAJourNote(
    idNote: number,
    payload: {
      contenu_note: string;
      type_note?: string;
    }
  ): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/notes/${idNote}`,
      payload
    );
  }

  supprimerNote(idNote: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.baseUrl}/notes/${idNote}`
    );
  }
}

