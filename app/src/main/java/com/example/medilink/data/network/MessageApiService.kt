package com.example.medilink.data.network

import com.example.medilink.data.model.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import retrofit2.Response
import retrofit2.http.*
import java.io.File
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

interface MessageApiService {

    @POST("api/messages")
    suspend fun sendMessage(@Body req: SendMessageRequest): Response<ApiResponse<Message>>

    @GET("api/messages/conversation/{idAutre}")
    suspend fun getConversation(@Path("idAutre") idAutre: Int): Response<ApiResponse<List<Message>>>

    @GET("api/messages/list/all")
    suspend fun getConversations(): Response<ApiResponse<List<Conversation>>>

    @POST("api/messages/conversations")
    suspend fun createConversation(@Body req: CreateConversationRequest): Response<ApiResponse<Conversation>>

    @PUT("api/messages/{idMessage}/read")
    suspend fun markAsRead(@Path("idMessage") idMessage: Int): Response<ApiResponse<Unit>>

    @DELETE("api/messages/{idMessage}")
    suspend fun deleteMessage(@Path("idMessage") idMessage: Int): Response<ApiResponse<Unit>>


    @DELETE("api/messages/conversation/{idAutre}")
    suspend fun deleteConversation(@Path("idAutre") idAutre: Int): Response<ApiResponse<Unit>>


    @Multipart
    @POST("api/messages/upload")
    suspend fun uploadFile(@Part file: MultipartBody.Part): Response<UploadFileResponse>
}
fun File.toMultipartBody(): MultipartBody.Part {
    val requestBody = this.asRequestBody("multipart/form-data".toMediaType())
    return MultipartBody.Part.createFormData("file", name, requestBody)
}
fun Message.createdAtFormatted(): String? {
    return try {
        val dateTime = LocalDateTime.parse(this.dateCreation)
        dateTime.format(DateTimeFormatter.ofPattern("HH:mm"))
    } catch (e: Exception) {
        this.dateCreation // fallback
    }
}

// complément de type de réponse
data class CreateConvResponse(val idConversation: Int)
