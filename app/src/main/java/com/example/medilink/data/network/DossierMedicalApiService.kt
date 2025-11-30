package com.example.medilink.data.network

import com.example.medilink.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.http.*

interface DossierMedicalApiService {

    @GET("api/dossier-medical/patient/{idPatient}")
    suspend fun getDossierByPatient(
        @Path("idPatient") idPatient: Int,
        @Query("idMedecin") idMedecin: Int? = null
    ): DossierMedicalResponse

    @PUT("api/dossier-medical/patient/{idPatient}")
    suspend fun updateDossier(
        @Path("idPatient") idPatient: Int,
        @Body request: UpdateDossierRequest
    ): DossierMedicalResponse

    // Analyses
    @Multipart
    @POST("api/dossier-medical/patient/{idPatient}/analyses")
    suspend fun addAnalyse(
        @Path("idPatient") idPatient: Int,
        @Part("idMedecin") idMedecin: RequestBody?,
        @Part("type_analyse") typeAnalyse: RequestBody,
        @Part("date_analyse") dateAnalyse: RequestBody,
        @Part("resultats") resultats: RequestBody?,
        @Part("laboratoire") laboratoire: RequestBody?,
        @Part("notes") notes: RequestBody?,
        @Part document: MultipartBody.Part? = null
    ): ApiResponse<DossierMedicalApiService>

    @Multipart
    @PUT("api/dossier-medical/patient/{idPatient}/analyses/{idAnalyse}")
    suspend fun updateAnalyse(
        @Path("idPatient") idPatient: Int,
        @Path("idAnalyse") idAnalyse: Int,
        @Part("type_analyse") typeAnalyse: RequestBody?,
        @Part("date_analyse") dateAnalyse: RequestBody?,
        @Part("resultats") resultats: RequestBody?,
        @Part("laboratoire") laboratoire: RequestBody?,
        @Part("idMedecin") idMedecin: RequestBody?,
        @Part("notes") notes: RequestBody?,
        @Part document: MultipartBody.Part? = null
    ): ApiResponse<DossierMedicalResponse>

    @DELETE("api/dossier-medical/patient/{idPatient}/analyses/{idAnalyse}")
    suspend fun deleteAnalyse(
        @Path("idPatient") idPatient: Int,
        @Path("idAnalyse") idAnalyse: Int
    ): ApiResponse<Unit>

    // Ordonnances
    @Multipart
    @POST("api/dossier-medical/patient/{idPatient}/ordonnances")
    suspend fun addOrdonnance(
        @Path("idPatient") idPatient: Int,
        @Part("idMedecin") idMedecin: RequestBody?,
        @Part("date_ordonnance") dateOrdonnance: RequestBody,
        @Part("medicaments") medicaments: RequestBody,
        @Part("posologie") posologie: RequestBody?,
        @Part("duree_traitement") dureeTraitement: RequestBody?,
        @Part("notes") notes: RequestBody?,
        @Part document: MultipartBody.Part? = null
    ): ApiResponse<DossierMedicalResponse>

    @Multipart
    @PUT("api/dossier-medical/patient/{idPatient}/ordonnances/{idOrdonnance}")
    suspend fun updateOrdonnance(
        @Path("idPatient") idPatient: Int,
        @Path("idOrdonnance") idOrdonnance: Int,
        @Part("idMedecin") idMedecin: RequestBody?,
        @Part("date_ordonnance") dateOrdonnance: RequestBody?,
        @Part("medicaments") medicaments: RequestBody?,
        @Part("posologie") posologie: RequestBody?,
        @Part("duree_traitement") dureeTraitement: RequestBody?,
        @Part("notes") notes: RequestBody?,
        @Part document: MultipartBody.Part? = null
    ): ApiResponse<DossierMedicalResponse>

    @DELETE("api/dossier-medical/patient/{idPatient}/ordonnances/{idOrdonnance}")
    suspend fun deleteOrdonnance(
        @Path("idPatient") idPatient: Int,
        @Path("idOrdonnance") idOrdonnance: Int
    ): ApiResponse<Unit>

    // Notes
    @POST("api/dossier-medical/patient/{idPatient}/notes")
    suspend fun addNote(
        @Path("idPatient") idPatient: Int,
        @Body request: CreateNoteRequest
    ): ApiResponse<DossierMedicalResponse>

    @PUT("api/dossier-medical/patient/{idPatient}/notes/{idNote}")
    suspend fun updateNote(
        @Path("idPatient") idPatient: Int,
        @Path("idNote") idNote: Int,
        @Body request: UpdateNoteRequest
    ): ApiResponse<DossierMedicalResponse>

    @DELETE("api/dossier-medical/patient/{idPatient}/notes/{idNote}")
    suspend fun deleteNote(
        @Path("idPatient") idPatient: Int,
        @Path("idNote") idNote: Int
    ): ApiResponse<Unit>
}

