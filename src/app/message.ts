export class Message {
  public idMessage?: number;
  public idEmetteur?: number;
  public idDestinaire?: number;
  public contenu?: string;
  public type_message?: 'text' | 'document' | 'image';
  public url_document?: string;
  public nom_document?: string;
  public date_creation?: string;
  public lu?: boolean;
  public date_lecture?: string;
  public nom?: string;
  public prenom?: string;

}
