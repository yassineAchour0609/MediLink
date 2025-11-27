package com.example.medilink.ui.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.network.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AdminStats(
    val totalMedecins: Int = 0,
    val totalPatients: Int = 0
)

class AdminViewModel : ViewModel() {
    private val api = RetrofitClient.statsInstance

    private val _stats = MutableStateFlow(AdminStats())
    val stats: StateFlow<AdminStats> = _stats.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun loadStats(token: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = api.getAllUtilisateurs("Bearer $token")
                if (response.success) {
                    val medecins = response.utilisateurs.count { it.role == "medecin" }
                    val patients = response.utilisateurs.count { it.role == "patient" }

                    _stats.value = AdminStats(
                        totalMedecins = medecins,
                        totalPatients = patients
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
}
