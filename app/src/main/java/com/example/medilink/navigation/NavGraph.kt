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
import com.example.medilink.ui.patient.PatientHomeScreen

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
                        "patient" -> {
                            navController.navigate("patient_dashboard/$userId") {
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
        // Code corrigé
        composable("patient_dashboard/{userId}") { backStackEntry ->
            // Utiliser 'let' pour éviter les crashs si l'ID est manquant
            backStackEntry.arguments?.getString("userId")?.toInt()?.let { userId ->
                PatientHomeScreen(
                    userId = userId,

                    // Fournissez les actions de navigation dont l'écran a besoin
                    onNavigateToMessages = {
                        // TODO: Créez la route pour la messagerie, par exemple "messages/{userId}"
                        navController.navigate("messages/$userId")
                    },
                    onNavigateToRendezvous = {
                        // Navigue vers la liste des médecins pour prendre un nouveau RDV
                        navController.navigate("doctors_list")
                    },
                    onNavigateToDossier = {
                        // Navigue vers l'écran du dossier médical avec l'ID du patient
                        navController.navigate("dossier_medical/$userId")
                    }
                    // Ajoutez ici d'autres actions si nécessaire (ex: onNavigateToChatbot)
                )
            }
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
