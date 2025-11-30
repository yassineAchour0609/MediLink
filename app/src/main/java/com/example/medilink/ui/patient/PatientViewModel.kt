package com.example.medilink.ui.patient

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.network.RetrofitClient
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Date

// ui/patient/PatientViewModel.kt (version finale enrichie)
data class ProchainRdvUi(
    val medecinNom: String,
    val medecinPrenom: String,
    val dateHeure: Date, // Make sure this type matches the API response
    val motif: String?
)
data class PatientDashboardData(
    val nom: String = "",
    val prenom: String = "",
    val photoUrl: String? = null,
    val prochainRdv: ProchainRdvUi? = null,
    val unreadMessages: Int = 0,
    val derniereMajDossier: String? = null,        // ← Nouveau
    val groupeSanguin: String? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

class PatientViewModel : ViewModel() {

    private val patientApi = RetrofitClient.patientInstance
    private val rdvApi = RetrofitClient.rendezvousInstance
    private val messageApi = RetrofitClient.MessageInstance
    private val dossierApi = RetrofitClient.dossierMedicalInstance  // ← Ajout

    private val _dashboardData = MutableStateFlow(PatientDashboardData())
    val dashboardData: StateFlow<PatientDashboardData> = _dashboardData.asStateFlow()

    fun loadDashboard(patientId: Int) {
        _dashboardData.value = _dashboardData.value.copy(isLoading = true)

        viewModelScope.launch {
            try {
                // Launch all network requests in parallel
                val patientInfoDeferred = async { patientApi.getPatientInfo(patientId) }
                val patientResponse = patientInfoDeferred.await()

                // Extract data from response bodies
                val patient = patientResponse.body()?.data

                _dashboardData.value = PatientDashboardData(
                    nom = patient?.nom.orEmpty(),
                    prenom = patient?.prenom.orEmpty(),
                    photoUrl = patient?.photoUrl,
                    isLoading = false
                )

            } catch (e: Exception) {
                _dashboardData.value = _dashboardData.value.copy(isLoading = false, error = e.message)
            }
        }
    }
}