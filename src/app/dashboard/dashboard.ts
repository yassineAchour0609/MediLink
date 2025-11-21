import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Patient, Rendezvous } from './patient';
import { PatientService } from './patient-service';
import { AuthService } from '../login/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  id: number | null = null;
  user: Patient | null = null;
  rendezvous: Rendezvous[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.params['idp']); 
    this.loadPatientData();
  }

  loadPatientData() {
    if (this.id !== null) {
      this.patientService.getPatientById(this.id).subscribe(response => {
        if (response.success) {
          this.user = response.patient as Patient;
          console.log('User fetched successfully:', this.user);
        }
      });
    }
  }
  
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  
}
