import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../../profile-service.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-mon-compte',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule],
  templateUrl: './mon-compte.component.html',
  styleUrl: './mon-compte.component.css'
})
export class MonCompteComponent implements OnInit {
  activeTab = 'profile';
  isLoading = false;
  showSuccessAlert = false;
  showErrorAlert = false;
  successMessage = '';
  errorMessage = '';

  userData: any = {};

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.initialiserFormulaires();
    this.chargerProfilUtilisateur();
  }

  private initialiserFormulaires(): void {
    this.profileForm = this.fb.group({
      prenom: ['', [Validators.required]],
      nom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      date_naissance: [''],
      sexe: [''],
      num_cin: [''],
      specialite: [''],
      cabinet: [''],
      tarif_consultation: ['', [Validators.min(0)]],
      heure_ouverture: [''],
      heure_fermeture: [''],
      disponibilite: [false]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  private chargerProfilUtilisateur(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (response) => {
        if (response.success && response.utilisateur) {
          this.userData = response.utilisateur;
          console.log('User data:', this.userData);
          this.remplirFormulaireProfil();
        }
        this.isLoading = false;
        console.log('Profile data loaded:', this.userData);
      },
      error: (error) => {
        console.error('Erreur lors du chargement du profil:', error);
        this.afficherErreur('Erreur lors du chargement du profil');
        this.isLoading = false;
      }
    });
  }

  private remplirFormulaireProfil(): void {
    this.profileForm.patchValue({
      prenom: this.userData.prenom,
      nom: this.userData.nom,
      email: this.userData.email,
      telephone: this.userData.telephone,
      date_naissance: this.userData.date_naissance,
      sexe: this.userData.sexe,
      num_cin: this.userData.num_cin,
      specialite: this.userData.specialite,
      cabinet: this.userData.cabinet,
      tarif_consultation: this.userData.tarif_consultation,
      heure_ouverture: this.userData.heure_ouverture,
      heure_fermeture: this.userData.heure_fermeture,
      disponibilite: this.userData.disponibilite
    });
  }

  definirOngletActif(onglet: string): void {
    this.activeTab = onglet;
  }

  mettreAJourProfil(): void {
    if (this.profileForm.invalid || !this.userData) return;

    this.isLoading = true;
    const donneesProfil: any = { ...this.profileForm.value };

    if (this.userData.role !== 'medecin') {
      delete donneesProfil.specialite;
      delete donneesProfil.cabinet;
      delete donneesProfil.tarif_consultation;
      delete donneesProfil.heure_ouverture;
      delete donneesProfil.heure_fermeture;
      delete donneesProfil.disponibilite;
    }

    console.log('Données du formulaire avant envoi:', donneesProfil);

    const profil = {
      ...donneesProfil,
      age:
        donneesProfil.date_naissance
          ? new Date().getFullYear() - new Date(donneesProfil.date_naissance).getFullYear()
          : undefined
    };

    console.log('Données envoyées au backend:', profil);

    this.profileService.updateProfile(profil).subscribe({
      next: (response) => {
        if (response.success) {
          this.userData = { ...this.userData, ...donneesProfil };
          this.afficherSucces(response.message || 'Profil mis à jour avec succès');
        } else {
          this.afficherErreur(response.message || 'Erreur lors de la mise à jour');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur mise à jour profil:', error);
        this.afficherErreur('Erreur lors de la mise à jour du profil');
        this.isLoading = false;
      }
    });
  }

  changerMotDePasse(): void {
    if (this.passwordForm.invalid || !this.motsDePasseIdentiques()) return;

    this.isLoading = true;
    const donneesMotDePasse = {
      ancienMotDePasse: this.passwordForm.get('currentPassword')?.value,
      nouveauMotDePasse: this.passwordForm.get('newPassword')?.value
    };

    this.profileService.changePassword(donneesMotDePasse).subscribe({
      next: (response) => {
        if (response.success) {
          this.afficherSucces('Mot de passe changé avec succès');
          this.passwordForm.reset();
        } else {
          this.afficherErreur(response.message || 'Erreur lors du changement de mot de passe');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur changement mot de passe:', error);
        this.afficherErreur('Erreur lors du changement de mot de passe');
        this.isLoading = false;
      }
    });
  }

  motsDePasseIdentiques(): boolean {
    const nouveauMotDePasse = this.passwordForm.get('newPassword')?.value;
    const confirmation = this.passwordForm.get('confirmPassword')?.value;
    return nouveauMotDePasse === confirmation;
  }

  obtenirClasseForceMotDePasse(): string {
    const motDePasse = this.passwordForm.get('newPassword')?.value;
    if (!motDePasse) return '';

    let force = 0;
    if (motDePasse.length >= 8) force++;
    if (/[a-z]/.test(motDePasse) && /[A-Z]/.test(motDePasse)) force++;
    if (/[0-9]/.test(motDePasse)) force++;
    if (/[^a-zA-Z0-9]/.test(motDePasse)) force++;

    if (force <= 1) return 'strength-weak';
    if (force <= 3) return 'strength-medium';
    return 'strength-strong';
  }

  obtenirNomSpecialite(cleSpecialite: string): string {
    const specialites: { [key: string]: string } = {
      cardiology: 'Cardiologie',
      neurology: 'Neurologie',
      pediatrics: 'Pédiatrie',
      surgery: 'Chirurgie',
      dermatology: 'Dermatologie',
      general: 'Médecine générale'
    };
    return specialites[cleSpecialite] || cleSpecialite;
  }

  private afficherSucces(message: string): void {
    this.successMessage = message;
    this.showSuccessAlert = true;
    setTimeout(() => {
      this.showSuccessAlert = false;
    }, 5000);
  }

  private afficherErreur(message: string): void {
    this.errorMessage = message;
    this.showErrorAlert = true;
    setTimeout(() => {
      this.showErrorAlert = false;
    }, 5000);
  }
}
