import { Component, inject, OnInit } from '@angular/core';
import { AdminService } from '../../../admin-service.service';
import { ActivatedRoute } from '@angular/router';

interface Admin {
  nom: string;
  prenom: string;
}
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit{
  admin = { nom: 'Admin', prenom: 'MediLink' };
  stats: any = {};
  rdvStats: any = {};
  topSpecialites: any[] = [];
  statsPercent: any = { doctors: 0, patients: 0 };
  loading = true;
  error = '';
 id: number | null = null;
  constructor(private adminService: AdminService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.parent?.snapshot.params['id']);
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.adminService.getAdminStats().subscribe({
      next: (res) => {
        console.log('Admin stats response:', res);
        this.stats = {
          totalUsers: res.totalUsers,
          totalDoctors: res.totalDoctors,
          totalPatients: res.totalPatients,
          rdvToday: res.rdvToday
        };
        this.rdvStats = res.rdvStats;
        this.topSpecialites = res.topSpecialites;

        const total = this.stats.totalDoctors + this.stats.totalPatients;
        this.statsPercent.doctors = total ? Math.round((this.stats.totalDoctors / total) * 100) : 0;
        this.statsPercent.patients = total ? Math.round((this.stats.totalPatients / total) * 100) : 0;

        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Erreur lors du chargement des statistiques';
        this.loading = false;
      }
    });
  }

  get adminHighlightMessage() {
    return `Total utilisateurs : ${this.stats.totalUsers || 0}, rendez-vous aujourd'hui : ${this.stats.rdvToday || 0}`;
  }
}


