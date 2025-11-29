@file:OptIn(ExperimentalMaterial3Api::class)
package com.example.medilink.ui.rendezvous

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.CenterAlignedTopAppBar

import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import com.example.medilink.data.model.Rendezvous
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.viewmodel.compose.viewModel
import java.util.Calendar

@Composable
fun RendezvousScreen(
    patientId: Int,
    medecinId: Int = 0,
    onBack: () -> Unit,
    viewModel: RendezvousViewModel = viewModel()
)  {
    val rendezvousList by viewModel.rendezvousList.collectAsState(initial = emptyList())
    val showCreateModal by viewModel.showCreateModal.collectAsState()
    val showEditModal by viewModel.showEditModal.collectAsState()
    val selectedDate by viewModel.selectedDate.collectAsState()
    val selectedTime by viewModel.selectedTime.collectAsState()
    val selectedRendezvous by viewModel.selectedRendezvous.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()

    LaunchedEffect(patientId, medecinId) {
        viewModel.loadRendezvous(patientId)
        if (medecinId != 0) {
            viewModel.openCreateModal(medecinId)
        }
    }
    val rdvList = rendezvousList ?: emptyList()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mes Rendez-vous", color = Color.White) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF667EEA)
                ),
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.Default.ArrowBack,
                            contentDescription = "Retour",
                            tint = Color.White
                        )
                    }
                }
            )
        }
    ){ padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .background(Color(0xFFF8F9FA))   // ou la couleur que tu veux
                .padding(16.dp)        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            } else if (rendezvousList.isEmpty()) {
                Text(
                    "Aucun rendez-vous",
                    modifier = Modifier
                        .align(Alignment.CenterHorizontally)
                        .padding(16.dp),
                    color = Color.Gray
                )
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(rendezvousList.size) { index ->
                        val rdv = rendezvousList[index]
                        RendezvousCard(
                            rendezvous = rdv,
                            onEdit = { viewModel.openEditModal(rdv) },
                            onCancel = { viewModel.cancelRendezvous(rdv.idRdv!!) }
                        )
                    }
                }
            }

            if (errorMessage.isNotEmpty()) {
                Text(
                    errorMessage,
                    color = Color.Red,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }
        }
    }

    if (showCreateModal) {
        RendezvousCreateModalWithCalendar(
            selectedDate = selectedDate,
            selectedTime = selectedTime,
            onDateChange = { viewModel.onDateChange(it) },
            onTimeChange = { viewModel.onTimeChange(it) },
            onSubmit = { viewModel.createRendezvous() },
            onClose = { viewModel.closeCreateModal() }
        )
    }

    if (showEditModal && selectedRendezvous != null) {
        RendezvousEditModalWithCalendar(
            rendezvous = selectedRendezvous!!,
            selectedDate = selectedDate,
            selectedTime = selectedTime,
            onDateChange = { viewModel.onDateChange(it) },
            onTimeChange = { viewModel.onTimeChange(it) },
            onSubmit = { viewModel.updateRendezvous() },
            onClose = { viewModel.closeEditModal() }
        )
    }
}

@Composable
fun RendezvousCard(
    rendezvous: Rendezvous,
    onEdit: () -> Unit,
    onCancel: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(4.dp)
    ) {
        Column(
            modifier = Modifier
                .background(Color.White)
                .padding(16.dp)
        ) {
            Text(
                text = "Dr ${rendezvous.medecinPrenom} ${rendezvous.medecinNom}",
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
            Text(
                text = rendezvous.medecinSpecialite ?: "Spécialité",
                color = Color.Gray,
                fontSize = 12.sp
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    Icons.Default.DateRange,
                    contentDescription = null,
                    tint = Color(0xFF667EEA),
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(text = rendezvous.date ?: "", fontSize = 12.sp)
                Spacer(modifier = Modifier.width(16.dp))

                Spacer(modifier = Modifier.width(4.dp))
                Text(text = rendezvous.heure ?: "", fontSize = 12.sp)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Statut : ${rendezvous.statut}",
                color = when (rendezvous.statut) {
                    "confirmé" -> Color.Green
                    "en attente" -> Color(0xFFFFA500)
                    "annulé" -> Color.Red
                    else -> Color.Gray
                },
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = onEdit,
                    modifier = Modifier
                        .weight(1f)
                        .height(36.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3498DB))
                ) {
                    Text("Modifier", color = Color.White, fontSize = 12.sp)
                }
                Button(
                    onClick = onCancel,
                    modifier = Modifier
                        .weight(1f)
                        .height(36.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE74C3C))
                ) {
                    Text("Annuler", color = Color.White, fontSize = 12.sp)
                }
            }
        }
    }
}

// Helper pour le mois
data class SimpleYearMonth(val year: Int, val month: Int) {
    fun minusMonths(m: Int): SimpleYearMonth {
        var newMonth = month - m
        var newYear = year
        while (newMonth < 1) {
            newMonth += 12
            newYear--
        }
        return SimpleYearMonth(newYear, newMonth)
    }

    fun plusMonths(m: Int): SimpleYearMonth {
        var newMonth = month + m
        var newYear = year
        while (newMonth > 12) {
            newMonth -= 12
            newYear++
        }
        return SimpleYearMonth(newYear, newMonth)
    }

    fun label(): String {
        val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
        return "${months[month - 1].uppercase()} $year"
    }

    companion object {
        fun now(): SimpleYearMonth {
            val cal = Calendar.getInstance()
            return SimpleYearMonth(cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1)
        }
    }
}

@Composable
fun RendezvousCreateModalWithCalendar(
    selectedDate: String,
    selectedTime: String,
    onDateChange: (String) -> Unit,
    onTimeChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onClose: () -> Unit
) {
    var currentMonth by remember { mutableStateOf(SimpleYearMonth.now()) }
    var displayedTime by remember { mutableStateOf(selectedTime) }

    Dialog(
        onDismissRequest = onClose,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.9f),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp)
            ) {
                Text(
                    "Prendre un Rendez-vous",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2C3E50),
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Header mois
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.horizontalGradient(
                                listOf(Color(0xFF667EEA), Color(0xFF764BA2))
                            ),
                            RoundedCornerShape(12.dp)
                        )
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { currentMonth = currentMonth.minusMonths(1) }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null, tint = Color.White)
                    }
                    Text(
                        currentMonth.label(),
                        color = Color.White,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.weight(1f),
                        textAlign = TextAlign.Center
                    )
                    IconButton(onClick = { currentMonth = currentMonth.plusMonths(1) }) {
                        Icon(Icons.Default.ArrowForward, contentDescription = null, tint = Color.White)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                CalendarGridCompose(
                    year = currentMonth.year,
                    month = currentMonth.month,
                    selectedDate = selectedDate,
                    onDateSelected = onDateChange
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text("Heure", fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(8.dp))

                TextField(
                    value = displayedTime,
                    onValueChange = {
                        displayedTime = it
                        onTimeChange(it)
                    },
                    placeholder = { Text("HH:mm") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color(0xFFF8F9FA),
                        unfocusedContainerColor = Color(0xFFF8F9FA),
                        focusedIndicatorColor = Color(0xFF667EEA),
                        unfocusedIndicatorColor = Color(0xFFE0E0E0)
                    )
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onClose,
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE74C3C))
                    ) {
                        Text("Fermer", color = Color.White)
                    }
                    Button(
                        onClick = onSubmit,
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF667EEA))
                    ) {
                        Text("Enregistrer", color = Color.White)
                    }
                }
            }
        }
    }
}


@Composable
fun RendezvousEditModalWithCalendar(
    rendezvous: Rendezvous,
    selectedDate: String,
    selectedTime: String,
    onDateChange: (String) -> Unit,
    onTimeChange: (String) -> Unit,
    onSubmit: () -> Unit,
    onClose: () -> Unit
) {
    // même structure que CreateModal, tu peux recopier et adapter le titre / bouton
    RendezvousCreateModalWithCalendar(
        selectedDate = selectedDate,
        selectedTime = selectedTime,
        onDateChange = onDateChange,
        onTimeChange = onTimeChange,
        onSubmit = onSubmit,
        onClose = onClose
    )
}

@Composable
fun CalendarGridCompose(
    year: Int,
    month: Int,
    selectedDate: String,
    onDateSelected: (String) -> Unit
) {
    val cal = Calendar.getInstance()
    cal.set(year, month - 1, 1)
    val firstDayOfMonth = cal.get(Calendar.DAY_OF_WEEK) - 1
    val maxDays = cal.getActualMaximum(Calendar.DAY_OF_MONTH)
    val today = Calendar.getInstance()

    val daysOfWeek = listOf("Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim")

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White, RoundedCornerShape(12.dp))
            .border(1.dp, Color(0xFFE0E0E0), RoundedCornerShape(12.dp))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.horizontalGradient(
                        listOf(Color(0xFF667EEA), Color(0xFF764BA2))
                    ),
                    RoundedCornerShape(topStart = 12.dp, topEnd = 12.dp)
                )
        ) {
            daysOfWeek.forEach { d ->
                Text(
                    d,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .weight(1f)
                        .padding(8.dp)
                )
            }
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(7),
            modifier = Modifier.padding(8.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            items(firstDayOfMonth + maxDays) { index ->
                if (index < firstDayOfMonth) {
                    Box(modifier = Modifier.aspectRatio(1f))
                } else {
                    val day = index - firstDayOfMonth + 1
                    val dateString = String.format("%04d-%02d-%02d", year, month, day)

                    val isToday = today.get(Calendar.YEAR) == year &&
                            today.get(Calendar.MONTH) == month - 1 &&
                            today.get(Calendar.DAY_OF_MONTH) == day

                    val isSelected = selectedDate == dateString

                    val isPast = Calendar.getInstance().apply {
                        set(year, month - 1, day, 0, 0, 0)
                    }.before(Calendar.getInstance())

                    val bgColor = when {
                        isSelected -> Color(0xFF667EEA)
                        isToday -> Color(0xFF51CF66)
                        else -> Color.White
                    }

                    val borderColor = when {
                        isSelected -> Color(0xFF667EEA)
                        isToday -> Color(0xFF51CF66)
                        else -> Color(0xFFE0E0E0)
                    }

                    Box(
                        modifier = Modifier
                            .aspectRatio(1f)
                            .background(bgColor, RoundedCornerShape(8.dp))
                            .border(1.dp, borderColor, RoundedCornerShape(8.dp))
                            .clickable(enabled = !isPast) {
                                if (!isPast) onDateSelected(dateString)
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = day.toString(),
                            color = when {
                                isSelected || isToday -> Color.White
                                isPast -> Color(0xFFBDC3C7)
                                else -> Color(0xFF2C3E50)
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                }
            }
        }
    }
}
