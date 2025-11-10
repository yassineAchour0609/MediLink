import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MedecinService } from '../../list-med/MedecinService';

interface RendezvousItem {
  idRdv: number;
  date: string;
  heure: string;
  statut: string;
  idPatient: number;
  patientNom: string;
  patientPrenom: string;
  patientTelephone?: string;
}

@Component({
  selector: 'app-medecin-accueil',
  standalone: true,
  imports: [],
  templateUrl: './medecin-accueil.html',
  styleUrl: './medecin-accueil.css'
})
export class MedecinAccueilComponent implements OnInit {
  idMedecin: number | null = null;
  rendezvous: RendezvousItem[] = [];
  rendezvousLoading = false;
  stats = {
    today: 0,
    upcoming: 0,
    total: 0
  };

  constructor(
    private route: ActivatedRoute,
    private medecinService: MedecinService
  ) {}

  ngOnInit(): void {
    this.idMedecin = Number(this.route.parent?.snapshot.params['idMedecin']);
    this.loadRendezvous();
  }

  loadRendezvous(): void {
    if (!this.idMedecin) {
      return;
    }

    this.rendezvousLoading = true;
    this.medecinService.getRendezVous(this.idMedecin).subscribe({
      next: (response) => {
        this.rendezvous = response.rendezvous as RendezvousItem[];
        const today = new Date().toISOString().split('T')[0];
        
        // Calculate statistics
        this.stats.total = this.rendezvous.length;
        this.stats.today = this.rendezvous.filter(rdv => rdv.date === today && rdv.statut !== 'Annulé').length;
        this.stats.upcoming = this.rendezvous.filter(rdv => rdv.date > today && rdv.statut !== 'Annulé').length;
        
        if (response.stats) {
          this.stats.today = response.stats.today || this.stats.today;
          this.stats.upcoming = response.stats.upcoming || this.stats.upcoming;
        }
        
        this.rendezvousLoading = false;
      },
      error: () => {
        this.rendezvousLoading = false;
      }
    });
  }
}


