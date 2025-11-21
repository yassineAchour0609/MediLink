import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { forkJoin, Observable, map, switchMap, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/utilisateur`).pipe(
      map(res => Array.isArray(res) ? res : res.utilisateurs || [])
    );
  }

  getAllPatients(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/utilisateur`).pipe(
      map(res => {
        const users = res.utilisateurs || [];
        return users.filter((u: any) => u.role === 'patient');
      })
    );
  }

  getAllMedecins(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/medecins`).pipe(
      map(res => Array.isArray(res) ? res : res.medecins || [])
    );
  }

  getAllRendezVous(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/rendezvous`).pipe(
      map(res => res.rendezvous || [])
    );
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/utilisateur/${id}`);
  }

  getAdminStats(): Observable<any> {
    return forkJoin({
      users: this.getAllUsers(),
      medecins: this.getAllMedecins(),
      rdvs: this.getAllRendezVous()
    }).pipe(
      map(({ users, medecins, rdvs }) => {
        const totalUsers = users.length;
        const totalDoctors = medecins.length;
        const totalPatients = totalUsers - totalDoctors;

        const today = new Date();
        const rdvToday = rdvs.filter(r => {
          const rdvDate = new Date(r.date);
          return rdvDate.toDateString() === today.toDateString();
        }).length;

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        const thisWeek = rdvs.filter(r => {
          const rdvDate = new Date(r.date);
          return rdvDate >= startOfWeek && rdvDate <= endOfWeek;
        }).length;

        const cancelled = rdvs.filter(r => r.statut === 'annulé').length;

        const specCount: { [key: string]: number } = {};
        rdvs.forEach(r => {
          if (r.specialite) {
            specCount[r.specialite] = (specCount[r.specialite] || 0) + 1;
          }
        });
        const topSpecialites = Object.entries(specCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([nom, rdvCount]) => ({ nom, rdvCount }));

        return {
          totalUsers,
          totalDoctors,
          totalPatients,
          rdvToday,
          rdvStats: {
            total: rdvs.length,
            thisWeek,
            cancelled,
            evolutionLabel: thisWeek - rdvToday >= 0 ? '+' + (thisWeek - rdvToday) : (thisWeek - rdvToday)
          },
          topSpecialites
        };
      })
    );
  }

  blockAccount(userId: number, reason: string): Observable<any> {
    const params = new HttpParams()
      .set('userId', userId.toString())
      .set('reason', reason || 'Compte bloqué par administrateur');

    return this.http.post(`${this.apiUrl}/admin/bloquer-compte`, {}, { params });
  }

  unblockAccount(userId: number): Observable<any> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.post(`${this.apiUrl}/admin/debloquer-compte`, {}, { params });
  }

  getBlockedAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/comptes-bloques`);
  }

isAccountBlocked(userId: number): Observable<boolean> {
  if (!userId) {
    return new Observable<boolean>(observer => {
      observer.next(false);
      observer.complete();
    });
  }

  const params = new HttpParams().set('userId', userId.toString());
  return this.http.get<any>(`${this.apiUrl}/admin/estbloque`, { params }).pipe(
    map(res => res.isBlocked || false)
  );
}
createPatient(patient: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/utilisateur`, patient);
}


  getAllMedecinsWithBlockStatus(): Observable<any[]> {
    return this.getAllMedecins().pipe(
      switchMap(medecins => {
        if (!medecins || medecins.length === 0) {
          return of([]);
        }

        const checkBlockStatus$ = medecins.map(medecin =>
          this.isAccountBlocked(medecin.idUtilisateur).pipe(
            map(isBlocked => ({
              ...medecin,
              bloque: isBlocked,
              statut: isBlocked ? 'Bloqué' : 'Actif'
            }))
          )
        );

        return forkJoin(checkBlockStatus$);
      })
    );
  }
}
