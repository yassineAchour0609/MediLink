package com.example.medilink.data.network

import androidx.compose.ui.graphics.Path
import com.example.medilink.data.model.ApiResponse
import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

data class PatientInfo(
    val nom: String,
    val prenom: String,
    val photoUrl: String?
)
interface PatientApiService {
    @GET("api/patients/profile") // <-- Make sure this URL is correct
    suspend fun getPatientInfo(@Query("idPatient") idPatient: Int): Response<ApiResponse<PatientInfo>>
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