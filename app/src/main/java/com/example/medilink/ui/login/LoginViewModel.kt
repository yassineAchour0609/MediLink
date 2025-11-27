package com.example.medilink.ui.login

import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.getValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {
    private val repository = AuthRepository()

    var email by mutableStateOf("")
        private set
    var password by mutableStateOf("")
        private set

    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()

    fun onEmailChange(newEmail: String) {
        email = newEmail
    }

    fun onPasswordChange(newPassword: String) {
        password = newPassword
    }

    fun login() {
        viewModelScope.launch {
            _loginState.value = LoginState.Loading

            val result = repository.login(email, password)

            _loginState.value = if (result.isSuccess) {
                val response = result.getOrNull()!!
                val user = response.utilisateur!!
                val token = response.token!!
                LoginState.Success(user, token, user.role)
            } else {
                LoginState.Error(result.exceptionOrNull()?.message ?: "Erreur inconnue")
            }
        }
    }
}