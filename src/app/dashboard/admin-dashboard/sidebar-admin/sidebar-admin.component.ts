import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
interface Admin {
  nom: string;
  prenom: string;
}

@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-admin.component.html',
  styleUrl: './sidebar-admin.component.css'
})
export class SidebarAdminComponent {
  router : Router = inject(Router);
logout() {
this.router.navigate(['/login']);}
 admin: Admin = {
    nom: 'Admin',
    prenom: 'Principal',

  };
  route:ActivatedRoute = inject(ActivatedRoute);
  id: number | null = null;
    ngOnInit(): void {
    this.id = this.route.snapshot.params['id'];
  }

}
