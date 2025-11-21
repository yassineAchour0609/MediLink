import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Medecin } from '../list-med/medecin';
import { MedecinService } from '../list-med/MedecinService';
import { PatientService } from '../../patient-service';

@Component({
  selector: 'app-prendre-rdv',
  imports: [FormsModule, CommonModule],
  templateUrl: './prendre-rdv.html',
  styleUrl: './prendre-rdv.css'
})
export class PrendreRdv implements OnInit {
  id: number | null = null;
  idm: number | null = null;
  medecins: Medecin[] = [];
  selectedMedecinId!: number;
  selectedDate!: string;
  selectedHeure!: string;
  statut: string = 'En attente';
  minDate: string = '';
  medecin: Medecin | null = null;
  heureOuverture: string = '08:00';
  heureFermeture: string = '19:00';
  minTime: string = '08:00';
  maxTime: string = '19:00';
  
  constructor(private route: ActivatedRoute,private medecinService: MedecinService, private patientService: PatientService) {}

  ngOnInit(): void {
    this.id = Number(this.route.parent?.snapshot.params['idp']);
    this.idm = Number(this.route.snapshot.params['idm']);
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    // Charger les informations du médecin pour obtenir les heures d'ouverture/fermeture
    if (this.idm) {
      this.medecinService.getMedecinById(this.idm).subscribe({
        next: (response) => {
          if (response.success && response.medecin) {
            this.medecin = response.medecin;
            this.heureOuverture = response.medecin.heure_ouverture || '08:00';
            this.heureFermeture = response.medecin.heure_fermeture || '19:00';
            // Extraire seulement HH:MM pour les attributs min/max
            this.minTime = this.heureOuverture.substring(0, 5);
            this.maxTime = this.heureFermeture.substring(0, 5);
          }
        },
        error: (err) => {
          console.error('Erreur lors du chargement du médecin:', err);
        }
      });
    }
  }
  submitRdv(): void {
  // Vérifier que tous les champs obligatoires sont remplis
  if (!this.idm) {
    console.error('Aucun médecin sélectionné');
    alert('Aucun médecin sélectionné');
    return;
  }
  if (!this.selectedDate) {
    console.error('Date manquante');
    alert('Veuillez sélectionner une date');
    return;
  }
  if (!this.selectedHeure) {
    console.error('Heure manquante');
    alert('Veuillez sélectionner une heure');
    return;
  }
  if (this.id === null) {
    console.error('ID du patient manquant');
    return;
  }

  // Valider que l'heure est dans les heures d'ouverture
  const heureRdv = this.selectedHeure.substring(0, 5); // Format HH:MM
  if (heureRdv < this.minTime || heureRdv >= this.maxTime) {
    alert(`Le rendez-vous doit être pris entre ${this.minTime} et ${this.maxTime}`);
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
    next: (res) => {
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
