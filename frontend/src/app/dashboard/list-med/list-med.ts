import { Component, OnInit } from '@angular/core';
import { MedecinService } from './MedecinService';
import { Medecin } from './medecin';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

  

@Component({
  selector: 'app-list-med',
  imports: [FormsModule],
  templateUrl: './list-med.html',
  styleUrl: './list-med.css'
})
export class ListMed implements OnInit {
  medecins: Medecin[] = [];
  filteredMedecins: Medecin[] = [];
  loading = true;
  errorMessage = '';
  nbMedecins: number = 0;
  id: number | null = null;
  searchTerm: string = '';
  selectedSpecialty: string = 'Toutes spécialités';

  constructor(private medecinService: MedecinService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = Number(this.route.parent?.snapshot.params['idp']);
    console.log("Patient ID in ListMed:", this.id);
    this.loadMedecins();
    
  }

  loadMedecins() {
    this.medecinService.getAllMedecins().subscribe({
      next: (response) => {
        this.medecins = response.medecins;
        this.filteredMedecins = [...this.medecins];
        this.nbMedecins = this.medecins.length;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des médecins';
        console.error(err);
        this.loading = false;
      }
    });
  }
  filterMedecins() {
  this.filteredMedecins = this.medecins.filter(med => {
    const nom = med?.nom ?? '';
    const prenom = med?.prenom ?? '';
    const specialite = med?.specialite ?? '';

    const matchesSearch =
      nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      prenom.toLowerCase().includes(this.searchTerm.toLowerCase());

    const matchesSpecialty =
      this.selectedSpecialty === 'Toutes spécialités' ||
      specialite === this.selectedSpecialty;

    return matchesSearch && matchesSpecialty;
  });

  this.nbMedecins = this.filteredMedecins.length;
}
  Onrdv(idm: number) {
    console.log("rdv clicked");
    this.router.navigate(['/dashboard', this.id, 'prendre-rdv', idm]);
  }
}
