package com.example.medilink.ui.register

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.network.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class RegisterViewModel : ViewModel() {
    private val api = RetrofitClient.instance

    var nom by mutableStateOf("")
        private set
    var prenom by mutableStateOf("")
        private set
    var email by mutableStateOf("")
        private set
    var telephone by mutableStateOf("")
        private set
    var dateNaissance by mutableStateOf("")
        private set
    var numCin by mutableStateOf("")
        private set
    var sexe by mutableStateOf("")
        private set
    var password by mutableStateOf("")
        private set
    var confirmPassword by mutableStateOf("")
        private set

    private val _registerState = MutableStateFlow<RegisterState>(RegisterState.Idle)
    val registerState: StateFlow<RegisterState> = _registerState.asStateFlow()

    fun onNomChange(newNom: String) {
        nom = newNom
    }

    fun onPrenomChange(newPrenom: String) {
        prenom = newPrenom
    }

    fun onEmailChange(newEmail: String) {
        email = newEmail
    }

    fun onTelephoneChange(newTelephone: String) {
        telephone = newTelephone
    }

    fun onDateNaissanceChange(newDate: String) {
        dateNaissance = newDate
    }

    fun onNumCinChange(newNumCin: String) {
        if (newNumCin.length <= 8 && newNumCin.all { it.isDigit() }) {
            numCin = newNumCin
        }
    }

    fun onSexeChange(newSexe: String) {
        sexe = newSexe
    }

    fun onPasswordChange(newPassword: String) {
        password = newPassword
    }

    fun onConfirmPasswordChange(newConfirmPassword: String) {
        confirmPassword = newConfirmPassword
    }

    private fun calculateAge(birthDate: String): Int {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            val birth = sdf.parse(birthDate) ?: return 0

            val birthCalendar = Calendar.getInstance().apply { time = birth }
            val today = Calendar.getInstance()

            var age = today.get(Calendar.YEAR) - birthCalendar.get(Calendar.YEAR)

            if (today.get(Calendar.DAY_OF_YEAR) < birthCalendar.get(Calendar.DAY_OF_YEAR)) {
                age--
            }

            age
        } catch (e: Exception) {
            0
        }
    }

    fun register() {
        if (nom.isBlank() || prenom.isBlank() || email.isBlank() ||
            telephone.isBlank() || dateNaissance.isBlank() || numCin.isBlank() ||
            sexe.isBlank() || password.isBlank()) {
            _registerState.value = RegisterState.Error("Tous les champs sont requis")
            return
        }

        if (numCin.length != 8) {
            _registerState.value = RegisterState.Error("Le numéro CIN doit contenir 8 chiffres")
            return
        }

        if (password != confirmPassword) {
            _registerState.value = RegisterState.Error("Les mots de passe ne correspondent pas")
            return
        }

        if (password.length < 6) {
            _registerState.value = RegisterState.Error("Le mot de passe doit contenir au moins 6 caractères")
            return
        }

        val age = calculateAge(dateNaissance)

        if (age < 18) {
            _registerState.value = RegisterState.Error("Vous devez avoir au moins 18 ans pour créer un compte")
            return
        }

        viewModelScope.launch {
            _registerState.value = RegisterState.Loading

            try {
                val request = mapOf(
                    "email" to email,
                    "motDePasse" to password,
                    "nom" to nom,
                    "prenom" to prenom,
                    "role" to "patient",
                    "date_naissance" to dateNaissance,
                    "telephone" to telephone,
                    "num_cin" to numCin,
                    "sexe" to sexe,
                    "age" to age.toString()
                )

                val result = api.creerUtilisateur(request)

                _registerState.value = if (result.success) {
                    RegisterState.Success("✅ Inscription réussie ! Bienvenue sur Medilink")
                } else {
                    RegisterState.Error(result.message ?: "Erreur lors de l'inscription")
                }
            } catch (e: Exception) {
                _registerState.value = RegisterState.Error(
                    e.message ?: "Erreur de connexion"
                )
            }
        }
    }
}
