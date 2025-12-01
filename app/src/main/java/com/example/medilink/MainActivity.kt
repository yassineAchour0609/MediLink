package com.example.medilink

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.compose.rememberNavController
import com.example.medilink.ui.theme.MedilinkTheme
import com.example.medilink.data.SocketManager
import com.example.medilink.navigation.NavGraph

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        initializeSocketManager()

        setContent {
            MedilinkTheme {
                val navController = rememberNavController()
                NavGraph(navController = navController)   // ✅ OK
            }
        }
    }

    private fun initializeSocketManager() {
        val token = getUserToken()
        val socketUrl = "http://192.168.56.1:3001"
        SocketManager.init(baseUrl = socketUrl, token = token)
        SocketManager.connect()
    }

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
        if (!SocketManager.isConnected()) {
            SocketManager.connect()
        }
    }
}
