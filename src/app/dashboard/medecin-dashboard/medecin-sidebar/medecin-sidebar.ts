import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { MedecinService } from '../../patient-dashboard/list-med/MedecinService';
import { Medecin } from '../../patient-dashboard/list-med/medecin';

@Component({
  selector: 'app-medecin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink,RouterOutlet],
  templateUrl: './medecin-sidebar.html',
  styleUrl: './medecin-sidebar.css'
})
export class MedecinSidebar {
  idMedecin: number;
  doctor = signal<Medecin | null>(null);

  constructor(private route: ActivatedRoute, private medecinService: MedecinService) {
    this.idMedecin = Number(this.route.snapshot.params['idm']);
    if (Number.isFinite(this.idMedecin)) {
      this.medecinService.getMedecinById(this.idMedecin).subscribe(res => {
        this.doctor.set(res.medecin ?? null);
      });
    }
  }
}

