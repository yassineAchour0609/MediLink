import { Medecin } from "./list-med/medecin";

export class Patient {
  constructor(
    public idUtilisateur?: number,
    public prenom?: string,
    public nom?: string,
    public email?: string,
    public telephone?: string,
    public role?: string,
    public num_dossier_medical?: number,
    public rendezvous?: Rendezvous[]
  ) {}
}
export class Rendezvous {
  constructor(
    public idRdv?: number,
    public date?: string,
    public heure?: string,
    public statut?: string,
    public idMedecin?: number,
    public idPatient?: number,
    public medecin?: Medecin
  ) {}
}