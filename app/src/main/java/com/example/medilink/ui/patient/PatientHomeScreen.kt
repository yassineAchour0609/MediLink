package com.example.medilink.ui.patient

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import java.text.SimpleDateFormat
import java.util.*

// This should be your single source of truth for the Patient Dashboard.
// I've created a placeholder PatientViewModel based on your previous queries.
// All other ViewModels (Rdv, Msg, etc.) should be used inside this one.
import com.example.medilink.ui.patient.PatientViewModel
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PatientHomeScreen(
    userId: Int,
    userNom: String,
    userPrenom: String,
    viewModel: PatientViewModel = viewModel(),
    onNavigateToMessages: () -> Unit,
    onNavigateToRendezvous: () -> Unit,
    onNavigateToDossier: () -> Unit,
    onLogout: () -> Unit,
) {
    // Collect the single state object from the main ViewModel.
    val dashboardState by viewModel.dashboardData.collectAsState()
    LaunchedEffect(Unit) {
        viewModel.initFromLogin(userNom, userPrenom)
    }

    // Trigger the data loading process once when the screen is first composed
    // or if the userId changes.
    LaunchedEffect(userId) {
        viewModel.loadDashboard(userId)
    }

    fun formatDate(date: Date): String {
        val formatter = SimpleDateFormat("EEEE d MMMM yyyy 'à' HH:mm", Locale.FRENCH)
        return formatter.format(date).replaceFirstChar { it.titlecase(Locale.FRENCH) }
    }
    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = {
                    Text("Medilink", fontWeight = FontWeight.Bold)
                }
            )
        },
        bottomBar = {
            // Bouton pill de déconnexion collé en bas
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Button(
                    onClick = onLogout,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(24.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF2C3E50),
                        contentColor = Color.White
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.ExitToApp,
                        contentDescription = "Déconnexion"
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Se déconnecter")
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)    // laisse la place en bas pour le bouton
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // --- Card: Bienvenue ---
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(8.dp)
                ) {
                    Column(modifier = Modifier.padding(24.dp)) {
                        // Use the name from the ViewModel state.
                        Text(
                            "Bonjour, ${dashboardState.prenom}!",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF2C3E50)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text("Voici votre résumé santé du jour", color = Color.Gray)
                    }
                }
            }

            // --- Card: Prochain rendez-vous ---
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF667EEA).copy(alpha = 0.1f)),
                    shape = RoundedCornerShape(16.dp),
                    onClick = onNavigateToRendezvous // Make card clickable
                ) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Default.DateRange,
                                contentDescription = "Prochain rendez-vous",
                                tint = Color(0xFF667EEA),
                                modifier = Modifier.size(32.dp)
                            )
                            Spacer(modifier = Modifier.width(16.dp))
                            Text(
                                "Prochain rendez-vous",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 18.sp
                            )
                        }
                        Spacer(modifier = Modifier.height(12.dp))

                        // Use the data from the ViewModel state
                        val rdv = dashboardState.prochainRdv
                        if (rdv != null) {
                            Column {
                                Text(
                                    "${rdv.medecinNom} ${rdv.medecinPrenom}",
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    formatDate(rdv.dateHeure),
                                    color = Color.Gray
                                ) // Use a helper function
                                Text(rdv.motif ?: "Consultation", color = Color(0xFF667EEA))
                            }
                        } else {
                            Text(
                                "Aucun rendez-vous à venir",
                                color = Color.Gray,
                                fontStyle = FontStyle.Italic
                            )
                        }
                    }
                }
            }

            // --- Card: Messages non lus ---
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0)),
                    shape = RoundedCornerShape(16.dp),
                    onClick = onNavigateToMessages // Make card clickable
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(20.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Send, "Messages", tint = Color(0xFFFF9800))
                            Spacer(Modifier.width(16.dp))
                            Column {
                                Text("Messagerie", fontWeight = FontWeight.SemiBold)
                                Text("${dashboardState.unreadMessages} message(s) non lu(s)")
                            }
                        }
                        Text("Voir", color = Color(0xFFFF9800), fontWeight = FontWeight.Bold)
                    }
                }
            }


            // --- Card: Dossier Médical ---
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF3E5F5)),
                    shape = RoundedCornerShape(16.dp),
                    onClick = onNavigateToDossier // Make card clickable
                ) {
                    Row(
                        modifier = Modifier.padding(20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Edit, "Dossier médical", tint = Color(0xFF9C27B0))
                        Spacer(Modifier.width(16.dp))
                        Column {
                            Text("Dossier médical", fontWeight = FontWeight.SemiBold)
                            dashboardState.derniereMajDossier?.let {
                                Text("Mis à jour le $it", color = Color.Gray)
                            }
                            dashboardState.groupeSanguin?.let {
                                Text(
                                    "Groupe sanguin : $it",
                                    color = Color(0xFF9C27B0),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }

            // Handle loading and error states
            item {
                if (dashboardState.isLoading) {
                    Box(
                        modifier = Modifier.fillMaxWidth().padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else if (dashboardState.error != null) {
                    Text(
                        text = "Erreur: ${dashboardState.error}",
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(16.dp)
                    )
                }
            }
        }
        // Helper function to format date, you can place this at the bottom of the file or in a separate utility file
    }
}