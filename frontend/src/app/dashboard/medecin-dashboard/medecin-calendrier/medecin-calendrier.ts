import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MedecinService } from '../../list-med/MedecinService';
import { PatientService } from '../../patient-service';

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

interface CalendarDay {
  date: Date;
  isToday: boolean;
  otherMonth: boolean;
  appointments: RendezvousItem[];
}

@Component({
  selector: 'app-medecin-calendrier',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './medecin-calendrier.html',
  styleUrl: './medecin-calendrier.css'
})
export class MedecinCalendrierComponent implements OnInit {
  idMedecin: number | null = null;
  rendezvous: RendezvousItem[] = [];
  rendezvousLoading = false;

  // Calendar
  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  calendarDays: CalendarDay[] = [];
  daysOfWeek = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  selectedDay: CalendarDay | null = null;
  
  // Edit RDV
  showEditModal = false;
  editingRdv: RendezvousItem | null = null;
  editDate = '';
  editHeure = '';

  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medecinService: MedecinService,
    private patientService: PatientService
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
        this.rendezvous.sort((a, b) => {
          if (a.date === today && b.date !== today) return -1;
          if (a.date !== today && b.date === today) return 1;
          if (a.date === b.date) {
            return a.heure.localeCompare(b.heure);
          }
          return a.date.localeCompare(b.date);
        });
        
        this.generateCalendar();
        this.rendezvousLoading = false;
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les rendez-vous.';
        this.rendezvousLoading = false;
      }
    });
  }

  generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    this.calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const appointmentsForDay = this.rendezvous.filter(rdv => {
        if (!rdv.date) return false;
        const rdvDate = new Date(rdv.date);
        return rdvDate.toDateString() === date.toDateString();
      });

      this.calendarDays.push({
        date,
        isToday: date.toDateString() === new Date().toDateString(),
        otherMonth: date.getMonth() !== this.currentMonth,
        appointments: appointmentsForDay
      });
    }
  }

  previousMonth(): void {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  get currentMonthName(): string {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[this.currentMonth];
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
  }

  selectRendezvous(rdv: RendezvousItem): void {
    // Navigate to dossier with patient ID
    this.router.navigate(['/medecin', this.idMedecin, 'dossier'], {
      queryParams: { patientId: rdv.idPatient }
    });
  }

  openEditModal(rdv: RendezvousItem): void {
    this.editingRdv = rdv;
    this.editDate = rdv.date;
    this.editHeure = rdv.heure;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.editingRdv = null;
    this.editDate = '';
    this.editHeure = '';
  }

  updateRdv(): void {
    if (!this.editingRdv || !this.editDate || !this.editHeure || !this.idMedecin) {
      return;
    }

    this.patientService.updateRdv({
      idRdv: this.editingRdv.idRdv,
      date: this.editDate,
      heure: this.editHeure,
      idMedecin: this.idMedecin,
      idPatient: this.editingRdv.idPatient,
      statut: this.editingRdv.statut
    }).subscribe({
      next: () => {
        this.successMessage = 'Rendez-vous modifié avec succès.';
        this.closeEditModal();
        this.loadRendezvous();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || "Impossible de modifier le rendez-vous.";
      }
    });
  }

  annulerRdv(rdv: RendezvousItem): void {
    if (!confirm('Confirmer l\'annulation de ce rendez-vous ?')) {
      return;
    }

    this.patientService.annulerRendezvous(rdv.idRdv).subscribe({
      next: () => {
        this.successMessage = 'Rendez-vous annulé avec succès.';
        this.loadRendezvous();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || "Impossible d'annuler le rendez-vous.";
      }
    });
  }

  // UI helpers for day coloring
  isAnnuleDay(day: CalendarDay): boolean {
    if (!day || !day.appointments || day.appointments.length === 0) return false;
    return day.appointments.some(a => a.statut === 'Annulé');
  }

  isPrevuDay(day: CalendarDay): boolean {
    if (!day || !day.appointments || day.appointments.length === 0) return false;
    return day.appointments.some(a => a.statut !== 'Annulé');
  }
}


