import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { Medecin } from '../list-med/medecin';
import { MedecinService } from '../list-med/MedecinService';

@Component({
  selector: 'app-medecin-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './medecin-dashboard.html',
  styleUrl: './medecin-dashboard.css'
})
export class MedecinDashboardComponent implements OnInit {
  idMedecin: number | null = null;
  medecin: Medecin | null = null;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medecinService: MedecinService
  ) {}

  ngOnInit(): void {
    this.idMedecin = Number(this.route.snapshot.params['idMedecin']);

    if (!this.idMedecin) {
      this.errorMessage = 'Identifiant médecin manquant.';
      return;
    }

    this.loadMedecin();
  }

  private loadMedecin(): void {
    if (!this.idMedecin) {
      return;
    }

    this.medecinService.getMedecinById(this.idMedecin).subscribe({
      next: (response) => {
        if (response.success && response.medecin) {
          this.medecin = response.medecin;
          this.errorMessage = '';
        } else {
          this.errorMessage = 'Médecin introuvable.';
        }
      },
      error: (error) => {
        console.error('Error loading medecin:', error);
        this.errorMessage = error?.error?.message || 'Impossible de charger les informations du médecin.';
      }
    });
  }

  retourAccueil(): void {
    this.router.navigate(['/login']);
  }
}


