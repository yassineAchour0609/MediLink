package com.example.medilink.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.network.Medecin
import com.example.medilink.data.network.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class MedecinsViewModel : ViewModel() {
    private val api = RetrofitClient.adminInstance

    private val _medecins = MutableStateFlow<List<Medecin>>(emptyList())
    val medecins: StateFlow<List<Medecin>> = _medecins.asStateFlow()

    private val _blockedIds = MutableStateFlow<Set<Int>>(emptySet())
    val blockedIds: StateFlow<Set<Int>> = _blockedIds.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    fun loadMedecins() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = api.getMedecins()
                if (response.success) {
                    _medecins.value = response.medecins
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

    fun blockMedecin(medecinId: Int, reason: String = "Compte suspect") {
        viewModelScope.launch {
            try {
                val response = api.blockAccount(medecinId, reason)
                if (response.success) {
                    _message.value = "Médecin bloqué avec succès"
                    _blockedIds.value = _blockedIds.value + medecinId
                }
            } catch (e: Exception) {
                _message.value = "Erreur: ${e.message}"
            }
        }
    }

    fun unblockMedecin(medecinId: Int) {
        viewModelScope.launch {
            try {
                val response = api.unblockAccount(medecinId)
                if (response.success) {
                    _message.value = "Médecin débloqué avec succès"
                    _blockedIds.value = _blockedIds.value - medecinId
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