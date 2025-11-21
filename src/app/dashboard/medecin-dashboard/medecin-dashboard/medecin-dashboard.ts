import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MedicalService } from '../../medical.service';
import { MedecinService } from '../../patient-dashboard/list-med/MedecinService';
import { Medecin } from '../../patient-dashboard/list-med/medecin';
import { MedecinSidebar } from '../medecin-sidebar/medecin-sidebar';

interface DashboardStats {
  totalRdv: number;
  rdvToday: number;
  rdvUpcoming: number;
}

interface ActivityItem {
  iconClass: string;
  icon: string;
  title: string;
  timeLabel: string;
  statusLabel: string;
  statusClass: string;
  patientId?: number;
}

@Component({
  selector: 'app-medecin-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './medecin-dashboard.html',
  styleUrl: './medecin-dashboard.css'
})
export class MedecinDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private medicalService = inject(MedicalService);
  private medecinService = inject(MedecinService);

  doctor = signal<Medecin | null>(null);
  idMedecin: number | null = null;

  stats = signal<DashboardStats>({
    totalRdv: 0,
    rdvToday: 0,
    rdvUpcoming: 0
  });

  highlightMessage = signal('');
  recentActivity = signal<ActivityItem[]>([]);

  rendezvous: any[] = [];

  ngOnInit(): void {
    this.idMedecin = Number(this.route.snapshot.params['idm']);
    if (Number.isFinite(this.idMedecin)) {
      this.loadData(this.idMedecin!);
    }
  }

  private loadData(idMedecin: number) {
    this.medecinService.getMedecinById(idMedecin).subscribe({
      next: res => this.doctor.set(res.medecin ?? null),
      error: err => console.error('Erreur medecin', err)
    });

    this.medicalService.getRendezvousByMedecin(idMedecin).subscribe({
      next: res => {
        const items = res.rendezvous ?? [];
        // Normalize to a consistent shape as used by the calendar
        this.rendezvous = items.map((it: any) => ({
          idRdv: it.idRdv ?? it.idrdv ?? it.id,
          idPatient: it.idPatient ?? it.id_patient ?? it.patientId ?? it.idpatient,
          patientNom: it.patientNom ?? it.nomPatient ?? it.nom ?? '',
          patientPrenom: it.patientPrenom ?? it.prenomPatient ?? it.prenom ?? '',
          date: it.date ?? it.date_rdv ?? it.dateRdv,
          heure: it.heure ?? it.heure_rdv ?? it.heureRdv,
          statut: it.statut ?? 'prévu',
          _raw: it
        }));
        this.computeStats();
        this.buildActivity();
      },
      error: err => console.error('Erreur RDV médecin', err)
    });
  }

  private computeStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const rdvToday = this.rendezvous.filter(r => this.isSameDay(r.date, startOfDay)).length;
    const now = new Date();
    const rdvUpcoming = this.rendezvous
      .filter(r => (r.statut || '').toLowerCase() !== 'annulé')
      .map(r => this.parseDate(r.date, r.heure))
      .filter(d => d.getTime() > now.getTime()).length;

    const totalRdv = this.rendezvous.length;

    this.stats.update(prev => ({
      ...prev,
      totalRdv,
      rdvToday,
      rdvUpcoming
    }));

    this.buildHighlight();
  }

  private buildHighlight() {
    const s = this.stats();
    this.highlightMessage.set(
      `Vous avez ${s.rdvToday} rendez-vous programmés aujourd'hui et ${s.rdvUpcoming} rendez-vous à venir.`
    );
  }

  private buildActivity() {
    const activities: ActivityItem[] = [];
    const now = new Date();

    // Upcoming first
    let items = this.rendezvous
      .map(r => ({ ...r, dateTime: this.parseDate(r.date, r.heure) }))
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

    let selected = items.filter(r => r.dateTime >= now).slice(0, 3);

    // Fallback to recent past if no upcoming
    if (selected.length === 0) {
      selected = items
        .filter(r => r.dateTime < now)
        .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())
        .slice(0, 3);
    }

    selected.forEach(r => {
      const patientName = [r.patientPrenom ?? '', r.patientNom ?? ''].join(' ').trim() || 'Patient';
      const isPast = r.dateTime < now;
      activities.push({
        iconClass: 'activity-icon appointment',
        icon: isPast ? 'fas fa-clock' : 'fas fa-calendar-check',
        title: `Rendez-vous - ${patientName}`,
        timeLabel: this.formatDateTime(r.dateTime),
        statusLabel: isPast ? 'Passé' : (r.statut ?? 'Prévu'),
        statusClass: isPast
          ? 'status-pending'
          : (r.statut || '').toLowerCase() === 'annulé' ? 'status-pending' : 'status-completed',
        patientId: (r.idPatient ?? r.id_patient) as number | undefined
      });
    });

    this.recentActivity.set(activities);
  }

  private parseDate(date?: string, heure?: string) {
    if (!date) return new Date(0);
    // If ISO string with time provided, trust it directly
    if (date.includes('T')) {
      const iso = new Date(date);
      if (!isNaN(iso.getTime())) return iso;
    }
    // Normalize time (handle '8:00' -> '08:00', add seconds if missing)
    let t = (heure || '00:00').trim();
    const parts = t.split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const s = parts[2] ? parts[2].padStart(2, '0') : '00';
      t = `${h}:${m}:${s}`;
    }
    const combined = new Date(`${date}T${t}`);
    if (!isNaN(combined.getTime())) return combined;
    // Fallback
    const onlyDate = new Date(date);
    return isNaN(onlyDate.getTime()) ? new Date(0) : onlyDate;
  }

  private isSameDay(dateStr: string | undefined, day: Date) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return (
      date.getFullYear() === day.getFullYear() &&
      date.getMonth() === day.getMonth() &&
      date.getDate() === day.getDate()
    );
  }

  private formatDate(dateStr: string) {
    if (!dateStr) return 'Date inconnue';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private formatDateTime(date: Date) {
    if (!date || isNaN(date.getTime())) return 'Date inconnue';
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
