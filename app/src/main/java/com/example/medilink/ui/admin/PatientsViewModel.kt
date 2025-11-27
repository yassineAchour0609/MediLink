package com.example.medilink.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.network.RetrofitClient
import com.example.medilink.data.network.UtilisateurData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PatientsViewModel : ViewModel() {
    private val api = RetrofitClient.adminInstance

    private val _patients = MutableStateFlow<List<UtilisateurData>>(emptyList())
    val patients: StateFlow<List<UtilisateurData>> = _patients.asStateFlow()

    private val _blockedIds = MutableStateFlow<Set<Int>>(emptySet())
    val blockedIds: StateFlow<Set<Int>> = _blockedIds.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    fun loadPatients(token: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = api.getPatients("Bearer $token")
                if (response.success) {
                    _patients.value = response.utilisateurs.filter { it.role == "patient" }
                }

                // Charger les comptes bloqués
                val blockedResponse = api.getBlockedAccounts()
                if (blockedResponse.success) {
                    _blockedIds.value = blockedResponse.data.map { it.user_id }.toSet()
                }
            } catch (e: Exception) {
                _message.value = "Erreur: ${e.message}"
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun blockPatient(patientId: Int, reason: String = "Compte suspect") {
        viewModelScope.launch {
            try {
                val response = api.blockAccount(patientId, reason)
                if (response.success) {
                    _message.value = "Patient bloqué avec succès"
                    _blockedIds.value = _blockedIds.value + patientId
                }
            } catch (e: Exception) {
                _message.value = "Erreur: ${e.message}"
            }
        }
    }

    fun unblockPatient(patientId: Int) {
        viewModelScope.launch {
            try {
                val response = api.unblockAccount(patientId)
                if (response.success) {
                    _message.value = "Patient débloqué avec succès"
                    _blockedIds.value = _blockedIds.value - patientId
                }
            } catch (e: Exception) {
                _message.value = "Erreur: ${e.message}"
            }
        }
    }

    fun clearMessage() {
        _message.value = null
    }
}