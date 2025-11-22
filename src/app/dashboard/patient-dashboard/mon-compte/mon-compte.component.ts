import { Component } from '@angular/core';
import {  OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, NgForm, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../../profile-service.service';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-mon-compte',
  standalone: true,
  imports: [NgClass,DatePipe,ReactiveFormsModule ],
  templateUrl: './mon-compte.component.html',
  styleUrl: './mon-compte.component.css'
})
export class MonCompteComponent implements OnInit {
  @ViewChild('avatarInput') avatarInput!: ElementRef;

  activeTab = 'profile';
  isLoading = false;
  showSuccessAlert = false;
  showErrorAlert = false;
  successMessage = '';
  errorMessage = '';

  userData: any = {

  };

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  notifications: any[] = [];
  unreadNotifications = 0;

  preferences = {
    emailNotifications: true,
    pushNotifications: true,
    appointmentReminders: false,
    medicalNewsletter: true,
    publicProfile: true,
    dataSharing: false
  };

  constructor(
    private fb: FormBuilder,
    private profileService: ProfileService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadUserProfile();

  }

  initializeForms(): void {
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

loadUserProfile(): void {
  this.isLoading = true;
  this.profileService.getProfile().subscribe({
    next: (response) => {
      if (response.success && response.utilisateur) {
        this.userData = response.utilisateur;
        console.log('User data:', this.userData);
        this.populateProfileForm();
      }
      this.isLoading = false;
      console.log('Profile data loaded:', this.userData);
    },
    error: (error) => {
      console.error('Erreur lors du chargement du profil:', error);
      this.showError('Erreur lors du chargement du profil');
      this.isLoading = false;
    }
  });
}


  populateProfileForm(): void {
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

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

updateProfile(): void {
  if (this.profileForm.invalid || !this.userData) return;

  this.isLoading = true;
  const profileData: any = { ...this.profileForm.value };
  if (this.userData.role !== 'medecin') {
    delete profileData.specialite;
    delete profileData.cabinet;
    delete profileData.tarif_consultation;
    delete profileData.heure_ouverture;
    delete profileData.heure_fermeture;
    delete profileData.disponibilite;
  }
console.log('Données du formulaire avant envoi:', profileData);

const profile={
  ...profileData,
  age: new Date().getFullYear() - new Date(profileData.date_naissance).getFullYear()
}

  console.log('Données envoyées au backend:', profile);

  this.profileService.updateProfile(profile).subscribe({
    next: (response) => {
      if (response.success) {
        this.userData = { ...this.userData, ...profileData };
        this.showSuccess(response.message || 'Profil mis à jour avec succès');
      } else {
        this.showError(response.message || 'Erreur lors de la mise à jour');
      }
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Erreur mise à jour profil:', error);
      this.showError('Erreur lors de la mise à jour du profil');
      this.isLoading = false;
    }
  });
}

  changePassword(): void {
    if (this.passwordForm.invalid || !this.passwordsMatch()) return;

    this.isLoading = true;
    const passwordData ={
      ancienMotDePasse: this.passwordForm.get('currentPassword')?.value,
      nouveauMotDePasse: this.passwordForm.get('newPassword')?.value
    }

    this.profileService.changePassword(passwordData).subscribe({
      next: (response) => {
        if (response.success) {
          this.showSuccess('Mot de passe changé avec succès');
          this.passwordForm.reset();
        } else {
          this.showError(response.message || 'Erreur lors du changement de mot de passe');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur changement mot de passe:', error);
        this.showError('Erreur lors du changement de mot de passe');
        this.isLoading = false;
      }
    });
  }

  passwordsMatch(): boolean {
    const newPassword = this.passwordForm.get('newPassword')?.value;
    const confirmPassword = this.passwordForm.get('confirmPassword')?.value;
    return newPassword === confirmPassword;
  }

  getPasswordStrengthClass(): string {
    const password = this.passwordForm.get('newPassword')?.value;
    if (!password) return '';

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 1) return 'strength-weak';
    if (strength <= 3) return 'strength-medium';
    return 'strength-strong';
  }

  changeAvatar(): void {
    this.avatarInput.nativeElement.click();
  }


  togglePreference(preferenceKey: string): void {
    this.preferences[preferenceKey as keyof typeof this.preferences] =
      !this.preferences[preferenceKey as keyof typeof this.preferences];
  }




  getSpecialtyName(specialtyKey: string): string {
    const specialties: { [key: string]: string } = {
      'cardiology': 'Cardiologie',
      'neurology': 'Neurologie',
      'pediatrics': 'Pédiatrie',
      'surgery': 'Chirurgie',
      'dermatology': 'Dermatologie',
      'general': 'Médecine générale'
    };
    return specialties[specialtyKey] || specialtyKey;
  }




  showSuccess(message: string): void {
    this.successMessage = message;
    this.showSuccessAlert = true;
    setTimeout(() => {
      this.showSuccessAlert = false;
    }, 5000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.showErrorAlert = true;
    setTimeout(() => {
      this.showErrorAlert = false;
    }, 5000);
  }

  isMedecin(): boolean {
    return this.userData.role === 'medecin';
  }
}
