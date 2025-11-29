package com.example.medilink.ui.patient

import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.medilink.viewmodel.DoctorsListViewModel
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.TextField
import androidx.compose.material3.Text
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.medilink.data.network.PatientApiService

@Composable
fun DoctorsListScreen(
    viewModel: DoctorsListViewModel = viewModel(),
    onNavigateToAppointment: (doctorId: Int, doctorName: String) -> Unit,
    onBack: () -> Unit
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

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color(0xFF667EEA), Color(0xFF764BA2))
                        )
                    )
                    .padding(24.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 8.dp)
                    ) {
                        Text(
                            "Liste des Médecins",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            "Trouvez le spécialiste qu'il vous faut",
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            // Contenu scrollable (un seul LazyColumn)
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                contentPadding = PaddingValues(vertical = 16.dp)
            ) {
                item {
                    SearchFilterBar(
                        searchTerm = searchTerm,
                        onSearchChange = { viewModel.onSearchTermChange(it) },
                        selectedSpecialty = selectedSpecialty,
                        onSpecialtyChange = { viewModel.onSpecialtyChange(it) },
                        specialties = specialties
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }

                item {
                    StatsMiniBar(count = filteredDoctors.size)
                    Spacer(modifier = Modifier.height(12.dp))
                }

                items(filteredDoctors) { doctor ->
                    DoctorCard(
                        doctor = doctor,
                        onRdvClick = {
                            onNavigateToAppointment(
                                doctor.idUtilisateur,
                                "${doctor.prenom} ${doctor.nom}"
                            )
                        }
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }
    }
}

@Composable
private fun SearchFilterBar(
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
            .background(Color.White, RoundedCornerShape(16.dp))
            .padding(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Barre de recherche
        TextField(
            value = textState,
            onValueChange = {
                textState = it
                onSearchChange(it)
            },
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF8F9FA), RoundedCornerShape(12.dp)),
            label = { Text("Rechercher un médecin...", fontSize = 14.sp) },
            leadingIcon = {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "Search",
                    tint = Color(0xFF7F8C8D),
                    modifier = Modifier.size(20.dp)
                )
            },
            singleLine = true,
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color(0xFFF8F9FA),
                unfocusedContainerColor = Color(0xFFF8F9FA),
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent
            )
        )

        // Dropdown spécialités
        Box(modifier = Modifier.fillMaxWidth()) {
            Button(
                onClick = { expandedDropdown = !expandedDropdown },
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, Color(0xFFE9ECEF), RoundedCornerShape(12.dp)),
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
private fun StatsMiniBar(count: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                "📋",
                fontSize = 20.sp,
                modifier = Modifier.width(24.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                "$count médecins disponibles",
                fontSize = 13.sp,
                color = Color(0xFF7F8C8D),
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
private fun DoctorCard(
    doctor: PatientApiService.MedecinData,
    onRdvClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color(0xFF667EEA), Color(0xFF764BA2))
                        )
                    )
                    .padding(16.dp)
            ) {
                AvailabilityBadge(
                    isAvailable = (doctor.disponibilite == 1)
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    "${doctor.prenom} ${doctor.nom}",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2C3E50)
                )

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("🏥", fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        doctor.specialite,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF667EEA)
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = "Location",
                        tint = Color(0xFF95A5A6),
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        doctor.cabinet,
                        fontSize = 12.sp,
                        color = Color(0xFF7F8C8D)
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                ) {
                    Text("💰", fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        "${doctor.tarif_consultation.toInt()} TND",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFF2C3E50)
                    )
                }

                Button(
                    onClick = onRdvClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(45.dp)
                        .padding(top = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF51CF66),
                        contentColor = Color.White
                    )
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            Icons.Default.DateRange,
                            contentDescription = "Appointment",
                            tint = Color.White,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            "Prendre RDV",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AvailabilityBadge(isAvailable: Boolean) {
    val backgroundColor = if (isAvailable) Color(0xFF51CF66) else Color(0xFFFF6B6B)
    val text = if (isAvailable) "Disponible" else "Indisponible"

    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(Color.White.copy(alpha = 0.9f))
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(backgroundColor, shape = CircleShape)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = text,
            color = backgroundColor,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp
        )
    }
}
