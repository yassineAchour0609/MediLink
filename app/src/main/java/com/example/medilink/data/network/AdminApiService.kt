package com.example.medilink.data.network

import retrofit2.http.*

interface AdminApiService {
    @POST("api/admin/bloquer-compte")
    suspend fun blockAccount(
        @Query("userId") userId: Int,
        @Query("reason") reason: String
    ): BlockResponse

    @POST("api/admin/debloquer-compte")
    suspend fun unblockAccount(
        @Query("userId") userId: Int
    ): UnblockResponse

    @GET("api/admin/comptes-bloques")
    suspend fun getBlockedAccounts(): BlockedAccountsResponse

    @GET("api/medecins")
    suspend fun getMedecins(): MedecinsResponse

    @GET("api/utilisateur")
    suspend fun getPatients(
        @Header("Authorization") token: String
    ): UtilisateursResponse
}

data class BlockResponse(
    val success: Boolean,
    val message: String
)

data class UnblockResponse(
    val success: Boolean,
    val message: String
)

data class BlockedAccountsResponse(
    val success: Boolean,
    val count: Int,
    val data: List<BlockedAccount>
)

data class BlockedAccount(
    val user_id: Int,
    val email: String,
    val prenom: String,
    val nom: String,
    val role: String,
    val reason: String,
    val blocked_date: String
)

data class MedecinsResponse(
    val success: Boolean,
    val medecins: List<Medecin>
)

data class Medecin(
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

data class UtilisateursResponse(
    val success: Boolean,
    val utilisateurs: List<UtilisateurData>
)

data class UtilisateurData(
    val idUtilisateur: Int,
    val email: String,
    val nom: String,
    val prenom: String,
    val role: String,
    val telephone: String?,
    val sexe: String?,
    val age: Int?,
    val date_naissance: String?
)
