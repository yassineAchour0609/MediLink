import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { AccDashboard } from './dashboard/patient-dashboard/acc-dashboard/acc-dashboard';
import { Rdv } from './dashboard/patient-dashboard/rdv/rdv';
import { ListMed } from './dashboard/patient-dashboard/list-med/list-med';
import { Login } from './login/login';
import { PrendreRdv } from './dashboard/patient-dashboard/prendre-rdv/prendre-rdv';
import { ChatBot } from './dashboard/patient-dashboard/chat-bot/chat-bot';
import { Dossier } from './dashboard/patient-dashboard/dossier/dossier';
import { MedecinDashboard } from './dashboard/medecin-dashboard/medecin-dashboard/medecin-dashboard';
import { MedecinCalendar } from './dashboard/medecin-dashboard/medecin-calendar/medecin-calendar';
import { MonCompteComponent } from './dashboard/patient-dashboard/mon-compte/mon-compte.component';
import { MessagerieComponent } from './dashboard/patient-dashboard/messagerie/messagerie.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard/admin-dashboard.component';
import { SidebarAdminComponent } from './dashboard/admin-dashboard/sidebar-admin/sidebar-admin.component';
import { MedecinsComponent } from './dashboard/admin-dashboard/medecins/medecins.component';
import { PatientsComponent } from './dashboard/admin-dashboard/patients/patients.component';
import { SignupComponent } from './signup/signup.component';
import { MedecinSidebar } from './dashboard/medecin-dashboard/medecin-sidebar/medecin-sidebar';
import { authGuard } from './auth-guard';


export const routes: Routes = [
    {path:'login',title:'Se connecter',component:Login},
    {path:'signup',title:'S\'inscrire',component:SignupComponent},
    {path:'dashboard/:idp',title:'Dashboard',component:Dashboard,canActivate:[authGuard],
      children:[
        {path:'acc-dashboard',title:'Acc Dashboard',component:AccDashboard},
        {path:'rdv',title:'Rendez-vous',component:Rdv},
        {path:'list-med',title:'Liste des médecins',component:ListMed},
        {path:'prendre-rdv/:idm',title:'Prendre rendez-vous',component:PrendreRdv},
        {path:'chat-bot',title:'Chat Bot',component:ChatBot},
        {path:'dossier',title:'Dossier médical',component:Dossier},
        {path:'compte',title:'Mon compte',component:MonCompteComponent },
        {path:'messagerie',title:'Messagerie',component:MessagerieComponent },
        {path:'Profile',title:'Profil',component:MonCompteComponent },
        {path:'',redirectTo:'acc-dashboard',pathMatch:'full'}
    ]},
    {path:'admin/:id',title:'Tableau de bord admin',component:SidebarAdminComponent,
      canActivate:[authGuard],
      children:[
      {path:'admin-dashboard',title:'Admin Dashboard',component:AdminDashboardComponent},
      {path:'medecins',title:'Gestion des médecins',component:MedecinsComponent},
      {path:'patients',title:'Gestion des patients',component:PatientsComponent},
      {path:'',redirectTo:'admin-dashboard',pathMatch:'full'}

    ]},
    {path:'medecin/:idm',title:'Tableau de bord médecin',component:MedecinSidebar,
      canActivate:[authGuard],
      children:[

    {path:'dashboard',title:'Tableau de bord médecin',component:MedecinDashboard},
    {path:'calendar',title:'Calendrier médecin',component:MedecinCalendar},
    {path:'rdv',redirectTo:'medecin/:idm/dashboard',pathMatch:'full'},
    {path:'messagerie',title:'Messagerie médecin',component:MessagerieComponent},
    {path:'patient/:idPatient/dossier',title:'Dossier patient',component:Dossier},
    {path:'compte',title:'Mon compte',component:MonCompteComponent },
    {path:'',redirectTo:'dashboard',pathMatch:'full'}
    ]
    },/*
    {path:'medecin/:idm/dashboard',title:'Tableau de bord médecin',component:MedecinDashboard},
    {path:'medecin/:idm/calendar',title:'Calendrier médecin',component:MedecinCalendar},
    {path:'medecin/:idm/rdv',redirectTo:'medecin/:idm/dashboard',pathMatch:'full'},
    {path:'medecin/:idm/messagerie',title:'Messagerie médecin',component:MessagerieComponent},
    {path:'medecin/:idm/patient/:idPatient/dossier',title:'Dossier patient',component:Dossier},*/

    {path:'',redirectTo:'/login',pathMatch:'full'},
];
