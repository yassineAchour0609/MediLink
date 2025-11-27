package com.example.medilink.data.network

import com.example.medilink.data.model.LoginRequest
import com.example.medilink.data.model.LoginResponse
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("api/utilisateur/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @POST("api/utilisateur")
    suspend fun creerUtilisateur(
        @Body request: Map<String, String>
    ): RegisterResponse
}

data class RegisterResponse(
    val success: Boolean,
    val message: String?,
    val id: Int?
)