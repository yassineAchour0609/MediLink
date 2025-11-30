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
    ): ApiResponse

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
    ): ApiResponse

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
    ): ApiResponse

}

