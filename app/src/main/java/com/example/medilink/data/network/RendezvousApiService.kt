package com.example.medilink.data.network

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import com.example.medilink.data.model.RendezvousResponse
import com.example.medilink.data.model.CreateRendezvousRequest
import com.example.medilink.data.model.UpdateRendezvousRequest

interface RendezvousApiService {

    @GET("api/rendezvous/patient/{idPatient}")
    suspend fun getRendezvousByPatientId(
        @Path("idPatient") idPatient: Int
    ): RendezvousResponse

    @POST("api/rendezvous")
    suspend fun createRendezvous(
        @Body request: CreateRendezvousRequest
    ): RendezvousResponse

    @PUT("api/rendezvous/modifier/{id}")
    suspend fun updateRendezvous(
        @Path("id") idRdv: Int,
        @Body request: UpdateRendezvousRequest
    ): SimpleResponse

    @PUT("api/rendezvous/{idRdv}/annuler")
    suspend fun cancelRendezvous(
        @Path("idRdv") idRdv: Int
    ): RendezvousResponse
}
data class SimpleResponse(
    val success: Boolean,
    val message: String?
)
