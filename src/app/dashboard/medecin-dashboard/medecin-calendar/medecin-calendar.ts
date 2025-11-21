import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicalService } from '../../medical.service';
import { PatientService } from '../../patient-service';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  otherMonth: boolean;
  appointments: any[];
}

@Component({
  selector: 'app-medecin-calendar',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FormsModule],
  templateUrl: './medecin-calendar.html',
  styleUrl: './medecin-calendar.css'
})
export class MedecinCalendar implements OnInit {
  idMedecin!: number;
  rendezvous: any[] = [];

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medicalService: MedicalService,
    private patientService: PatientService,
  ) {}

  ngOnInit(): void {
    this.idMedecin = Number(this.route.snapshot.params['idm']);
    this.load();
  }

  load() {
    this.medicalService.getRendezvousByMedecin(this.idMedecin).subscribe({
      next: r => {
        const items = r.rendezvous ?? [];
        // Normalize fields to align with patient RDV component expectations
        this.rendezvous = items.map((it: any) => ({
          idRdv: it.idRdv ?? it.idrdv ?? it.id,
          idPatient: it.idPatient ?? it.id_patient ?? it.patientId ?? it.idpatient,
          patientNom: it.patientNom ?? it.nomPatient ?? it.nom ?? '',
          patientPrenom: it.patientPrenom ?? it.prenomPatient ?? it.prenom ?? '',
          date: it.date,
          heure: it.heure,
          statut: it.statut ?? 'prévu',
          // keep raw for any extra usage
          _raw: it
        }));
        this.generateCalendar();
      }
    });
  }

  private parseDate(date?: string, heure?: string) {
    if (!date) return new Date(0);
    const time = heure ?? '00:00';
    return new Date(`${date}T${time}`);
  }

  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const startDate = new Date(firstDay);
    // Align with patient calendar start-of-week logic
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    this.calendarDays = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Same day filter as patient RDV: compare by date only
      const appointments = this.rendezvous.filter(a => {
        if (!a.date) return false;
        const apptDate = new Date(a.date);
        return apptDate.toDateString() === date.toDateString();
      });

      this.calendarDays.push({
        date,
        isToday: date.toDateString() === new Date().toDateString(),
        otherMonth: date.getMonth() !== this.currentMonth,
        appointments
      });
    }

    this.selectedDay = this.calendarDays.find(day => day.isToday) ?? this.calendarDays[0] ?? null;
  }

  get currentMonthLabel(): string {
    return new Date(this.currentYear, this.currentMonth, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  previousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day;
  }

  annuler(idRdv: number) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    this.medicalService.annulerRendezvous(idRdv).subscribe({
      next: () => this.load()
    });
  }

  // Modal modification
  showEditModal = false;
  editDate: string = '';
  editHeure: string = '';
  rdvToEdit: any = null;

  openModal(appt: any) {
    this.showEditModal = true;
    this.rdvToEdit = appt;
    this.editDate = appt.date;
    this.editHeure = appt.heure;
  }

  closeModal() {
    this.showEditModal = false;
    this.rdvToEdit = null;
  }

  modifier() {
    if (!this.rdvToEdit) return;
    const payload = {
      idRdv: this.rdvToEdit.idRdv ?? this.rdvToEdit.idrdv ?? this.rdvToEdit.id,
      date: this.editDate,
      heure: this.editHeure
    };
    this.patientService.updateRdv(payload).subscribe({
      next: () => {
        this.closeModal();
        this.load();
      },
      error: err => alert(err?.error?.message || 'Erreur lors de la modification du rendez-vous.')
    });
  }

  ouvrirDossier(idPatient: number) {
    this.router.navigate(['/medecin', this.idMedecin, 'patient', idPatient, 'dossier']);
  }
}

