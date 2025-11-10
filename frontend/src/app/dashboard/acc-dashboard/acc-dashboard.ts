import { Component, OnInit, OnDestroy } from '@angular/core';
import { Patient } from '../patient';
import { ActivatedRoute, Router } from '@angular/router';
import { PatientService } from '../patient-service';
import { DatePipe, NgClass } from '@angular/common';

@Component({
  selector: 'app-acc-dashboard',
  imports: [DatePipe, NgClass],
  templateUrl: './acc-dashboard.html',
  styleUrl: './acc-dashboard.css'
})
export class AccDashboard implements OnInit, OnDestroy {
  user: Patient | null = null;
  id: number | null = null;
  currentTime: Date = new Date();
  timeInterval: any;

  // Dashboard statistics
  stats = {
    appointmentsToday: 0,
    appointmentsThisMonth: 0,
    upcomingAppointments: 0,
    pendingAnalysis: 0
  };
  loading = true;
  activitiesLoading = true;
  activities: any[] = [];

  constructor(private route: ActivatedRoute, private patientService: PatientService, private router: Router) {}

  ngOnInit(): void {
    this.id = this.route.parent?.snapshot.params['idp'];
    this.loadPatientData();
    this.loadDashboardStats();
    this.loadRecentActivities();
    this.startClock();
  }

  // Quick actions navigation
  private navigateTo(childPath: string): void {
    if (this.id !== null) {
      this.router.navigate(['/dashboard', this.id, childPath]);
    }
  }

  goToNewRdv(): void {
    // Let patient choose a doctor first
    this.navigateTo('list-med');
  }

  goToOrdonnance(): void {
    // View ordonnances within dossier medical
    this.navigateTo('dossier-medical');
  }

  goToAnalyse(): void {
    // View analyses within dossier medical
    this.navigateTo('dossier-medical');
  }

  goToTeleconsultation(): void {
    // Entry point via list of medecins
    this.navigateTo('list-med');
  }

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  startClock(): void {
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  updateTime(): void {
    this.currentTime = new Date();
  }

  loadPatientData() {
    if (this.id !== null) {
      this.patientService.getPatientById(this.id).subscribe(response => {
        if (response.success) {
          this.user = response.patient as Patient;
        }
      });
    }
  }

  loadDashboardStats() {
    if (this.id !== null) {
      this.loading = true;
      this.patientService.getDashboardStats(this.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.stats = response.stats;
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading dashboard stats:', err);
          this.loading = false;
        }
      });
    }
  }

  loadRecentActivities() {
    if (this.id !== null) {
      this.activitiesLoading = true;
      this.patientService.getRecentActivities(this.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.activities = response.activities.map(activity => {
              // Format time for appointments
              if (activity.type === 'appointment' && activity.date) {
                const appointmentDate = new Date(`${activity.date}T${activity.heure || '00:00:00'}`);
                const now = new Date();
                const diffMs = appointmentDate.getTime() - now.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffDays < 0) {
                  // Past appointment
                  const daysAgo = Math.abs(diffDays);
                  if (daysAgo === 0) {
                    activity.time = "Aujourd'hui";
                  } else if (daysAgo === 1) {
                    activity.time = "Hier";
                  } else {
                    activity.time = `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`;
                  }
                } else if (diffDays === 0) {
                  activity.time = "Aujourd'hui";
                } else if (diffDays === 1) {
                  activity.time = `Demain à ${activity.heure || ''}`;
                } else {
                  activity.time = `Dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                }
              }
              return activity;
            });
          }
          this.activitiesLoading = false;
        },
        error: (err) => {
          console.error('Error loading recent activities:', err);
          this.activitiesLoading = false;
        }
      });
    }
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'prévu': 'Confirmé',
      'Confirmé': 'Confirmé',
      'Terminé': 'Terminé',
      'Annulé': 'Annulé',
      'completed': 'Terminé',
      'pending': 'À examiner',
      'Validé': 'Validé'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    if (status === 'prévu' || status === 'Confirmé' || status === 'completed' || status === 'Validé') {
      return 'status-completed';
    } else if (status === 'pending' || status === 'À examiner') {
      return 'status-pending';
    } else if (status === 'Terminé') {
      return 'status-completed';
    }
    return 'status-pending';
  }
}
