package com.example.medilink.ui.dossiermedical

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.model.*
import com.example.medilink.data.network.RetrofitClient
import com.example.medilink.data.network.PatientApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import android.util.Log
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class DossierMedicalViewModel : ViewModel() {

    private val api = RetrofitClient.dossierMedicalInstance

    private val _dossier = MutableStateFlow<DossierMedical?>(null)
    val dossier: StateFlow<DossierMedical?> = _dossier

    private val _analyses = MutableStateFlow<List<Analyse>>(emptyList())
    val analyses: StateFlow<List<Analyse>> = _analyses

    private val _ordonnances = MutableStateFlow<List<Ordonnance>>(emptyList())
    val ordonnances: StateFlow<List<Ordonnance>> = _ordonnances

    private val _notes = MutableStateFlow<List<NoteMedicale>>(emptyList())
    val notes: StateFlow<List<NoteMedicale>> = _notes

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _errorMessage = MutableStateFlow("")
    val errorMessage: StateFlow<String> = _errorMessage

    private val _selectedTab = MutableStateFlow(0) // 0: Infos, 1: Analyses, 2: Ordonnances, 3: Notes
    val selectedTab: StateFlow<Int> = _selectedTab

    private val _showEditDossierDialog = MutableStateFlow(false)
    val showEditDossierDialog: StateFlow<Boolean> = _showEditDossierDialog

    private val _showAddAnalyseDialog = MutableStateFlow(false)
    val showAddAnalyseDialog: StateFlow<Boolean> = _showAddAnalyseDialog

    private val _showAddOrdonnanceDialog = MutableStateFlow(false)
    val showAddOrdonnanceDialog: StateFlow<Boolean> = _showAddOrdonnanceDialog

    private val _showAddNoteDialog = MutableStateFlow(false)
    val showAddNoteDialog: StateFlow<Boolean> = _showAddNoteDialog

    private val _showEditAnalyseDialog = MutableStateFlow(false)
    val showEditAnalyseDialog: StateFlow<Boolean> = _showEditAnalyseDialog
    
    private val _selectedAnalyse = MutableStateFlow<Analyse?>(null)
    val selectedAnalyse: StateFlow<Analyse?> = _selectedAnalyse

    private val _medecins = MutableStateFlow<List<PatientApiService.MedecinData>>(emptyList())
    val medecins: StateFlow<List<PatientApiService.MedecinData>> = _medecins

    private val patientApi = RetrofitClient.patientInstance
    private var currentPatientId: Int? = null
    
    init {
        loadMedecins()
    }
    
    private fun loadMedecins() {
        viewModelScope.launch {
            try {
                val response = patientApi.getAllMedecins()
                if (response.success) {
                    _medecins.value = response.medecins
                }
            } catch (e: Exception) {
                Log.e("DossierMedicalVM", "Error loading medecins", e)
            }
        }
    }

    fun loadDossier(patientId: Int) {
        currentPatientId = patientId
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.getDossierByPatient(patientId)
                if (response.success) {
                    _dossier.value = response.dossier
                    _analyses.value = response.analyses ?: emptyList()
                    _ordonnances.value = response.ordonnances ?: emptyList()
                    _notes.value = response.notes ?: emptyList()
                } else {
                    _errorMessage.value = response.message ?: "Erreur de chargement"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
                Log.e("DossierMedicalVM", "Error loading dossier", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun updateDossier(
        groupeSanguin: String?,
        antecedentsMedicaux: String?,
        traitementsEnCours: String?,
        vaccinations: String?,
        diagnostic: String?
    ) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val request = UpdateDossierRequest(
                    groupe_sanguin = groupeSanguin,
                    antecedents_medicaux = antecedentsMedicaux,
                    traitements_en_cours = traitementsEnCours,
                    vaccinations = vaccinations,
                    diagnostic = diagnostic
                )
                val response = api.updateDossier(patientId, request)
                if (response.success) {
                    loadDossier(patientId)
                    _showEditDossierDialog.value = false
                    _errorMessage.value = "Dossier mis à jour avec succès"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de la mise à jour"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
                Log.e("DossierMedicalVM", "Error updating dossier", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun addAnalyse(
        idMedecin: Int?,
        typeAnalyse: String,
        dateAnalyse: String,
        resultats: String?,
        laboratoire: String?,
        notes: String?,
        documentFile: File? = null
    ) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                _isLoading.value = true

                val idMedecinPart = idMedecin?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
                val typeAnalysePart = typeAnalyse.toRequestBody("text/plain".toMediaTypeOrNull())
                val dateAnalysePart = dateAnalyse.toRequestBody("text/plain".toMediaTypeOrNull())
                val resultatsPart = resultats?.toRequestBody("text/plain".toMediaTypeOrNull())
                val laboratoirePart = laboratoire?.toRequestBody("text/plain".toMediaTypeOrNull())
                val notesPart = notes?.toRequestBody("text/plain".toMediaTypeOrNull())

                val documentPart = documentFile?.let {
                    val requestFile = it.asRequestBody("application/pdf".toMediaTypeOrNull())
                    MultipartBody.Part.createFormData("document", it.name, requestFile)
                }

                val response = api.addAnalyse(
                    patientId,
                    idMedecinPart,
                    typeAnalysePart,
                    dateAnalysePart,
                    resultatsPart,
                    laboratoirePart,
                    notesPart,
                    documentPart
                )

                if (response.success) {
                    loadDossier(patientId)
                    _showAddAnalyseDialog.value = false
                    _errorMessage.value = "Analyse ajoutée avec succès"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de l'ajout"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
                Log.e("DossierMedicalVM", "Error adding analyse", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun deleteAnalyse(idAnalyse: Int) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.deleteAnalyse(patientId, idAnalyse)
                if (response.success) {
                    loadDossier(patientId)
                    _errorMessage.value = "Analyse supprimée"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de la suppression"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun addOrdonnance(
        idMedecin: Int?,
        dateOrdonnance: String,
        medicaments: String,
        posologie: String?,
        dureeTraitement: String?,
        notes: String?,
        documentFile: File? = null
    ) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                _isLoading.value = true

                val idMedecinPart = idMedecin?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
                val dateOrdonnancePart = dateOrdonnance.toRequestBody("text/plain".toMediaTypeOrNull())
                val medicamentsPart = medicaments.toRequestBody("text/plain".toMediaTypeOrNull())
                val posologiePart = posologie?.toRequestBody("text/plain".toMediaTypeOrNull())
                val dureeTraitementPart = dureeTraitement?.toRequestBody("text/plain".toMediaTypeOrNull())
                val notesPart = notes?.toRequestBody("text/plain".toMediaTypeOrNull())

                val documentPart = documentFile?.let {
                    val requestFile = it.asRequestBody("application/pdf".toMediaTypeOrNull())
                    MultipartBody.Part.createFormData("document", it.name, requestFile)
                }

                val response = api.addOrdonnance(
                    patientId,
                    idMedecinPart,
                    dateOrdonnancePart,
                    medicamentsPart,
                    posologiePart,
                    dureeTraitementPart,
                    notesPart,
                    documentPart
                )

                if (response.success) {
                    loadDossier(patientId)
                    _showAddOrdonnanceDialog.value = false
                    _errorMessage.value = "Ordonnance ajoutée avec succès"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de l'ajout"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
                Log.e("DossierMedicalVM", "Error adding ordonnance", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun deleteOrdonnance(idOrdonnance: Int) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.deleteOrdonnance(patientId, idOrdonnance)
                if (response.success) {
                    loadDossier(patientId)
                    _errorMessage.value = "Ordonnance supprimée"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de la suppression"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun addNote(idMedecin: Int, typeNote: String?, contenuNote: String) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val request = CreateNoteRequest(
                    idMedecin = idMedecin,
                    type_note = typeNote,
                    contenu_note = contenuNote
                )
                val response = api.addNote(patientId, request)
                if (response.success) {
                    loadDossier(patientId)
                    _showAddNoteDialog.value = false
                    _errorMessage.value = "Note ajoutée avec succès"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de l'ajout"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun deleteNote(idNote: Int) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                _isLoading.value = true
                val response = api.deleteNote(patientId, idNote)
                if (response.success) {
                    loadDossier(patientId)
                    _errorMessage.value = "Note supprimée"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de la suppression"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun selectTab(tabIndex: Int) {
        _selectedTab.value = tabIndex
    }

    fun openEditDossierDialog() {
        _showEditDossierDialog.value = true
    }

    fun closeEditDossierDialog() {
        _showEditDossierDialog.value = false
    }

    fun openAddAnalyseDialog() {
        _showAddAnalyseDialog.value = true
    }

    fun closeAddAnalyseDialog() {
        _showAddAnalyseDialog.value = false
    }

    fun openAddOrdonnanceDialog() {
        _showAddOrdonnanceDialog.value = true
    }

    fun closeAddOrdonnanceDialog() {
        _showAddOrdonnanceDialog.value = false
    }

    fun openAddNoteDialog() {
        _showAddNoteDialog.value = true
    }

    fun closeAddNoteDialog() {
        _showAddNoteDialog.value = false
    }

    fun clearMessage() {
        _errorMessage.value = ""
    }
    
    fun openEditAnalyseDialog(analyse: Analyse) {
        _selectedAnalyse.value = analyse
        _showEditAnalyseDialog.value = true
    }
    
    fun closeEditAnalyseDialog() {
        _showEditAnalyseDialog.value = false
        _selectedAnalyse.value = null
    }
    
    fun updateAnalyse(
        idAnalyse: Int,
        idMedecin: Int?,
        typeAnalyse: String?,
        dateAnalyse: String?,
        resultats: String?,
        laboratoire: String?,
        notes: String?,
        documentFile: File? = null
    ) {
        val patientId = currentPatientId ?: return
        viewModelScope.launch {
            try {
                _isLoading.value = true

                val idMedecinPart = idMedecin?.toString()?.toRequestBody("text/plain".toMediaTypeOrNull())
                val typeAnalysePart = typeAnalyse?.toRequestBody("text/plain".toMediaTypeOrNull())
                val dateAnalysePart = dateAnalyse?.toRequestBody("text/plain".toMediaTypeOrNull())
                val resultatsPart = resultats?.toRequestBody("text/plain".toMediaTypeOrNull())
                val laboratoirePart = laboratoire?.toRequestBody("text/plain".toMediaTypeOrNull())
                val notesPart = notes?.toRequestBody("text/plain".toMediaTypeOrNull())

                val documentPart = documentFile?.let {
                    val requestFile = it.asRequestBody("application/pdf".toMediaTypeOrNull())
                    MultipartBody.Part.createFormData("document", it.name, requestFile)
                }

                val response = api.updateAnalyse(
                    patientId,
                    idAnalyse,
                    typeAnalysePart,
                    dateAnalysePart,
                    resultatsPart,
                    laboratoirePart,
                    idMedecinPart,
                    notesPart,
                    documentPart
                )

                if (response.success) {
                    loadDossier(patientId)
                    _showEditAnalyseDialog.value = false
                    _selectedAnalyse.value = null
                    _errorMessage.value = "Analyse mise à jour avec succès"
                } else {
                    _errorMessage.value = response.message ?: "Erreur lors de la mise à jour"
                }
            } catch (e: Exception) {
                _errorMessage.value = "Erreur : ${e.message}"
                Log.e("DossierMedicalVM", "Error updating analyse", e)
            } finally {
                _isLoading.value = false
            }
        }
    }
}

