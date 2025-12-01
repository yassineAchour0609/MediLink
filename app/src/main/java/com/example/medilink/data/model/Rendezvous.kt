package com.example.medilink.data.model

import com.google.gson.annotations.SerializedName

data class Rendezvous(
    @SerializedName("idRdv") val idRdv: Int?,
    @SerializedName("idPatient") val idPatient: Int?,
    @SerializedName("idMedecin") val idMedecin: Int?,
    @SerializedName("date") val date: String?,
    @SerializedName("heure") val heure: String?,
    @SerializedName("statut") val statut: String?,
    @SerializedName("medecinNom") val medecinNom: String?,
    @SerializedName("medecinPrenom") val medecinPrenom: String?,
    @SerializedName("medecinSpecialite") val medecinSpecialite: String?
)

data class RendezvousResponse(
    val success: Boolean,
    val rendezvous: List<Rendezvous>?,
    val message: String? = null
)

data class CreateRendezvousRequest(
    val idMedecin: Int,
    val idPatient: Int,
    val date: String,
    val heure: String,
    val statut: String = "en attente"
)


data class UpdateRendezvousRequest(
    val date: String,
    val heure: String,
    val idMedecin: Int,
    val idPatient: Int,
    val statut: String
)
