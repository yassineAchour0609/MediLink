import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { DossierMedical, DossierMedicalNote, DossierMedicalService, Analyse, Ordonnance } from '../../dossier/dossier-medical.service';
import { PatientService } from '../../patient-service';

@Component({
  selector: 'app-medecin-dossier',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './medecin-dossier.html',
  styleUrl: './medecin-dossier.css'
})
export class MedecinDossierComponent implements OnInit {
  idMedecin: number | null = null;
  idPatient: number | null = null;
  patientInfo: any = null;

  dossier: DossierMedical | null = null;
  dossierNotes: DossierMedicalNote[] = [];
  analyses: Analyse[] = [];
  ordonnances: Ordonnance[] = [];

  // Forms and edit state (allowed for medecin on 3 entities)
  noteContent = '';
  editingNote: DossierMedicalNote | null = null;

  showAnalyseForm = false;
  editingAnalyse: Analyse | null = null;
  analyseForm = {
    type_analyse: '',
    date_analyse: '',
    resultats: '',
    laboratoire: '',
    notes: '',
    url_document: ''
  };

  showOrdonnanceForm = false;
  editingOrdonnance: Ordonnance | null = null;
  ordonnanceForm = {
    date_ordonnance: '',
    medicaments: '',
    posologie: '',
    duree_traitement: '',
    notes: '',
    url_document: ''
  };

  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dossierService: DossierMedicalService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.idMedecin = Number(this.route.parent?.snapshot.params['idMedecin']);
    
    // Listen to query params changes
    this.route.queryParams.subscribe(params => {
      const patientIdParam = params['patientId'];
      if (patientIdParam) {
        this.idPatient = Number(patientIdParam);
        this.loadPatientInfo();
        this.loadPatientDossier();
      } else {
        this.idPatient = null;
        this.dossier = null;
      }
    });
  }

  loadPatientInfo(): void {
    if (!this.idPatient) return;
    
    this.patientService.getPatientById(this.idPatient).subscribe({
      next: (response) => {
        if (response.success && response.patient) {
          this.patientInfo = response.patient;
        }
      },
      error: () => {
        // Patient info not critical, continue
      }
    });
  }

  loadPatientDossier(): void {
    if (!this.idPatient) return;

    this.loading = true;
    this.dossierService.getDossierByPatient(this.idPatient).subscribe({
      next: (response) => {
        this.dossier = response.dossier;
        this.dossierNotes = response.notes || [];
        this.analyses = response.analyses || [];
        this.ordonnances = response.ordonnances || [];
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de récupérer le dossier du patient.';
        this.loading = false;
      }
    });
  }

  // Notes - CRUD
  addNote(): void {
    if (!this.idPatient || !this.noteContent.trim() || !this.idMedecin) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.dossierService
      .ajouterNote(this.idPatient, {
        idMedecin: this.idMedecin,
        contenu_note: this.noteContent.trim()
      })
      .subscribe({
        next: () => {
          this.noteContent = '';
          this.loadPatientDossier();
          this.successMessage = 'Note ajoutée au dossier.';
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || "Impossible d'ajouter la note.";
        }
      });
  }

  editNote(note: DossierMedicalNote): void {
    this.editingNote = note;
    this.noteContent = note.contenu_note;
  }

  cancelEditNote(): void {
    this.editingNote = null;
    this.noteContent = '';
  }

  updateNote(): void {
    if (!this.editingNote || !this.noteContent.trim()) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.dossierService.mettreAJourNote(this.editingNote.idNote, {
      contenu_note: this.noteContent.trim()
    }).subscribe({
      next: () => {
        this.cancelEditNote();
        this.loadPatientDossier();
        this.successMessage = 'Note mise à jour.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || "Impossible de mettre à jour la note.";
      }
    });
  }

  deleteNote(note: DossierMedicalNote): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette note ?`)) {
      return;
    }

    this.dossierService.supprimerNote(note.idNote).subscribe({
      next: () => {
        this.loadPatientDossier();
        this.successMessage = 'Note supprimée.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || "Impossible de supprimer la note.";
      }
    });
  }

  // Analyses - CRUD
  openAnalyseForm(analyse?: Analyse): void {
    if (analyse) {
      this.editingAnalyse = analyse;
      this.analyseForm = {
        type_analyse: analyse.type_analyse,
        date_analyse: analyse.date_analyse,
        resultats: analyse.resultats || '',
        laboratoire: analyse.laboratoire || '',
        notes: analyse.notes || '',
        url_document: analyse.url_document || ''
      };
    } else {
      this.editingAnalyse = null;
      this.analyseForm = {
        type_analyse: '',
        date_analyse: '',
        resultats: '',
        laboratoire: '',
        notes: '',
        url_document: ''
      };
    }
    this.showAnalyseForm = true;
  }

  closeAnalyseForm(): void {
    this.showAnalyseForm = false;
    this.editingAnalyse = null;
    this.analyseForm = {
      type_analyse: '',
      date_analyse: '',
      resultats: '',
      laboratoire: '',
      notes: '',
      url_document: ''
    };
  }

  saveAnalyse(): void {
    if (!this.idPatient || !this.analyseForm.type_analyse || !this.analyseForm.date_analyse) {
      this.errorMessage = 'Les champs type d\'analyse et date sont obligatoires.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (this.editingAnalyse) {
      this.dossierService.mettreAJourAnalyse(this.editingAnalyse.idAnalyse, this.analyseForm).subscribe({
        next: () => {
          this.closeAnalyseForm();
          this.loadPatientDossier();
          this.successMessage = 'Analyse mise à jour.';
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || "Impossible de mettre à jour l'analyse.";
        }
      });
    } else {
      this.dossierService
        .ajouterAnalyse(this.idPatient, {
          ...this.analyseForm,
          idMedecinPrescripteur: this.idMedecin || undefined
        })
        .subscribe({
          next: () => {
            this.closeAnalyseForm();
            this.loadPatientDossier();
            this.successMessage = 'Analyse ajoutée au dossier.';
          },
          error: (error) => {
            this.errorMessage = error?.error?.message || "Impossible d'ajouter l'analyse.";
          }
        });
    }
  }

  deleteAnalyse(analyse: Analyse): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette analyse ?`)) {
      return;
    }

    this.dossierService.supprimerAnalyse(analyse.idAnalyse).subscribe({
      next: () => {
        this.loadPatientDossier();
        this.successMessage = 'Analyse supprimée.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || "Impossible de supprimer l'analyse.";
      }
    });
  }

  // Ordonnances - CRUD
  openOrdonnanceForm(ordonnance?: Ordonnance): void {
    if (ordonnance) {
      this.editingOrdonnance = ordonnance;
      this.ordonnanceForm = {
        date_ordonnance: ordonnance.date_ordonnance,
        medicaments: ordonnance.medicaments,
        posologie: ordonnance.posologie || '',
        duree_traitement: ordonnance.duree_traitement || '',
        notes: ordonnance.notes || '',
        url_document: ordonnance.url_document || ''
      };
    } else {
      this.editingOrdonnance = null;
      this.ordonnanceForm = {
        date_ordonnance: '',
        medicaments: '',
        posologie: '',
        duree_traitement: '',
        notes: '',
        url_document: ''
      };
    }
    this.showOrdonnanceForm = true;
  }

  closeOrdonnanceForm(): void {
    this.showOrdonnanceForm = false;
    this.editingOrdonnance = null;
    this.ordonnanceForm = {
      date_ordonnance: '',
      medicaments: '',
      posologie: '',
      duree_traitement: '',
      notes: '',
      url_document: ''
    };
  }

  saveOrdonnance(): void {
    if (!this.idPatient || !this.ordonnanceForm.date_ordonnance || !this.ordonnanceForm.medicaments || !this.idMedecin) {
      this.errorMessage = 'Les champs date, médicaments sont obligatoires.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    if (this.editingOrdonnance) {
      this.dossierService.mettreAJourOrdonnance(this.editingOrdonnance.idOrdonnance, this.ordonnanceForm).subscribe({
        next: () => {
          this.closeOrdonnanceForm();
          this.loadPatientDossier();
          this.successMessage = 'Ordonnance mise à jour.';
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || "Impossible de mettre à jour l'ordonnance.";
        }
      });
    } else {
      this.dossierService
        .ajouterOrdonnance(this.idPatient, {
          ...this.ordonnanceForm,
          idMedecinPrescripteur: this.idMedecin
        })
        .subscribe({
          next: () => {
            this.closeOrdonnanceForm();
            this.loadPatientDossier();
            this.successMessage = 'Ordonnance ajoutée au dossier.';
          },
          error: (error) => {
            this.errorMessage = error?.error?.message || "Impossible d'ajouter l'ordonnance.";
          }
        });
    }
  }

  deleteOrdonnance(ordonnance: Ordonnance): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer cette ordonnance ?`)) {
      return;
    }

    this.dossierService.supprimerOrdonnance(ordonnance.idOrdonnance).subscribe({
      next: () => {
        this.loadPatientDossier();
        this.successMessage = 'Ordonnance supprimée.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || "Impossible de supprimer l'ordonnance.";
      }
    });
  }
}


