package com.example.medilink.data.network

import retrofit2.http.GET
import retrofit2.http.Header

interface StatsApiService {
    @GET("api/utilisateur")
    suspend fun getAllUtilisateurs(
        @Header("Authorization") token: String
    ): UtilisateursResponse
}
data class UtilisateurStats(
    val idUtilisateur: Int,
    val role: String,
    val nom: String,
    val prenom: String
)