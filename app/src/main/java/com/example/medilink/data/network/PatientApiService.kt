package com.example.medilink.data.network

import retrofit2.http.GET

interface PatientApiService {

    @GET("api/medecins")
    suspend fun getAllMedecins(): MedecinsResponse

    data class MedecinsResponse(
        val success: Boolean,
        val medecins: List<MedecinData>
    )

    data class MedecinData(
        val idUtilisateur: Int,
        val prenom: String,
        val nom: String,
        val sexe: String?,
        val email: String,
        val specialite: String,
        val cabinet: String,
        val tarif_consultation: Double,
        val disponibilite: Int,
        val heure_ouverture: String,
        val heure_fermeture: String
    )

    data class AppointmentRequest(
        val doctorId: Int,
        val patientId: Int,
        val date: String,
        val time: String,
        val reason: String?
    )

    data class AppointmentResponse(
        val success: Boolean,
        val message: String,
        val appointmentId: Int?
    )
}