package com.example.medilink.data.model

import com.google.gson.annotations.SerializedName

// Dossier médical principal
data class DossierMedical(
    @SerializedName("idDossier") val idDossier: Int?,
    @SerializedName("idPatient") val idPatient: Int?,
    @SerializedName("groupe_sanguin") val groupeSanguin: String?,
    @SerializedName("antecedents_medicaux") val antecedentsMedicaux: String?,
    @SerializedName("traitements_en_cours") val traitementsEnCours: String?,
    @SerializedName("vaccinations") val vaccinations: String?,
    @SerializedName("diagnostic") val diagnostic: String?,
    @SerializedName("der_mise_a_jour") val derMiseAJour: String?
)

// Analyse médicale
data class Analyse(
    @SerializedName("idAnalyse") val idAnalyse: Int?,
    @SerializedName("idDossier") val idDossier: Int?,
    @SerializedName("type_analyse") val typeAnalyse: String?,
    @SerializedName("date_analyse") val dateAnalyse: String?,
    @SerializedName("resultats") val resultats: String?,
    @SerializedName("laboratoire") val laboratoire: String?,
    @SerializedName("idMedecinPrescripteur") val idMedecinPrescripteur: Int?,
    @SerializedName("medecinNom") val medecinNom: String?,
    @SerializedName("medecinPrenom") val medecinPrenom: String?,
    @SerializedName("notes") val notes: String?,
    @SerializedName("url_document") val urlDocument: String?
)

// Ordonnance
data class Ordonnance(
    @SerializedName("idOrdonnance") val idOrdonnance: Int?,
    @SerializedName("idDossier") val idDossier: Int?,
    @SerializedName("date_ordonnance") val dateOrdonnance: String?,
    @SerializedName("idMedecinPrescripteur") val idMedecinPrescripteur: Int?,
    @SerializedName("medecinNom") val medecinNom: String?,
    @SerializedName("medecinPrenom") val medecinPrenom: String?,
    @SerializedName("medicaments") val medicaments: String?,
    @SerializedName("posologie") val posologie: String?,
    @SerializedName("duree_traitement") val dureeTraitement: String?,
    @SerializedName("notes") val notes: String?,
    @SerializedName("url_document") val urlDocument: String?
)

// Note médicale
data class NoteMedicale(
    @SerializedName("idNote") val idNote: Int?,
    @SerializedName("idDossier") val idDossier: Int?,
    @SerializedName("idMedecin") val idMedecin: Int?,
    @SerializedName("medecinNom") val medecinNom: String?,
    @SerializedName("medecinPrenom") val medecinPrenom: String?,
    @SerializedName("type_note") val typeNote: String?,
    @SerializedName("contenu_note") val contenuNote: String?,
    @SerializedName("created_at") val createdAt: String?
)

// Réponse complète du dossier
data class DossierMedicalResponse(
    val success: Boolean,
    val dossier: DossierMedical?,
    val analyses: List<Analyse>?,
    val ordonnances: List<Ordonnance>?,
    val notes: List<NoteMedicale>?,
    val message: String? = null
)

// Requêtes pour créer/modifier
data class UpdateDossierRequest(
    val groupe_sanguin: String?,
    val antecedents_medicaux: String?,
    val traitements_en_cours: String?,
    val vaccinations: String?,
    val diagnostic: String?
)

data class CreateAnalyseRequest(
    val idMedecin: Int?,
    val type_analyse: String,
    val date_analyse: String,
    val resultats: String?,
    val laboratoire: String?,
    val notes: String?
)

data class UpdateAnalyseRequest(
    val type_analyse: String?,
    val date_analyse: String?,
    val resultats: String?,
    val laboratoire: String?,
    val idMedecin: Int?,
    val notes: String?
)


data class ApiResponse(
    val success: Boolean,
    val message: String? = null,
    val id: Int? = null,
    val url_document: String? = null
)

