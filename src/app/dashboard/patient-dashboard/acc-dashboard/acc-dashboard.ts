import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Patient, Rendezvous } from '../../patient';
import { PatientService } from '../../patient-service';
import { MedicalService } from '../../medical.service';

interface DashboardStats {
  totalRdv: number;
  rdvToday: number;
  rdvMonth: number;
  ordonnances: number;
  analyses: number;
}

interface ActivityItem {
  iconClass: string;
  icon: string;
  title: string;
  timeLabel: string;
  statusLabel: string;
  statusClass: string;
}

@Component({
  selector: 'app-acc-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './acc-dashboard.html',
  styleUrl: './acc-dashboard.css'
})
export class AccDashboard implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private medicalService = inject(MedicalService);

  user = signal<Patient | null>(null);
  patientId: number | null = null;

  stats = signal<DashboardStats>({
    totalRdv: 0,
    rdvToday: 0,
    rdvMonth: 0,
    ordonnances: 0,
    analyses: 0
  });

  highlightMessage = signal('');
  recentActivity = signal<ActivityItem[]>([]);

  rendezvous: Rendezvous[] = [];

  ngOnInit(): void {
    this.patientId = Number(this.route.parent?.snapshot.params['idp']);
    if (Number.isFinite(this.patientId)) {
      this.loadData(this.patientId!);
    }
  }

  private loadData(idPatient: number) {
    this.patientService.getPatientById(idPatient).subscribe({
      next: res => res.success && this.user.set(res.patient),
      error: err => console.error('Erreur patient', err)
    });

    this.patientService.getRendezvousByPatientId(idPatient).subscribe({
      next: res => {
        if (res.success) {
          this.rendezvous = res.rendezvous || [];
          this.computeStats();
        }
      },
      error: err => console.error('Erreur RDV', err)
    });

    this.medicalService.getDossierByPatient(idPatient).subscribe({
      next: res => {
        if (res.success) {
          this.stats.update(prev => ({
            ...prev,
            ordonnances: res.ordonnances?.length ?? 0,
            analyses: res.analyses?.length ?? 0
          }));
          this.buildHighlight();
          this.buildActivity(res.ordonnances ?? [], res.analyses ?? []);
        }
      },
      error: err => console.error('Erreur dossier', err)
    });
  }

  private computeStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

    const rdvToday = this.rendezvous.filter(r => this.isSameDay(r.date, startOfDay)).length;
    const rdvMonth = this.rendezvous.filter(r => {
      const date = this.parseDate(r.date, r.heure);
      return date >= startOfMonth && date <= endOfMonth;
    }).length;

    const totalRdv = this.rendezvous.length;

    this.stats.update(prev => ({
      ...prev,
      totalRdv,
      rdvToday,
      rdvMonth
    }));

    this.buildHighlight();
  }

  private buildHighlight() {
    const s = this.stats();
    this.highlightMessage.set(
      `Vous avez ${s.rdvToday} rendez-vous programmés aujourd'hui et ${s.analyses} analyses enregistrées.`
    );
  }

  private buildActivity(ordonnances: any[], analyses: any[]) {
    const activities: ActivityItem[] = [];

    // 1) RDV à venir (max 3)
    const rdvUpcoming = this.rendezvous
      .map(r => ({ ...r, dateTime: this.parseDate(r.date, r.heure) }))
      .filter(r => r.dateTime >= new Date())
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .slice(0, 3);

    rdvUpcoming.forEach(r => {
      activities.push({
        iconClass: 'activity-icon appointment',
        icon: 'fas fa-calendar-check',
        title: `Rendez-vous - Dr ${r.medecinPrenom ?? ''} ${r.medecinNom ?? ''}`.trim(),
        timeLabel: this.formatDateTime(r.dateTime),
        statusLabel: r.statut ?? 'Prévu',
        statusClass: (r.statut || '').toLowerCase() === 'annulé' ? 'status-pending' : 'status-completed'
      });
    });

    // 2) Dernière ordonnance
    if (ordonnances.length > 0) {
      const ordonnance = ordonnances[0];
      activities.push({
        iconClass: 'activity-icon prescription',
        icon: 'fas fa-prescription-bottle-alt',
        title: `Ordonnance du ${this.formatDate(ordonnance.date_ordonnance)}`,
        timeLabel: ordonnance.medecinPrenom && ordonnance.medecinNom
          ? `Dr ${ordonnance.medecinPrenom} ${ordonnance.medecinNom}`
          : 'Ordonnance enregistrée',
        statusLabel: 'Validé',
        statusClass: 'status-completed'
      });
    }

    // 3) Dernière analyse
    if (analyses.length > 0) {
      const analyse = analyses[0];
      activities.push({
        iconClass: 'activity-icon lab',
        icon: 'fas fa-microscope',
        title: `${analyse.type_analyse}`,
        timeLabel: `Résultats du ${this.formatDate(analyse.date_analyse)}`,
        statusLabel: 'À examiner',
        statusClass: 'status-pending'
      });
    }

    this.recentActivity.set(activities);
  }

  private parseDate(date?: string, heure?: string) {
    if (!date) return new Date(0);
    const time = heure ?? '00:00';
    return new Date(`${date}T${time}`);
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

  // Navigation methods for action cards
  navigateToNewRdv() {
    if (this.patientId) {
      this.router.navigate(['/dashboard', this.patientId, 'list-med']);
    }
  }

  navigateToOrdonnance() {
    if (this.patientId) {
      this.router.navigate(['/dashboard', this.patientId, 'dossier']);
    }
  }

  navigateToAnalyse() {
    if (this.patientId) {
      this.router.navigate(['/dashboard', this.patientId, 'dossier']);
    }
  }

  navigateToMessagerie() {
    if (this.patientId) {
      this.router.navigate(['/dashboard', this.patientId, 'messagerie']);
    }
  }
}
