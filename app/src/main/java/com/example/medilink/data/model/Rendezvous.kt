package com.example.medilink.data.model

import com.google.gson.annotations.SerializedName

data class Rendezvous(
    @SerializedName("idRdv") val idRdv: Int?,
    @SerializedName("idPatient") val idPatient: Int?,
    @SerializedName("idMedecin") val idMedecin: Int?,
    @SerializedName("date") val date: String?,        // "YYYY-MM-DD"
    @SerializedName("heure") val heure: String?,      // "HH:mm"
    @SerializedName("statut") val statut: String?,    // "en attente", "confirmé", "annulé"
    @SerializedName("medecinNom") val medecinNom: String?,
    @SerializedName("medecinPrenom") val medecinPrenom: String?,
    @SerializedName("medecinSpecialite") val medecinSpecialite: String?
)

data class RendezvousResponse(
    val success: Boolean,
    val rendezvous: List<Rendezvous>,
    val message: String? = null
)

data class CreateRendezvousRequest(
    val idMedecin: Int,
    val idPatient: Int,
    val date: String,      // "YYYY-MM-DD"
    val heure: String,     // "HH:mm"
    val statut: String = "en attente"
)

data class UpdateRendezvousRequest(
    val idRdv: Int,
    val date: String,
    val heure: String
)
