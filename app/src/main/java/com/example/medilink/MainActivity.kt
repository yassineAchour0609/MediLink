package com.example.medilink

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.navigation.compose.rememberNavController
import com.example.medilink.navigation.NavGraph
import com.example.medilink.ui.theme.MedilinkTheme
import com.example.medilink.data.SocketManager
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        initializeSocketManager()

        setContent {
            MedilinkTheme {
                val navController = rememberNavController()
                NavGraph(navController = navController)
            }
        }
    }
    private fun initializeSocketManager() {
        // Récupérer le token JWT si l'utilisateur est connecté
        val token = getUserToken()

        // Utilisez la même URL que RetrofitClient
        val socketUrl = "http://192.168.56.1:3001" // Changez selon votre config

        // Initialiser et connecter
        SocketManager.init(baseUrl = socketUrl, token = token)
        SocketManager.connect()
    }

    /**
     * Récupère le token JWT depuis SharedPreferences
     */
    private fun getUserToken(): String? {
        val prefs = getSharedPreferences("medilink_prefs", MODE_PRIVATE)
        return prefs.getString("jwt_token", null)
    }

    override fun onDestroy() {
        super.onDestroy()
        SocketManager.cleanup()
    }

    override fun onPause() {
        super.onPause()
        SocketManager.disconnect()
    }

    override fun onResume() {
        super.onResume()
        // Reconnecter si nécessaire
        if (!SocketManager.isConnected()) {
            SocketManager.connect()
        }
    }
}
