package com.example.medilink.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.network.PatientApiService
import com.example.medilink.data.network.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch

class DoctorsListViewModel : ViewModel() {
    private val apiService = RetrofitClient.patientInstance

    private val _medecins = MutableStateFlow<List<PatientApiService.MedecinData>>(emptyList())

    val searchTerm = MutableStateFlow("")
    val selectedSpecialty = MutableStateFlow("Toutes spécialités")

    val filteredMedecins = _medecins

    val filteredMedecinsWithSearch = _medecins
        .combine(searchTerm) { medecins, term ->
            if (term.isBlank()) medecins
            else medecins.filter {
                it.nom.contains(term, ignoreCase = true) ||
                        it.prenom.contains(term, ignoreCase = true)
            }
        }
        .combine(selectedSpecialty) { medecins, specialty ->
            if (specialty == "Toutes spécialités") medecins
            else medecins.filter { it.specialite == specialty }
        }

    init {
        loadMedecins()
    }

    private fun loadMedecins() {
        viewModelScope.launch {
            try {
                println("DEBUG: Tentative de connexion au serveur...")
                val response = apiService.getAllMedecins()
                println("DEBUG: Réponse reçue : ${response.medecins.size} médecins")
                _medecins.value = response.medecins
            } catch (e: Exception) {
                println("DEBUG: ERREUR -> ${e.message}")
                e.printStackTrace()
            }
        }
    }

    fun onSearchTermChange(newTerm: String) {
        searchTerm.value = newTerm
        println("search term updated to $newTerm")
    }

    fun onSpecialtyChange(newSpecialty: String) {
        selectedSpecialty.value = newSpecialty
        println("specialty changed to $newSpecialty")
    }
}