package com.example.medilink.data.repository

import com.example.medilink.data.model.LoginRequest
import com.example.medilink.data.model.LoginResponse
import com.example.medilink.data.network.RetrofitClient

class AuthRepository {
    private val api = RetrofitClient.instance

    suspend fun login(email: String, password: String): Result<LoginResponse> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.success) {
                Result.success(response)
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}