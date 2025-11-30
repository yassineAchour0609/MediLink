package com.example.medilink.ui.message

import androidx.benchmark.traceprocessor.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.medilink.viewmodel.DoctorsListViewModel
import com.example.medilink.data.network.PatientApiService
import com.example.medilink.ui.patient.AvailabilityBadge
import androidx.compose.material.icons.filled.Send
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.style.TextAlign

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessageDoctorsScreen(
    onDoctorSelected: (Int) -> Unit,
    onBack: () -> Unit,
    viewModel: DoctorsListViewModel = viewModel()
) {
    val filteredDoctors by viewModel.filteredMedecinsWithSearch.collectAsState(initial = emptyList())
    val searchTerm by viewModel.searchTerm.collectAsState()
    val selectedSpecialty by viewModel.selectedSpecialty.collectAsState()

    val specialties = listOf(
        "Toutes spécialités",
        "Généraliste",
        "Cardiologue",
        "Dermatologue",
        "Pédiatre",
        "Ophtalmologue",
        "ORL",
        "Orthopédiste"
    )

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Choisir un médecin", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Retour"
                        )
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFFF8F9FA))
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Barre de recherche + filtre (réutilisation simplifiée)
                MessageDoctorsSearchFilterBar(
                    searchTerm = searchTerm,
                    onSearchChange = { viewModel.onSearchTermChange(it) },
                    selectedSpecialty = selectedSpecialty,
                    onSpecialtyChange = { viewModel.onSpecialtyChange(it) },
                    specialties = specialties
                )

                Spacer(modifier = Modifier.height(8.dp))

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredDoctors) { doctor ->
                        MessageDoctorCard(
                            doctor = doctor,
                            onMessageClick = { onDoctorSelected(doctor.idUtilisateur) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun MessageDoctorsSearchFilterBar(
    searchTerm: String,
    onSearchChange: (String) -> Unit,
    selectedSpecialty: String,
    onSpecialtyChange: (String) -> Unit,
    specialties: List<String>
) {
    var textState by remember(searchTerm) { mutableStateOf(searchTerm) }
    var expandedDropdown by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
            .background(Color.White, RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedTextField(
            value = textState,
            onValueChange = {
                textState = it
                onSearchChange(it)
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Rechercher un médecin...") },
            singleLine = true
        )

        Box(modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = { expandedDropdown = !expandedDropdown },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = Color(0xFF667EEA)
                )
            ) {
                Text(
                    selectedSpecialty,
                    fontSize = 14.sp,
                    color = Color(0xFF667EEA),
                    modifier = Modifier.weight(1f),
                    textAlign = TextAlign.Start
                )
                Text("▼", fontSize = 12.sp, color = Color(0xFF667EEA))
            }

            DropdownMenu(
                expanded = expandedDropdown,
                onDismissRequest = { expandedDropdown = false },
                modifier = Modifier.fillMaxWidth()
            ) {
                specialties.forEach { specialty ->
                    DropdownMenuItem(
                        onClick = {
                            onSpecialtyChange(specialty)
                            expandedDropdown = false
                        },
                        text = { Text(text = specialty, fontSize = 13.sp) }
                    )
                }
            }
        }
    }
}

@Composable
private fun MessageDoctorCard(
    doctor: PatientApiService.MedecinData,
    onMessageClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    Text(
                        "${doctor.prenom} ${doctor.nom}",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF2C3E50)
                    )
                    Text(
                        doctor.specialite,
                        fontSize = 13.sp,
                        color = Color(0xFF667EEA)
                    )
                }
                AvailabilityBadge(isAvailable = (doctor.disponibilite == 1))
            }

            Text(
                doctor.cabinet,
                fontSize = 12.sp,
                color = Color(0xFF7F8C8D)
            )

            Button(
                onClick = onMessageClick,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(42.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF667EEA),
                    contentColor = Color.White
                )
            ) {
                Icon(
                    Icons.Default.Send,
                    contentDescription = "Message",
                    tint = Color.White,
                    modifier = Modifier.height(18.dp)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text("Envoyer un message", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}
