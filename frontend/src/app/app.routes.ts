import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { AccDashboard } from './dashboard/acc-dashboard/acc-dashboard';
import { Rdv } from './dashboard/rdv/rdv';
import { ListMed } from './dashboard/list-med/list-med';
import { Login } from './login/login';
import { PrendreRdv } from './dashboard/prendre-rdv/prendre-rdv';
import { ChatBot } from './dashboard/chat-bot/chat-bot';
import { DossierMedicalComponent } from './dashboard/dossier/dossier-medical';
import { MedecinDashboardComponent } from './dashboard/medecin-dashboard/medecin-dashboard';
import { MedecinAccueilComponent } from './dashboard/medecin-dashboard/medecin-accueil/medecin-accueil';
import { MedecinCalendrierComponent } from './dashboard/medecin-dashboard/medecin-calendrier/medecin-calendrier';
import { MedecinDossierComponent } from './dashboard/medecin-dashboard/medecin-dossier/medecin-dossier';


export const routes: Routes = [
    {path:'dashboard/:idp',title:'Dashboard',component:Dashboard,children:[
        {path:'acc-dashboard',title:'Acc Dashboard',component:AccDashboard},
        {path:'rdv',title:'Rendez-vous',component:Rdv},
        {path:'list-med',title:'Liste des médecins',component:ListMed},
        {path:'prendre-rdv/:idm',title:'Prendre rendez-vous',component:PrendreRdv},
        {path:'dossier-medical',title:'Dossier médical',component:DossierMedicalComponent},
        {path:'chat-bot',title:'Chat Bot',component:ChatBot},
        {path:'',redirectTo:'acc-dashboard',pathMatch:'full'}
    ]},
    {path:'medecin/:idMedecin',title:'Espace Médecin',component:MedecinDashboardComponent,children:[
        {path:'accueil',title:'Accueil',component:MedecinAccueilComponent},
        {path:'calendrier',title:'Calendrier',component:MedecinCalendrierComponent},
        {path:'dossier',title:'Dossier Patient',component:MedecinDossierComponent},
        {path:'',redirectTo:'accueil',pathMatch:'full'}
    ]},
    {path:'login',title:'Se connecter',component:Login},
    {path:'',redirectTo:'/login',pathMatch:'full'},
];
