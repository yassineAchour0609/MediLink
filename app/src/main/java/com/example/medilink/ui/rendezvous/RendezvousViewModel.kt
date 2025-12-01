package com.example.medilink.ui.rendezvous

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.network.RetrofitClient
import com.example.medilink.data.model.Rendezvous
import com.example.medilink.data.model.UpdateRendezvousRequest
import com.example.medilink.data.model.CreateRendezvousRequest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import android.util.Log
import retrofit2.HttpException
import java.io.IOException

class RendezvousViewModel : ViewModel() {

    private val api = RetrofitClient.rendezvousInstance

    private val _rendezvousList = MutableStateFlow<List<Rendezvous>>(emptyList())
    val rendezvousList: StateFlow<List<Rendezvous>> = _rendezvousList

    private val _selectedDate = MutableStateFlow("")
    val selectedDate: StateFlow<String> = _selectedDate

    private val _selectedTime = MutableStateFlow("")
    val selectedTime: StateFlow<String> = _selectedTime

    private val _showCreateModal = MutableStateFlow(false)
    val showCreateModal: StateFlow<Boolean> = _showCreateModal

    private val _showEditModal = MutableStateFlow(false)
    val showEditModal: StateFlow<Boolean> = _showEditModal

    private val _selectedRendezvous = MutableStateFlow<Rendezvous?>(null)
    val selectedRendezvous: StateFlow<Rendezvous?> = _selectedRendezvous

    private val _errorMessage = MutableStateFlow("")
    val errorMessage: StateFlow<String> = _errorMessage

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private var currentPatientId: Int? = null
    private var currentMedecinId: Int? = null

    fun loadRendezvous(patientId: Int) {
        currentPatientId = patientId
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.getRendezvousByPatientId(patientId)
                if (response.success) {
                    _rendezvousList.value = response.rendezvous ?: emptyList()
                } else {
                    _errorMessage.value = response.message ?: "Erreur de chargement"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun openCreateModal(medecinId: Int) {
        currentMedecinId = medecinId
        _selectedDate.value = ""
        _selectedTime.value = ""
        _showCreateModal.value = true
    }

    fun closeCreateModal() {
        _showCreateModal.value = false
        _selectedDate.value = ""
        _selectedTime.value = ""
        currentMedecinId = null
    }

    fun createRendezvous() {
        if (currentPatientId == null || currentMedecinId == null ||
            selectedDate.value.isBlank() || selectedTime.value.isBlank()
        ) {
            _errorMessage.value = "Veuillez remplir tous les champs"
            Log.e(
                "RendezvousVM",
                "Champs manquants: patientId=$currentPatientId, medecinId=$currentMedecinId, date=${selectedDate.value}, heure=${selectedTime.value}"
            )
            return
        }

        viewModelScope.launch {
            try {
                _isLoading.value = true

                Log.d(
                    "RendezvousVM",
                    "createRendezvous() START => idMedecin=$currentMedecinId idPatient=$currentPatientId date=${selectedDate.value} heure=${selectedTime.value}"
                )

                val req = CreateRendezvousRequest(
                    idMedecin = currentMedecinId!!,
                    idPatient = currentPatientId!!,
                    date = selectedDate.value,
                    heure = selectedTime.value,
                    statut = "en attente"
                )

                Log.d("RendezvousVM", "Request body = $req")

                val response = api.createRendezvous(req)

                val rdvCount = response.rendezvous?.size ?: 0
                Log.d(
                    "RendezvousVM",
                    "API response success=${response.success} message=${response.message} nbRdv=$rdvCount"
                )

                if (response.success) {
                    closeCreateModal()

                    currentPatientId?.let {
                        Log.d("RendezvousVM", "Rechargement de la liste après création")
                        loadRendezvous(it)
                    }

                    _errorMessage.value = "Rendez-vous créé avec succès"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de la création"
                    Log.e(
                        "RendezvousVM",
                        "Echec création RDV côté API: ${response.message}"
                    )
                }
            } catch (e: HttpException) {
                val code = e.code()
                val body = e.response()?.errorBody()?.string()
                _errorMessage.value = "Erreur serveur ($code)"
                Log.e(
                    "RendezvousVM",
                    "HTTP ERROR $code lors de createRendezvous, body=$body",
                    e
                )
            } catch (e: IOException) {
                _errorMessage.value = "Problème de connexion réseau"
                Log.e("RendezvousVM", "NETWORK ERROR lors de createRendezvous", e)
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
                Log.e("RendezvousVM", "UNKNOWN ERROR lors de createRendezvous", e)
            } finally {
                _isLoading.value = false
                Log.d("RendezvousVM", "createRendezvous() END")
            }
        }
    }

    fun openEditModal(rdv: Rendezvous) {
        _selectedRendezvous.value = rdv
        _selectedDate.value = rdv.date.orEmpty()
        _selectedTime.value = rdv.heure.orEmpty()
        _showEditModal.value = true
    }

    fun closeEditModal() {
        _showEditModal.value = false
        _selectedRendezvous.value = null
        _selectedDate.value = ""
        _selectedTime.value = ""
    }

    fun updateRendezvous() {
        val rdv = selectedRendezvous.value ?: return

        if (selectedDate.value.isBlank() || selectedTime.value.isBlank()) {
            _errorMessage.value = "Veuillez remplir tous les champs"
            return
        }

        val idMedecin = rdv.idMedecin ?: run {
            _errorMessage.value = "Médecin introuvable pour ce rendez-vous"
            return
        }

        val idPatient = rdv.idPatient ?: currentPatientId ?: run {
            _errorMessage.value = "Patient introuvable pour ce rendez-vous"
            return
        }

        viewModelScope.launch {
            try {
                _isLoading.value = true

                val req = UpdateRendezvousRequest(
                    date = selectedDate.value,
                    heure = selectedTime.value,
                    idMedecin = idMedecin,
                    idPatient = idPatient,
                    statut = rdv.statut ?: "en attente"
                )

                val response = api.updateRendezvous(rdv.idRdv!!, req)

                if (response.success) {
                    closeEditModal()
                    currentPatientId?.let { loadRendezvous(it) }
                    _errorMessage.value = response.message ?: "Rendez-vous mis à jour"
                } else {
                    _errorMessage.value =
                        response.message ?: "Erreur lors de la mise à jour"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun cancelRendezvous(idRdv: Int) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.cancelRendezvous(idRdv)
                if (response.success) {
                    currentPatientId?.let { loadRendezvous(it) }
                    _errorMessage.value = "Rendez-vous annulé"
                } else {
                    _errorMessage.value =
                        response.message ?: "Erreur lors de l'annulation"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun onDateChange(date: String) {
        _selectedDate.value = date
    }

    fun onTimeChange(time: String) {
        _selectedTime.value = time
    }
}
