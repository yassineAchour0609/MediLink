package com.example.medilink.ui.login

import com.example.medilink.data.model.Utilisateur

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    data class Success(val utilisateur: Utilisateur, val token: String,val role: String) : LoginState()
    data class Error(val message: String) : LoginState()
}