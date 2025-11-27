package com.example.medilink.data.network

import retrofit2.http.Body
import retrofit2.http.POST

interface ChatbotApiService {
    @POST("api/chat")
    suspend fun sendMessage(@Body request: ChatRequest): ChatResponse
}

data class ChatRequest(val message: String)
data class ChatResponse(val reply: String)