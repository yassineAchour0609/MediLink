package com.example.medilink.data.model

data class LoginResponse(
    val success: Boolean,
    val message: String,
    val token: String?,
    val utilisateur: Utilisateur?
)

data class Utilisateur(
    val idUtilisateur: Int,
    val email: String,
    val nom: String,
    val prenom: String,
    val role: String,
    val telephone: String,
    val sexe: String?,
    val age: Int?,
    val date_naissance: String?,
    val num_cin: String?
)
