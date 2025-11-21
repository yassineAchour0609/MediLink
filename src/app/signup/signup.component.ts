import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../login/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent implements OnInit {

  userType: 'patient' | 'medecin' = 'patient';

  formData = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    dateNaissance: '',
    password: '',
    confirmPassword: '',
    sexe: 'femme',
    age: null as number | null,
    num_cin: '',
    // champs médecin
    specialite: '',
    cabinet: '',
    tarif_consultation: null as number | null,
    disponibilite: ''
  };


  newsletter = false;

  loading = false;
  errorMessage = '';
  successMessage = '';

  passwordStrengthText = 'Faible';
  passwordStrengthClass = 'strength-weak';

  constructor(
    private authService: AuthService,
    private router: Router,
    private renderer: Renderer2,
    private el: ElementRef
  ) {}

  ngOnInit(): void {
    // Gestion des boutons "Patient / Médecin" en mode Angular
    const buttons: NodeListOf<HTMLButtonElement> =
      this.el.nativeElement.querySelectorAll('.user-type-btn');

    buttons.forEach(btn => {
      this.renderer.listen(btn, 'click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.getAttribute('data-type');
        this.userType = (type === 'medecin') ? 'medecin' : 'patient';
      });
    });

  }

  // ======= Force du mot de passe (optionnel) =======
  onPasswordInput(): void {
    const pwd = this.formData.password || '';
    let score = 0;

    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) {
      this.passwordStrengthText = 'Faible';
      this.passwordStrengthClass = 'strength-weak';
    } else if (score === 2) {
      this.passwordStrengthText = 'Moyenne';
      this.passwordStrengthClass = 'strength-medium';
    } else {
      this.passwordStrengthText = 'Forte';
      this.passwordStrengthClass = 'strength-strong';
    }
  }

  onSubmit(form?: NgForm): void {
    this.errorMessage = '';
    this.successMessage = '';



    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.formData.dateNaissance) {
      this.errorMessage = 'La date de naissance est obligatoire.';
      return;
    }

    const birthDate = new Date(this.formData.dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.formData.age = age;

    const payload: any = {
      email: this.formData.email,
      motDePasse: this.formData.password,
      nom: this.formData.nom,
      prenom: this.formData.prenom,
      role: this.userType,
      sexe: this.formData.sexe, 
      age: this.formData.age,
      num_cin: this.formData.num_cin || null,
      date_naissance: this.formData.dateNaissance,
      telephone: this.formData.telephone,
    };

    if (this.userType === 'medecin') {
      if (!this.formData.specialite || !this.formData.cabinet || !this.formData.tarif_consultation) {
          this.errorMessage = 'Veuillez remplir tous les champs professionnels.';
          return;
      }
      payload.specialite = this.formData.specialite;
      payload.cabinet = this.formData.cabinet;
      payload.tarif_consultation = this.formData.tarif_consultation;
      payload.disponibilite = this.formData.disponibilite || 1;
    }

    this.loading = true;

    this.authService.signup(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (res && res.success) {
          this.successMessage = 'Compte créé avec succès. Vous pouvez maintenant vous connecter.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1000);
        } else {
          this.errorMessage = res?.message || 'Erreur lors de la création du compte.';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        this.errorMessage = err.error?.error || err.error?.message || 'Erreur serveur.';
      }
    });
  }
}
