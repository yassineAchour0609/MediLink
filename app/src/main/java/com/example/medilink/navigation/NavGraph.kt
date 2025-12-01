package com.example.medilink.navigation

import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.example.medilink.ui.rendezvous.RendezvousScreen
import com.example.medilink.ui.admin.AdminDashboardScreen
import com.example.medilink.ui.admin.MedecinsScreen
import com.example.medilink.ui.admin.PatientsScreen
import com.example.medilink.ui.chatbot.ChatbotScreen
import com.example.medilink.ui.login.LoginScreen
import com.example.medilink.ui.register.RegisterScreen
import com.example.medilink.ui.patient.DoctorsListScreen
import com.example.medilink.ui.dossiermedical.DossierMedicalScreen
import com.example.medilink.ui.message.MessageDoctorsScreen
import com.example.medilink.ui.message.MessageScreen
import com.example.medilink.ui.patient.PatientHomeScreen

@Composable
fun NavGraph(navController: NavHostController) {

    var userToken by remember { mutableStateOf("") }
    var patientId by remember { mutableStateOf(-1) }
    var userNom by remember { mutableStateOf("") }
    var userPrenom by remember { mutableStateOf("") }

    NavHost(navController = navController, startDestination = "login") {

        composable("login") {
            LoginScreen(
                onLoginSuccess = { role, token, userId, nom, prenom ->
                    userToken = token
                    patientId = userId
                    userNom = nom
                    userPrenom = prenom

                    when (role.lowercase()) {
                        "admin" -> {
                            navController.navigate("admin_dashboard") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                        "patient" -> {
                            navController.navigate("patient_dashboard/$userId") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                        else -> {
                            // autre rôle à gérer si besoin
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

        // Écran du chatbot
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

        composable("message_doctors") {
            MessageDoctorsScreen(
                onDoctorSelected = { doctorId ->
                    navController.navigate("messages/$doctorId")
                },
                onBack = { navController.popBackStack() }
            )
        }

        composable("patient_dashboard/{userId}") { backStackEntry ->
            backStackEntry.arguments?.getString("userId")?.toInt()?.let { userId ->
                PatientHomeScreen(
                    userId = userId,
                    userNom = userNom,
                    userPrenom = userPrenom,
                    onNavigateToMessages = {
                        navController.navigate("message_doctors")
                    },
                    onNavigateToRendezvous = {
                        // Navigue vers la liste des médecins pour prendre un nouveau RDV
                        navController.navigate("doctors_list")
                    },
                    onNavigateToDossier = {
                        // Navigue vers le dossier médical
                        navController.navigate("dossier_medical/$userId")
                    },
                    onNavigateToChatbot = {
                        // ✅ nouvelle route vers le chatbot
                        navController.navigate("chatbot")
                    },
                    onLogout = {
                        navController.navigate("login") {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
        }

        composable("appointment/{doctorId}/{doctorName}") { backStackEntry ->
            val doctorId = backStackEntry.arguments?.getString("doctorId")?.toInt() ?: 0
            val doctorName = backStackEntry.arguments?.getString("doctorName") ?: ""

            RendezvousScreen(
                patientId = patientId,
                medecinId = doctorId,
                onBack = { navController.popBackStack() }
            )
        }

        composable("dossier_medical/{patientId}") { backStackEntry ->
            val patientIdParam =
                backStackEntry.arguments?.getString("patientId")?.toInt() ?: patientId

            DossierMedicalScreen(
                patientId = patientIdParam,
                onBack = { navController.popBackStack() }
            )
        }

        composable("messages/{receiverId}") { backStackEntry ->
            val receiverId =
                backStackEntry.arguments?.getString("receiverId")?.toInt() ?: -1

            MessageScreen(
                receiverId = receiverId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
