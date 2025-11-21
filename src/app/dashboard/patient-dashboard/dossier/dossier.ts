import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MedicalService } from '../../medical.service';
import { MedecinSidebar } from '../../medecin-dashboard/medecin-sidebar/medecin-sidebar';

@Component({
  selector: 'app-dossier',
  imports: [CommonModule, ReactiveFormsModule, DatePipe, MedecinSidebar, RouterLink],
  templateUrl: './dossier.html',
  styleUrl: './dossier.css'
})
export class Dossier implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private medicalService = inject(MedicalService);

  idPatient!: number;
  idMedecin: number | null = null;

  dossier = signal<any | null>(null);
  analyses = signal<any[]>([]);
  ordonnances = signal<any[]>([]);
  notes = signal<any[]>([]);
  hasAnyData = computed(() => {
    return !!this.dossier() ||
      this.analyses().length > 0 ||
      this.ordonnances().length > 0 ||
      this.notes().length > 0;
  });

  isMedecin() {
    return this.idMedecin !== null;
  }
  isPatient() {
    return this.idMedecin === null;
  }
  canEditInfos() {
    return this.isMedecin() ? false : this.isPatient();
  }
  canManageAnalyses() {
    return this.isMedecin() ? false : this.isPatient();
  }
  canManageOrdonnances() {
    return this.isMedecin();
  }
  canManageNotes() {
    return this.isMedecin();
  }

  infoForm = this.fb.nonNullable.group({
    groupe_sanguin: ['', [
      Validators.pattern(/^(A|B|AB|O)[+-]$/)
    ]],
    antecedents_medicaux: ['', [Validators.maxLength(1000)]],
    traitements_en_cours: ['', [Validators.maxLength(1000)]],
    vaccinations: ['', [Validators.maxLength(500)]],
    diagnostic: ['', [Validators.maxLength(2000)]]
  });

  analyseForm = this.fb.nonNullable.group({
    type_analyse: ['', Validators.required],
    date_analyse: ['', Validators.required],
    resultats: [''],
    laboratoire: [''],
    notes: [''],
    url_document: ['']
  });

  ordonnanceForm = this.fb.nonNullable.group({
    date_ordonnance: ['', Validators.required],
    medicaments: ['', Validators.required],
    posologie: [''],
    duree_traitement: [''],
    notes: [''],
    url_document: ['']
  });

  noteForm = this.fb.nonNullable.group({
    type_note: ['Consultation'],
    contenu_note: ['', Validators.required]
  });

  editingAnalyseId = signal<number | null>(null);
  editingOrdonnanceId = signal<number | null>(null);
  editingNoteId = signal<number | null>(null);
  loading = signal(false);
  showAnalyseForm = signal(false);
  showOrdonnanceForm = signal(false);
  showNoteForm = signal(false);

  ngOnInit(): void {
    const paramMap = this.route.snapshot.paramMap;
    const parentParamMap = this.route.parent?.snapshot.paramMap;

    const patientRaw =
      paramMap.get('idPatient') ??
      parentParamMap?.get('idPatient') ??
      parentParamMap?.get('idp') ??
      this.route.snapshot.queryParamMap.get('idPatient');
    const parsedPatient = patientRaw !== null ? Number(patientRaw) : NaN;
    this.idPatient = Number.isFinite(parsedPatient) ? parsedPatient : 0;

    const medecinRaw =
      paramMap.get('idm') ??
      parentParamMap?.get('idm') ??
      this.route.snapshot.queryParamMap.get('idm');
    const parsedMedecin = medecinRaw !== null ? Number(medecinRaw) : NaN;
    this.idMedecin = Number.isFinite(parsedMedecin) ? parsedMedecin : null;

    this.load();
  }

  isInfoFieldInvalid(fieldName: string): boolean {
    const field = this.infoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  load() {
    this.loading.set(true);
    const options = this.idMedecin !== null ? { idMedecin: this.idMedecin } : undefined;
    this.medicalService.getDossierByPatient(this.idPatient, options).subscribe({
      next: res => {
        this.dossier.set(res.dossier);
        this.analyses.set(res.analyses);
        this.ordonnances.set(res.ordonnances);
        this.notes.set(res.notes);
        this.infoForm.patchValue({
          groupe_sanguin: res.dossier?.groupe_sanguin ?? '',
          antecedents_medicaux: res.dossier?.antecedents_medicaux ?? '',
          traitements_en_cours: res.dossier?.traitements_en_cours ?? '',
          vaccinations: res.dossier?.vaccinations ?? '',
          diagnostic: res.dossier?.diagnostic ?? ''
        });
      },
      error: err => console.error(err),
      complete: () => this.loading.set(false)
    });
  }

  // Recherche patient par nom pour médecins
  patientQuery = this.fb.nonNullable.control('');
  searchResults = signal<Array<{ id: number; nom: string; prenom: string; telephone: string }>>([]);
  searching = signal(false);

  searchPatients() {
    const q = this.patientQuery.value.trim();
    if (q.length < 2) {
      this.searchResults.set([]);
      return;
    }
    this.searching.set(true);
    this.medicalService.searchPatientsByName(q).subscribe({
      next: res => this.searchResults.set(res.results || []),
      error: () => this.searchResults.set([]),
      complete: () => this.searching.set(false)
    });
  }

  saveInfos() {
    if (!this.canEditInfos()) {
      alert('Vous ne pouvez pas modifier ces informations.');
      return;
    }
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      alert('Veuillez corriger les erreurs dans le formulaire (ex: Groupe sanguin invalide).');
      return;
    }
    this.medicalService.updateDossierInfos(this.idPatient, this.infoForm.getRawValue()).subscribe({
      next: () => this.load(),
      error: err => alert(err.error?.message || 'Erreur de mise à jour')
    });
  }

  submitAnalyse() {
    if (!this.canManageAnalyses()) {
      alert('Action non autorisée.');
      return;
    }
    if (this.analyseForm.invalid) {
      this.analyseForm.markAllAsTouched();
      return;
    }
    const payload = {
      ...this.analyseForm.getRawValue(),
      idMedecin: this.idMedecin
    };
    const idEditing = this.editingAnalyseId();
    const request = idEditing
      ? this.medicalService.updateAnalyse(this.idPatient, idEditing, payload)
      : this.medicalService.addAnalyse(this.idPatient, payload);

    request.subscribe({
      next: () => {
        this.analyseForm.reset({
          type_analyse: '',
          date_analyse: '',
          resultats: '',
          laboratoire: '',
          notes: '',
          url_document: ''
        });
        this.editingAnalyseId.set(null);
        this.showAnalyseForm.set(false);
        this.load();
      },
      error: err => alert(err.error?.message || 'Erreur lors de l\'enregistrement de l\'analyse')
    });
  }

  editAnalyse(analyse: any) {
    if (!this.canManageAnalyses()) return;
    this.showAnalyseForm.set(true);
    this.editingAnalyseId.set(analyse.idAnalyse);
    this.analyseForm.patchValue({
      type_analyse: analyse.type_analyse,
      date_analyse: analyse.date_analyse ? analyse.date_analyse.substring(0, 10) : '',
      resultats: analyse.resultats ?? '',
      laboratoire: analyse.laboratoire ?? '',
      notes: analyse.notes ?? '',
      url_document: analyse.url_document ?? ''
    });
  }

  deleteAnalyse(analyse: any) {
    if (!this.canManageAnalyses()) return;
    if (!confirm('Supprimer cette analyse ?')) return;
    this.medicalService.deleteAnalyse(this.idPatient, analyse.idAnalyse).subscribe({
      next: () => this.load(),
      error: err => alert(err.error?.message || 'Suppression impossible')
    });
  }

  cancelAnalyseEdit() {
    this.editingAnalyseId.set(null);
    this.showAnalyseForm.set(false);
    this.analyseForm.reset({
      type_analyse: '',
      date_analyse: '',
      resultats: '',
      laboratoire: '',
      notes: '',
      url_document: ''
    });
  }

  toggleAnalyseForm() {
    this.showAnalyseForm.set(!this.showAnalyseForm());
    if (!this.showAnalyseForm()) {
      this.cancelAnalyseEdit();
    }
  }

  submitOrdonnance() {
    if (!this.canManageOrdonnances()) {
      alert('Action réservée au médecin.');
      return;
    }
    if (this.ordonnanceForm.invalid) {
      this.ordonnanceForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.ordonnanceForm.getRawValue(),
      idMedecin: this.idMedecin
    };

    const idEditing = this.editingOrdonnanceId();
    const request = idEditing
      ? this.medicalService.updateOrdonnance(this.idPatient, idEditing, payload)
      : this.medicalService.addOrdonnance(this.idPatient, payload);

    request.subscribe({
      next: () => {
        this.ordonnanceForm.reset({
          date_ordonnance: '',
          medicaments: '',
          posologie: '',
          duree_traitement: '',
          notes: '',
          url_document: ''
        });
        this.editingOrdonnanceId.set(null);
        this.showOrdonnanceForm.set(false);
        this.load();
      },
      error: err => alert(err.error?.message || 'Erreur lors de l\'enregistrement de l\'ordonnance')
    });
  }

  editOrdonnance(ordo: any) {
    if (!this.canManageOrdonnances()) return;
    this.showOrdonnanceForm.set(true);
    this.editingOrdonnanceId.set(ordo.idOrdonnance);
    this.ordonnanceForm.patchValue({
      date_ordonnance: ordo.date_ordonnance ? ordo.date_ordonnance.substring(0, 10) : '',
      medicaments: ordo.medicaments,
      posologie: ordo.posologie ?? '',
      duree_traitement: ordo.duree_traitement ?? '',
      notes: ordo.notes ?? '',
      url_document: ordo.url_document ?? ''
    });
  }

  deleteOrdonnance(ordo: any) {
    if (!this.canManageOrdonnances()) return;
    if (!confirm('Supprimer cette ordonnance ?')) return;
    this.medicalService.deleteOrdonnance(this.idPatient, ordo.idOrdonnance).subscribe({
      next: () => this.load(),
      error: err => alert(err.error?.message || 'Suppression impossible')
    });
  }

  cancelOrdonnanceEdit() {
    this.editingOrdonnanceId.set(null);
    this.showOrdonnanceForm.set(false);
    this.ordonnanceForm.reset({
      date_ordonnance: '',
      medicaments: '',
      posologie: '',
      duree_traitement: '',
      notes: '',
      url_document: ''
    });
  }

  toggleOrdonnanceForm() {
    this.showOrdonnanceForm.set(!this.showOrdonnanceForm());
    if (!this.showOrdonnanceForm()) {
      this.cancelOrdonnanceEdit();
    }
  }

  submitNote() {
    if (!this.canManageNotes()) {
      alert('Action réservée au médecin.');
      return;
    }
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }
    const payload = {
      ...this.noteForm.getRawValue(),
      idMedecin: this.idMedecin
    };

    const idEditing = this.editingNoteId();
    const request = idEditing
      ? this.medicalService.updateNote(this.idPatient, idEditing, payload)
      : this.medicalService.addNote(this.idPatient, payload);

    request.subscribe({
      next: () => {
        this.noteForm.reset({ type_note: 'Consultation', contenu_note: '' });
        this.editingNoteId.set(null);
        this.showNoteForm.set(false);
        this.load();
      },
      error: err => alert(err.error?.message || 'Erreur lors de l\'enregistrement de la note')
    });
  }

  editNote(note: any) {
    if (!this.canManageNotes()) return;
    this.showNoteForm.set(true);
    this.editingNoteId.set(note.idNote);
    this.noteForm.patchValue({
      type_note: note.type_note ?? 'Consultation',
      contenu_note: note.contenu_note ?? ''
    });
  }

  deleteNote(note: any) {
    if (!this.canManageNotes()) return;
    if (!confirm('Supprimer cette note ?')) return;
    this.medicalService.deleteNote(this.idPatient, note.idNote).subscribe({
      next: () => this.load(),
      error: err => alert(err.error?.message || 'Suppression impossible')
    });
  }

  cancelNoteEdit() {
    this.editingNoteId.set(null);
    this.showNoteForm.set(false);
    this.noteForm.reset({ type_note: 'Consultation', contenu_note: '' });
  }

  toggleNoteForm() {
    this.showNoteForm.set(!this.showNoteForm());
    if (!this.showNoteForm()) {
      this.cancelNoteEdit();
    }
  }
}
