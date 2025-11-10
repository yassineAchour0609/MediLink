export class Medecin {
    constructor(
        public idUtilisateur?: number,
        public prenom?: string,
        public nom?: string,
        public sexe?: string,
        public email?: string,
        public age?: number,
        public num_cin?: string,
        public telephone?: string,
        public date_naissance?: string,
        public role?: string,
        public specialite?: string,
        public cabinet?: string,
        public tarif_consultation?: number,
        public disponibilite?: boolean,
        public heure_ouverture?: string,
        public heure_fermeture?: string
    ) {}
}
