package com.example.medilink.navigation

import com.example.medilink.ui.rendezvous.RendezvousScreen
import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.medilink.ui.admin.AdminDashboardScreen
import com.example.medilink.ui.admin.MedecinsScreen
import com.example.medilink.ui.admin.PatientsScreen
import com.example.medilink.ui.chatbot.ChatbotScreen
import com.example.medilink.ui.login.LoginScreen
import com.example.medilink.ui.register.RegisterScreen
import com.example.medilink.ui.patient.DoctorsListScreen
import com.example.medilink.ui.dossiermedical.DossierMedicalScreen

@Composable
fun NavGraph(navController: NavHostController) {
    var userToken by remember { mutableStateOf("") }
    var patientId by remember { mutableStateOf(-1) }

    NavHost(navController = navController, startDestination = "login") {

        composable("login") {
            LoginScreen(
                onLoginSuccess = { role, token, userId ->
                    userToken = token
                    patientId = userId

                    when (role.lowercase()) {
                        "admin" -> {
                            navController.navigate("admin_dashboard") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                        "medecin", "patient" -> {
                            navController.navigate("dossier_medical/$userId") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                        else -> {
                            navController.navigate("dossier_medical/$userId") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate("register")
                }
            )
        }

        composable("register") {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate("login") {
                        popUpTo("register") { inclusive = true }
                    }
                },
                onBackToLogin = {
                    navController.popBackStack()
                }
            )
        }

        composable("chatbot") {
            ChatbotScreen()
        }

        composable("doctors_list") {
            DoctorsListScreen(
                onNavigateToAppointment = { doctorId, doctorName ->
                    navController.navigate("appointment/$doctorId/$doctorName")
                },
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        composable("admin_dashboard") {
            AdminDashboardScreen(
                token = userToken,
                onNavigateToMedecins = {
                    navController.navigate("manage_medecins")
                },
                onNavigateToPatients = {
                    navController.navigate("manage_patients")
                },
                onLogout = {
                    navController.navigate("login") {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable("manage_medecins") {
            MedecinsScreen(
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        composable("manage_patients") {
            PatientsScreen(
                token = userToken,
                onBack = {
                    navController.popBackStack()
                }
            )
        }

        composable("appointment/{doctorId}/{doctorName}") { backStackEntry ->
            val doctorId = backStackEntry.arguments?.getString("doctorId")?.toInt() ?: 0
            val doctorName = backStackEntry.arguments?.getString("doctorName") ?: ""

            // ✅ Utiliser le vrai patientId mémorisé (venant de l'utilisateur connecté)
            RendezvousScreen(
                patientId = patientId,
                medecinId = doctorId,
                onBack = { navController.popBackStack() }
            )
        }

        composable("dossier_medical/{patientId}") { backStackEntry ->
            val patientIdParam = backStackEntry.arguments?.getString("patientId")?.toInt() ?: patientId

            DossierMedicalScreen(
                patientId = patientIdParam,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
