import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DossierMedical, DossierMedicalNote, DossierMedicalService, Analyse, Ordonnance } from './dossier-medical.service';

@Component({
  selector: 'app-dossier-medical',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './dossier-medical.html',
  styleUrl: './dossier-medical.css'
})
export class DossierMedicalComponent implements OnInit {
  idPatient: number | null = null;
  dossier: DossierMedical | null = null;
  notes: DossierMedicalNote[] = [];
  analyses: Analyse[] = [];
  ordonnances: Ordonnance[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  showInfoForm = false;
  infoForm = {
    groupe_sanguin: '',
    antecedents_medicaux: '',
    traitements_en_cours: '',
    vaccinations: ''
  };

  analyseForm = {
    type_analyse: '',
    date_analyse: '',
    resultats: '',
    laboratoire: '',
    notes: '',
    url_document: ''
  };

  showAnalyseForm = false;
  editingAnalyse: Analyse | null = null;

  constructor(private route: ActivatedRoute, private dossierService: DossierMedicalService) {}

  ngOnInit(): void {
    this.idPatient = Number(this.route.parent?.snapshot.params['idp']);
    if (this.idPatient) {
      this.loadDossier();
    }
  }

  loadDossier(): void {
    if (!this.idPatient) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.dossierService.getDossierByPatient(this.idPatient).subscribe({
      next: (response) => {
        this.dossier = response.dossier;
        this.notes = response.notes || [];
        this.analyses = response.analyses || [];
        this.ordonnances = response.ordonnances || [];
        this.populateInfoForm();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Impossible de charger le dossier médical.';
      }
    });
  }

  // Analyses CRUD (Patient can add/edit/delete their own analyses)
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
      // Update
      this.dossierService.mettreAJourAnalyse(this.editingAnalyse.idAnalyse, this.analyseForm).subscribe({
        next: () => {
          this.closeAnalyseForm();
          this.loadDossier();
          this.successMessage = 'Analyse mise à jour avec succès.';
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || "Impossible de mettre à jour l'analyse.";
        }
      });
    } else {
      // Create
      this.dossierService.ajouterAnalyse(this.idPatient, this.analyseForm).subscribe({
        next: () => {
          this.closeAnalyseForm();
          this.loadDossier();
          this.successMessage = 'Analyse ajoutée avec succès.';
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
        this.loadDossier();
        this.successMessage = 'Analyse supprimée avec succès.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || "Impossible de supprimer l'analyse.";
      }
    });
  }

  // Ordonnances - READ ONLY for patients
  // Patients can only view ordonnances, not add/edit/delete them

  // Informations principales - patient can edit
  populateInfoForm(): void {
    this.infoForm = {
      groupe_sanguin: this.dossier?.groupe_sanguin || '',
      antecedents_medicaux: this.dossier?.antecedents_medicaux || '',
      traitements_en_cours: this.dossier?.traitements_en_cours || '',
      vaccinations: this.dossier?.vaccinations || ''
    };
  }

  openInfoForm(): void {
    this.populateInfoForm();
    this.showInfoForm = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelInfoForm(): void {
    this.showInfoForm = false;
    this.populateInfoForm();
  }

  saveInfoForm(): void {
    if (!this.idPatient) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.dossierService
      .upsertDossier(this.idPatient, { ...this.infoForm })
      .subscribe({
        next: (response) => {
          this.dossier = response.dossier;
          this.populateInfoForm();
          this.showInfoForm = false;
          this.successMessage = 'Informations principales mises à jour.';
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Impossible de mettre à jour les informations.';
        }
      });
  }
}
