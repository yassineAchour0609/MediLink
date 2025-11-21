import { Component } from '@angular/core';
import { AdminService } from '../../../admin-service.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

interface Medecin {
  idUtilisateur: number;
  nom: string;
  prenom: string;
  email?: string;
  specialite?: string;
  statut?: string;
  bloque?: boolean;
}

@Component({
  selector: 'app-medecins',
  standalone: true,
  imports: [FormsModule ],
  templateUrl: './medecins.component.html',
  styleUrl: './medecins.component.css'
})
export class MedecinsComponent {
openAddPatientModal() {
throw new Error('Method not implemented.');
}
  medecins: Medecin[] = [];
  filteredMedecins: Medecin[] = [];
  loading = true;
  error = '';
  searchTerm = '';

  constructor(private adminService: AdminService, private router: Router) {}

  ngOnInit(): void {
    this.loadMedecins();
  }

  loadMedecins() {
    this.loading = true;
    this.adminService.getAllMedecinsWithBlockStatus().subscribe({
      next: (res) => {
        console.log('Médecins avec statut : ', res);
        this.medecins = res;
        this.filteredMedecins = res;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement médecins :', err);
        this.error = 'Erreur lors du chargement des médecins';
        this.loading = false;
      }
    });
  }

  search() {
    const term = this.searchTerm.toLowerCase();
    this.filteredMedecins = this.medecins.filter(m =>
      m.nom.toLowerCase().includes(term) ||
      m.prenom.toLowerCase().includes(term) ||
      (m.specialite || '').toLowerCase().includes(term)
    );
  }

  onSearch(): void {
    this.search();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.search();
  }

  viewMedecinDetails(medecin: Medecin) {
    this.router.navigate(['/admin/medecins', medecin.idUtilisateur]);
  }

  // 🔒 Bloquer un médecin
  blockMedecin(medecin: Medecin) {
    if (!confirm(`Voulez-vous vraiment bloquer le compte du Dr ${medecin.nom} ${medecin.prenom} ?`)) {
      return;
    }

    this.adminService.blockAccount(medecin.idUtilisateur, 'Compte médecin bloqué par admin').subscribe({
      next: (res) => {
        console.log('Compte bloqué :', res);
        medecin.bloque = true;
        medecin.statut = 'Bloqué';
      },
      error: (err) => {
        console.error('Erreur lors du blocage du compte :', err);
        alert('Erreur lors du blocage du compte.');
      }
    });
  }

  // 🔓 Débloquer un médecin
  unblockMedecin(medecin: Medecin) {
    if (!confirm(`Voulez-vous débloquer le compte du Dr ${medecin.nom} ${medecin.prenom} ?`)) {
      return;
    }

    this.adminService.unblockAccount(medecin.idUtilisateur).subscribe({
      next: (res) => {
        console.log('Compte débloqué :', res);
        medecin.bloque = false;
        medecin.statut = 'Actif';
      },
      error: (err) => {
        console.error('Erreur lors du déblocage du compte :', err);
        alert('Erreur lors du déblocage du compte.');
      }
    });
  }
   getInitials(nom: string, prenom: string): string {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
  }
}
