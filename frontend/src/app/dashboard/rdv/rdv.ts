import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../patient-service';
import { Patient, Rendezvous } from '../patient';
import { Medecin } from '../list-med/medecin';
import { MedecinService } from '../list-med/MedecinService';


interface CalendarDay {
  date: Date;
  isToday: boolean;
  otherMonth: boolean;
  appointments: Rendezvous[];
}
@Component({
  selector: 'app-rdv',
  imports: [FormsModule, DatePipe],
  templateUrl: './rdv.html',
  styleUrl: './rdv.css'
})
export class Rdv implements OnInit {
  currentMonth = new Date().getMonth(); // Mois courant (0-11)
  currentYear = new Date().getFullYear(); // Année courante
  daysOfWeek = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']; // Jours de la semaine
  calendarDays: CalendarDay[] = []; // Tableau des jours à afficher
  selectedDay: CalendarDay | null = null; // Jour sélectionné

  id: number | null = null;
  rdv: Rendezvous[] = [];
  medecin!:Medecin;

  constructor(
    private route: ActivatedRoute, 
    private router: Router,
    private patientService: PatientService,
    private medecinService: MedecinService
  ) {}

  ngOnInit(): void {
    this.id = this.route.parent?.snapshot.params['idp'];
    this.loadRendezvous();
  }

  // Fonction pour récupérer les rendez-vous et charger les médecins associés
  loadRendezvous() {
  if (this.id !== null) {
    this.patientService.getRendezvousByPatientId(this.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.rdv = response.rendezvous;
          // Pour chaque rendez-vous, récupérer les infos du médecin
          this.rdv.forEach((r, index) => {
            if(r.idMedecin){
              this.medecinService.getMedecinById(r.idMedecin).subscribe({
                next: (med) => {
                  this.medecin=med.medecin;
                  console.log(this.medecin)
                },
              })
            }
          });
          // Génère le calendrier après avoir récupéré les rendez-vous
          this.generateCalendar();
        }
      },
      error: (err) => console.error('Erreur chargement rendezvous:', err)
    });
  }
}


  // Génère les 42 jours du calendrier pour le mois courant
  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Commence à afficher le premier jour de la semaine

    this.calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Filtre les rendez-vous pour ce jour
      const appointmentsForDay = this.rdv.filter(a => {
        if (!a.date) return false;
        const apptDate = new Date(a.date);
        return apptDate.toDateString() === date.toDateString();
      });

      this.calendarDays.push({
        date,
        isToday: date.toDateString() === new Date().toDateString(),
        otherMonth: date.getMonth() !== this.currentMonth,
        appointments: appointmentsForDay
      });
    }
  }

  // Naviguer au mois précédent
  previousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  // Naviguer au mois suivant
  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  // Sélection d'un jour
  selectDay(day: CalendarDay) {
    this.selectedDay = day;
  }

  // Nom du mois affiché
  get currentMonthName(): string {
    return new Date(this.currentYear, this.currentMonth, 1)
      .toLocaleDateString('fr-FR', { month: 'long' });
  }

  // Annuler un rendez-vous
  annulerRdv(appt: Rendezvous): void {
    if (confirm("Voulez-vous vraiment annuler ce rendez-vous ?")) {
      this.patientService.annulerRendezvous(appt.idRdv!).subscribe({
        next: (res) => {
          alert("Rendez-vous annulé avec succès !");
          this.loadRendezvous(); // Recharge les rendez-vous
        },
        error: (err) => console.error("Erreur :", err)
      });
    }
  }

  // Variables pour modal de modification
  showEditModal = false;
  editDate: string = '';
  editHeure: string = '';
  rdvToEdit: any = null;

  // Ouvre la modal pour modifier un rendez-vous
  openModal(appt: any) {
    this.showEditModal = true;
    this.rdvToEdit = appt;
    this.editDate = appt.date;
    this.editHeure = appt.heure;
  }

  // Ferme la modal
  closeModal() {
    this.showEditModal = false;
    this.rdvToEdit = null;
  }

  // Met à jour un rendez-vous
  updateRdv() {
    if (!this.rdvToEdit) return;

    const updatedRdv = {
      ...this.rdvToEdit,
      date: this.editDate,
      heure: this.editHeure,
    };
    console.log('Updating rendez-vous with data:', updatedRdv);

    this.patientService.updateRdv(updatedRdv).subscribe({
      next: res => {
        console.log('Rendez-vous mis à jour:', res);
        this.closeModal();
        this.loadRendezvous(); // Recharge le calendrier avec les rendez-vous mis à jour
      },
      error: err => alert(err.error.message || 'Une erreur est survenue lors de la prise de rendez-vous.')
    });
  }

  // Naviguer vers le dossier médical
  goToDossier(): void {
    if (this.id) {
      this.router.navigate(['/dashboard', this.id, 'dossier-medical']);
    }
  }
}