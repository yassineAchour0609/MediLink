package com.example.medilink.data.model

import com.google.gson.annotations.SerializedName

data class Message(
    @SerializedName("id_message") val idMessage: Int?,
    @SerializedName("idEmetteur") val idEmetteur: Int?,
    @SerializedName("idDestinaire") val idDestinaire: Int?,
    @SerializedName("contenu") val contenu: String?,
    @SerializedName("type_message") val typeMessage: String?,
    @SerializedName("url_document") val urlDocument: String?,
    @SerializedName("nom_document") val nomDocument: String?,
    @SerializedName("lu") val lu: Int,
    @SerializedName("date_creation") val dateCreation: String?,
    @SerializedName("date_lecture") val dateLecture: String?,
    val nom: String?,
    val prenom: String?

)

data class Conversation(
    @SerializedName("idAutre") val idAutre: Int,
    @SerializedName("nom") val nom: String?,
    @SerializedName("prenom") val prenom: String?,
    @SerializedName("dernier_message") val dernierMessage: String?,
    @SerializedName("date_dernier_message") val dateDernierMessage: String?,
    @SerializedName("messages_non_lus") val messagesNonLus: Int?,
    @SerializedName("photo_profil") val photoProfil: String?
)


// -----------------------------
// REQUESTS (envoi au backend)
// -----------------------------

data class SendMessageRequest(
    val idDestinaire: Int,
    val contenu: String?,
    val type_message: String?,
    val url_document: String? = null,
    val nom_document: String? = null
)
data class UploadResponse(
    val success: Boolean,
    val message: String?,
    val url: String?,
    val filename: String?,
    val size: Long?
)
data class UploadFileResponse(
    val success: Boolean,
    val message: String?,
    val url: String?,
    val filename: String?,
    val size: Int?
)

data class CreateConversationRequest(
    @SerializedName("idDestinaire")
    val idDestinaire: Int,

    @SerializedName("message_initial")
    val message_initial: String? = null)
