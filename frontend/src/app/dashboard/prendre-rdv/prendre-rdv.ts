import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Medecin } from '../list-med/medecin';
import { MedecinService } from '../list-med/MedecinService';
import { PatientService } from '../patient-service';

@Component({
  selector: 'app-prendre-rdv',
  imports: [FormsModule],
  templateUrl: './prendre-rdv.html',
  styleUrl: './prendre-rdv.css'
})
export class PrendreRdv implements OnInit {
  id: number | null = null;
  idm: number | null = null;
  medecin: Medecin | null = null;
  selectedDate: string = '';
  selectedHeure: string = '';
  statut: string = 'En attente';
  minDate: string = '';
  openingTime: string = '08:00';
  closingTime: string = '19:00';
  timeSlots: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private medecinService: MedecinService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.parent?.snapshot.params['idp']);
    this.idm = Number(this.route.snapshot.params['idm']);
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    if (this.idm) {
      this.loadMedecin(this.idm);
    }
  }

  private loadMedecin(idMedecin: number): void {
    this.medecinService.getMedecinById(idMedecin).subscribe({
      next: (response) => {
        if (response.success) {
          this.medecin = response.medecin;
          this.openingTime = this.normaliseTime(this.medecin?.heure_ouverture) || this.openingTime;
          this.closingTime = this.normaliseTime(this.medecin?.heure_fermeture) || this.closingTime;
          this.timeSlots = this.generateTimeSlots(this.openingTime, this.closingTime);
          if (this.timeSlots.length > 0) {
            this.selectedHeure = this.timeSlots[0];
          }
        }
      },
      error: (err) => console.error('Erreur lors du chargement du médecin :', err)
    });
  }

  private normaliseTime(timeValue?: string | null): string | null {
    if (!timeValue) {
      return null;
    }

    const [hours, minutes] = timeValue.split(':');
    const safeHours = (hours ?? '00').padStart(2, '0');
    const safeMinutes = (minutes ?? '00').padStart(2, '0');
    return `${safeHours}:${safeMinutes}`;
  }

  private generateTimeSlots(openingTime: string, closingTime: string): string[] {
    const slots: string[] = [];
    const start = this.timeToMinutes(openingTime);
    const end = this.timeToMinutes(closingTime);

    if (end < start) {
      // Overnight schedules are unsupported côté front pour l'instant
      return slots;
    }

    for (let minutes = start; minutes <= end; minutes += 30) {
      const hours = Math.floor(minutes / 60)
        .toString()
        .padStart(2, '0');
      const mins = (minutes % 60).toString().padStart(2, '0');
      slots.push(`${hours}:${mins}`);
    }
    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map((value) => Number(value));
    return hours * 60 + minutes;
  }
  submitRdv(): void {
  // Vérifier que tous les champs obligatoires sont remplis
  if (!this.idm) {
    console.error('Aucun médecin sélectionné');
    return;
  }
  if (!this.selectedDate) {
    console.error('Date manquante');
    return;
  }
  if (!this.selectedHeure) {
    console.error('Heure manquante');
    return;
  }
  if (this.id === null) {
    console.error('ID du patient manquant');
    return;
  }

  // Construire l'objet Rendezvous
  const newRdv = {
    idMedecin: this.idm,
    idPatient: this.id,
    date: this.selectedDate,
    heure: this.selectedHeure,
    statut: 'prévu'
  };

  // Appel au service
  this.patientService.prendreRdv(newRdv).subscribe({
    next: (res : any) => {
      console.log('Réponse du serveur :', res);
      if (res.success) {
        console.log('Rendez-vous créé avec succès :', res.rendezvous);
        alert('Votre rendez-vous a été pris !');
        // Optionnel : redirection ou reset du formulaire
      } else {
        console.error('Erreur lors de la création du rendez-vous');

      }
    },
    error: (err) => {
       alert(err.error.message || 'Une erreur est survenue lors de la prise de rendez-vous.');
      console.error('Erreur serveur :', err);
    }
  });
}
}
