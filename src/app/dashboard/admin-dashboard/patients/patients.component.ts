import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../admin-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, NgIf, NgFor, NgClass } from '@angular/common';
import { map, switchMap, forkJoin, of } from 'rxjs';

interface Patient {
  id: string | number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  medecinTraitant?: string;
  dateInscription: Date;
  statut: 'actif' | 'inactif' | 'nouveau' | string;
  bloque?: boolean;
  statutBlocage?: 'Bloqué' | 'Actif';
  motDePasse ?: string;
  date_naissance ?: Date;
}

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [FormsModule,NgClass],
  templateUrl: './patients.component.html',
  styleUrls: ['./patients.component.css']
})
export class PatientsComponent implements OnInit {
  loading = false;
  error: string | null = null;
  id:number | null = null;

  patients: Patient[] = [];
  filteredPatients: Patient[] = [];

  searchTerm = '';
  statusFilter = '';
  sortBy: 'nom' | 'dateInscription' | 'medecinTraitant' = 'nom';

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  showAddPatientForm = false;
  newPatient: Partial<Patient> = {
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    statut: 'actif',
    dateInscription: new Date()
  };

  constructor(
    private adminService: AdminService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.parent?.snapshot.params['id']);
    this.fetchPatients();
  }

  fetchPatients(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getAllPatients().pipe(
      switchMap((res: any) => {
        const patientsBase: Patient[] = (res || []).map((u: any): Patient => ({
          id: u.idUtilisateur ?? u.id ?? '',
          nom: u.nom || '',
          prenom: u.prenom || '',
          email: u.email || '',
          telephone: u.telephone || '',
          medecinTraitant: u.medecinTraitant || '',
          dateInscription: u.dateInscription ? new Date(u.dateInscription) : new Date(),
          statut: (u.statut as any) || 'actif',
          bloque: false,
          statutBlocage: 'Actif'
        }));

        if (patientsBase.length === 0) {
          return of([]);
        }

        const checkBlocked$ = patientsBase.map(p =>
          this.adminService.isAccountBlocked(Number(p.id)).pipe(
            map(isBlocked => ({
              ...p,
              bloque: isBlocked,
              statutBlocage: isBlocked ? 'Bloqué' : 'Actif'
            }))
          )
        );

        return forkJoin(checkBlocked$);
      })
    ).subscribe({
      next: (patientsWithBlockStatus: unknown) => {
        this.patients = patientsWithBlockStatus as Patient[];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = "Erreur lors du chargement des patients";
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.patients];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(patient =>
        patient.nom.toLowerCase().includes(term) ||
        patient.prenom.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term)
      );
    }

    if (this.statusFilter) {
      filtered = filtered.filter(patient => patient.statut === this.statusFilter);
    }

    filtered = this.applySorting(filtered);

    this.filteredPatients = filtered;
    this.updatePagination();
  }

  applySorting(patients?: Patient[]): Patient[] {
    const list = patients ? [...patients] : [...this.filteredPatients];

    list.sort((a, b) => {
      switch (this.sortBy) {
        case 'nom':
          return a.nom.localeCompare(b.nom);
        case 'dateInscription':
          return new Date(b.dateInscription).getTime() - new Date(a.dateInscription).getTime();
        case 'medecinTraitant':
          return (a.medecinTraitant || '').localeCompare(b.medecinTraitant || '');
        default:
          return 0;
      }
    });

    if (!patients) {
      this.filteredPatients = list;
      this.updatePagination();
    }

    return list;
  }

  sortByField(field: 'nom' | 'prenom' | 'dateInscription' | 'medecinTraitant'): void {
    if (field === 'nom' || field === 'dateInscription' || field === 'medecinTraitant') {
      this.sortBy = field;
      this.applyFilters();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  getStatusClass(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'actif': return 'status-active';
      case 'inactif': return 'status-inactif';
      case 'nouveau': return 'status-nouveau';
      default: return 'status-active';
    }
  }

  getStatusIcon(statut: string): string {
    switch (statut?.toLowerCase()) {
      case 'actif': return 'fas fa-check-circle';
      case 'inactif': return 'fas fa-pause-circle';
      case 'nouveau': return 'fas fa-star';
      default: return 'fas fa-user';
    }
  }

  getInitials(nom: string, prenom: string): string {
    return `${(prenom || '').charAt(0)}${(nom || '').charAt(0)}`.toUpperCase();
  }

  isNewPatient(dateInscription: Date): boolean {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - new Date(dateInscription).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }

  getDateDifference(date: Date): string {
    const today = new Date();
    const target = new Date(date);
    const diffTime = Math.abs(today.getTime() - target.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  }

  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.filteredPatients.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
  }

  getDisplayRange(): string {
    if (this.filteredPatients.length === 0) {
      return `0-0 sur 0`;
    }
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.filteredPatients.length);
    return `${start}-${end} sur ${this.filteredPatients.length}`;
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  previousPage(): void {
    if (this.currentPage > 1) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  viewPatientDetails(patient: Patient): void {
    console.log('Voir détails:', patient);
    // this.router.navigate(...)
  }

  editPatient(patient: Patient): void {
    console.log('Modifier:', patient);
  }

  deletePatient(patient: Patient): void {
    if (confirm(`Voulez-vous supprimer ${patient.prenom} ${patient.nom} ?`)) {
      this.adminService.deletePatient(Number(patient.id)).subscribe({
        next: () => {
          this.patients = this.patients.filter(p => p.id !== patient.id);
          this.applyFilters();
          alert('Patient supprimé avec succès');
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du patient', err);
          alert('Erreur lors de la suppression du patient');
        }
      });
    }
  }

  toggleBlockPatient(patient: Patient): void {
    const userId = Number(patient.id);

    if (patient.bloque) {
      if (!confirm(`Voulez-vous débloquer le patient ${patient.prenom} ${patient.nom} ?`)) return;

      this.adminService.unblockAccount(userId).subscribe({
        next: () => {
          patient.bloque = false;
          patient.statutBlocage = 'Actif';
          alert(`Le patient ${patient.prenom} ${patient.nom} a été débloqué.`);
        },
        error: (err) => {
          console.error('Erreur lors du déblocage', err);
          alert('Erreur lors du déblocage du patient');
        }
      });
    } else {
      if (!confirm(`Voulez-vous bloquer le patient ${patient.prenom} ${patient.nom} ?`)) return;

      const raison = prompt('Raison du blocage ?', 'Compte suspect / faux compte');
      this.adminService.blockAccount(userId, raison || 'Compte bloqué par admin').subscribe({
        next: () => {
          patient.bloque = true;
          patient.statutBlocage = 'Bloqué';
          alert(`Le patient ${patient.prenom} ${patient.nom} a été bloqué.`);
        },
        error: (err) => {
          console.error('Erreur lors du blocage', err);
          alert('Erreur lors du blocage du patient');
        }
      });
    }
  }

  getBlockButtonLabel(patient: Patient): string {
    return patient.bloque ? 'Débloquer' : 'Bloquer';
  }

  getBlockButtonClass(patient: Patient): string {
    return patient.bloque ? 'btn-action unblock' : 'btn-action block';
  }

  openAddPatientModal(): void {
    this.showAddPatientForm = true;
  }

  closeAddPatientModal(): void {
    this.showAddPatientForm = false;
    this.newPatient = {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      statut: 'actif',
      dateInscription: new Date()
    };
  }

  saveNewPatient(): void {
    if (!this.newPatient.nom || !this.newPatient.prenom || !this.newPatient.email) {
      alert('Nom, prénom et email sont obligatoires.');
      return;
    }

    const payload = {
      nom: this.newPatient.nom,
      prenom: this.newPatient.prenom,
      email: this.newPatient.email,
      telephone: this.newPatient.telephone,
      role: 'patient',
      motDePasse: this.newPatient.motDePasse,
      date_naissance: this.newPatient.date_naissance

    };

    this.adminService.createPatient(payload).subscribe({
      next: (created: any) => {
        const newP: Patient = {
          id: created.idUtilisateur ?? created.id ?? Date.now(),
          nom: payload.nom,
          prenom: payload.prenom,
          email: payload.email,
          telephone: payload.telephone,
          medecinTraitant: '',
          dateInscription: new Date(),
          statut: 'actif',
          bloque: false,
          statutBlocage: 'Actif'
        };

        this.patients.push(newP);
        this.applyFilters();
        this.closeAddPatientModal();
        alert('Patient ajouté avec succès.');
      },
      error: (err) => {
        console.error('Erreur lors de la création du patient', err);
        alert('Erreur lors de la création du patient');
      }
    });
  }
}
