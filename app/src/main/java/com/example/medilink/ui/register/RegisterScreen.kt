package com.example.medilink.ui.register

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    viewModel: RegisterViewModel = viewModel(),
    onRegisterSuccess: () -> Unit,
    onBackToLogin: () -> Unit
) {
    val registerState by viewModel.registerState.collectAsState()
    val datePickerState = rememberDatePickerState()
    var showDatePicker by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(Color(0xFF667EEA), Color(0xFF764BA2))
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(24.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Medilink",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF667EEA)
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Créer un compte",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF2C3E50)
                )

                Text(
                    text = "Rejoignez la communauté Medilink",
                    fontSize = 14.sp,
                    color = Color(0xFF7F8C8D)
                )

                Spacer(modifier = Modifier.height(32.dp))

                // Prénom
                OutlinedTextField(
                    value = viewModel.prenom,
                    onValueChange = viewModel::onPrenomChange,
                    label = { Text("Prénom") },
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF667EEA))
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Votre prénom") }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Nom
                OutlinedTextField(
                    value = viewModel.nom,
                    onValueChange = viewModel::onNomChange,
                    label = { Text("Nom") },
                    leadingIcon = {
                        Icon(Icons.Default.Person, contentDescription = null, tint = Color(0xFF667EEA))
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("Votre nom") }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Email
                OutlinedTextField(
                    value = viewModel.email,
                    onValueChange = viewModel::onEmailChange,
                    label = { Text("Adresse e-mail") },
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = null, tint = Color(0xFF667EEA))
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("votre.email@example.com") }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Téléphone
                OutlinedTextField(
                    value = viewModel.telephone,
                    onValueChange = viewModel::onTelephoneChange,
                    label = { Text("Téléphone") },
                    leadingIcon = {
                        Icon(Icons.Default.Phone, contentDescription = null, tint = Color(0xFF667EEA))
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("+216 22 333 444") }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Date de naissance avec DatePicker
                OutlinedTextField(
                    value = viewModel.dateNaissance,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Date de naissance") },
                    leadingIcon = {
                        Icon(Icons.Default.DateRange, contentDescription = null, tint = Color(0xFF667EEA))
                    },
                    trailingIcon = {
                        IconButton(onClick = { showDatePicker = true }) {
                            Icon(Icons.Default.DateRange, contentDescription = "Sélectionner une date")
                        }
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDatePicker = true },
                    placeholder = { Text("Sélectionnez votre date de naissance") }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Numéro CIN
                OutlinedTextField(
                    value = viewModel.numCin,
                    onValueChange = viewModel::onNumCinChange,
                    label = { Text("Numéro CIN") },
                    leadingIcon = {
                        Icon(Icons.Default.Info, contentDescription = null, tint = Color(0xFF667EEA))
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    placeholder = { Text("12345678") }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Sexe
                var expanded by remember { mutableStateOf(false) }

                ExposedDropdownMenuBox(
                    expanded = expanded,
                    onExpandedChange = { expanded = !expanded }
                ) {
                    OutlinedTextField(
                        value = viewModel.sexe,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Sexe") },
                        leadingIcon = {
                            Icon(Icons.Default.AccountCircle, contentDescription = null, tint = Color(0xFF667EEA))
                        },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded)
                        },
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .menuAnchor(),
                        colors = ExposedDropdownMenuDefaults.outlinedTextFieldColors()
                    )

                    ExposedDropdownMenu(
                        expanded = expanded,
                        onDismissRequest = { expanded = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Homme") },
                            onClick = {
                                viewModel.onSexeChange("homme")
                                expanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Femme") },
                            onClick = {
                                viewModel.onSexeChange("femme")
                                expanded = false
                            }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Mot de passe
                OutlinedTextField(
                    value = viewModel.password,
                    onValueChange = viewModel::onPasswordChange,
                    label = { Text("Mot de passe") },
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF667EEA))
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    placeholder = { Text("••••••••") }
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Confirmation mot de passe
                OutlinedTextField(
                    value = viewModel.confirmPassword,
                    onValueChange = viewModel::onConfirmPasswordChange,
                    label = { Text("Confirmer le mot de passe") },
                    leadingIcon = {
                        Icon(Icons.Default.Lock, contentDescription = null, tint = Color(0xFF667EEA))
                    },
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    placeholder = { Text("••••••••") }
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Bouton d'inscription
                Button(
                    onClick = { viewModel.register() },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(Color(0xFF51CF66), Color(0xFF40C057))
                            ),
                            shape = RoundedCornerShape(12.dp)
                        ),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    enabled = registerState !is RegisterState.Loading
                ) {
                    if (registerState is RegisterState.Loading) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    } else {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Person, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Créer mon compte", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Retour à la connexion
                TextButton(onClick = onBackToLogin) {
                    Text(
                        "Déjà un compte ? Se connecter",
                        color = Color(0xFF667EEA),
                        fontWeight = FontWeight.Medium
                    )
                }

                // Messages d'erreur
                if (registerState is RegisterState.Error) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFE3E3)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = Color(0xFFC92A2A)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = (registerState as RegisterState.Error).message,
                                color = Color(0xFFC92A2A),
                                fontSize = 14.sp
                            )
                        }
                    }
                }

                // Message de succès
                if (registerState is RegisterState.Success) {
                    Spacer(modifier = Modifier.height(16.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFD3F9D8)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Color(0xFF2F9E44)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = (registerState as RegisterState.Success).message,
                                color = Color(0xFF2F9E44),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }

                    LaunchedEffect(Unit) {
                        kotlinx.coroutines.delay(2000) // Attendre 2 secondes
                        onRegisterSuccess()
                    }
                }
            }
        }

        // DatePicker Dialog
        if (showDatePicker) {
            DatePickerDialog(
                onDismissRequest = { showDatePicker = false },
                confirmButton = {
                    TextButton(onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                            val formattedDate = sdf.format(Date(millis))
                            viewModel.onDateNaissanceChange(formattedDate)
                        }
                        showDatePicker = false
                    }) {
                        Text("OK")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDatePicker = false }) {
                        Text("Annuler")
                    }
                }
            ) {
                DatePicker(state = datePickerState)
            }
        }
    }
}
