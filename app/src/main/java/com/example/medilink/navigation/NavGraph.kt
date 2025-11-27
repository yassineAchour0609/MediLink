package com.example.medilink.navigation

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

@Composable
fun NavGraph(navController: NavHostController) {
    var userToken by remember { mutableStateOf("") }

    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                onLoginSuccess = { role, token ->
                    userToken = token
                    when (role.lowercase()) {
                        "admin" -> {
                            navController.navigate("admin_dashboard") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                        "medecin", "patient" -> {
                            navController.navigate("chatbot") {
                                popUpTo("login") { inclusive = true }
                            }
                        }
                        else -> {
                            navController.navigate("chatbot") {
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
    }
}
