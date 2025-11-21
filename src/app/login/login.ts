import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  error = signal<string | null>(null);
  loading = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required]
  });

  submit() {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      this.error.set("Veuillez vérifier vos informations (champs obligatoires ou email invalide).");
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const { email, motDePasse } = this.form.getRawValue();
    this.auth.login(email, motDePasse).subscribe({
      next: res => {
        const user = res.utilisateur;
        if (!user) {
          this.error.set('Utilisateur non trouvé');
          return;
        }
        if(user.role === 'admin'){
          this.router.navigate(['/admin', user.idUtilisateur, 'admin-dashboard']);
          return;
        }
        if (user.role === 'medecin') {
          this.router.navigate(['/medecin', user.idUtilisateur, 'dashboard']);
        } else {
          this.router.navigate(['/dashboard', user.idUtilisateur]);
        }
      },
      error: err => {
        console.log(err);
        if (err.status === 404) {
            this.error.set("Aucun compte n'est associé à cet email.");
        } else if (err.status === 401) {
            this.error.set("Mot de passe incorrect.");
        } else {
            const message = err.error?.message || 'Erreur de connexion';
            this.error.set(message);
        }
        
        this.loading.set(false);
      },
      complete: () => this.loading.set(false)
    });
  }
}
