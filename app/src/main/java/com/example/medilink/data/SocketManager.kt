package com.example.medilink.data

import android.util.Log
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import org.json.JSONObject
import java.net.URISyntaxException

/**
 * Singleton pour gérer la connexion Socket.IO
 * Gère la connexion temps réel pour la messagerie
 */
object SocketManager {

    private var mSocket: Socket? = null
    private var isInitialized = false

    /**
     * Initialise la connexion Socket.IO
     * @param baseUrl URL du serveur Socket.IO (ex: "http://10.0.2.2:3001")
     * @param token Token d'authentification JWT (optionnel)
     */
    @Synchronized
    fun init(baseUrl: String, token: String? = null) {
        // Prévenir la ré-initialisation si déjà connecté
        if (mSocket?.connected() == true) {
            Log.d("SocketManager", "Socket déjà connecté, skip init")
            return
        }

        try {
            Log.d("SocketManager", "Initialisation Socket.IO vers: $baseUrl")

            val opts = IO.Options().apply {
                // Force une nouvelle connexion
                forceNew = true

                // Configuration de reconnexion
                reconnection = true
                reconnectionDelay = 1000
                reconnectionAttempts = 5
                timeout = 10000

                // Authentification
                if (!token.isNullOrEmpty()) {
                    // Option 1: Via query parameter (si votre serveur l'accepte)
                    query = "token=$token"

                    // Option 2: Via auth (recommandé pour Socket.IO v3+)
                    // Décommentez si votre serveur utilise auth
                    // auth = mapOf("token" to token)
                }

                // HTTPS si l'URL commence par https
                secure = baseUrl.startsWith("https")
            }

            mSocket = IO.socket(baseUrl, opts)

            // ==================== Événements de Connexion ====================

            mSocket?.on(Socket.EVENT_CONNECT) {
                Log.d("SocketManager", "✅ Socket.IO connecté")
                Log.d("SocketManager", "Socket ID: ${mSocket?.id()}")
                isInitialized = true
            }

            mSocket?.on(Socket.EVENT_DISCONNECT) {
                Log.d("SocketManager", "❌ Socket.IO déconnecté")
            }

            mSocket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                val error = args.getOrNull(0)
                Log.e("SocketManager", "🔴 Erreur de connexion: $error")
            }

            mSocket?.on("reconnect") { args ->
                val attemptNumber = args.getOrNull(0)
                Log.d("SocketManager", "🔄 Reconnexion réussie après $attemptNumber tentative(s)")
            }

            mSocket?.on("reconnect_attempt") { args ->
                val attemptNumber = args.getOrNull(0)
                Log.d("SocketManager", "🔄 Tentative de reconnexion #$attemptNumber")
            }

            mSocket?.on("reconnect_error") {
                Log.e("SocketManager", "🔴 Erreur lors de la reconnexion")
            }

            mSocket?.on("reconnect_failed") {
                Log.e("SocketManager", "Échec de reconnexion après toutes les tentatives")
            }

            Log.d("SocketManager", "Socket.IO initialisé avec succès")

        } catch (e: URISyntaxException) {
            Log.e("SocketManager", "Erreur init: URI invalide -> ${e.message}")
        } catch (e: Exception) {
            Log.e("SocketManager", "❌ Erreur init: ${e.message}")
        }
    }

    /**
     * Connecte le socket
     */
    fun connect() {
        if (!isInitialized) {
            Log.e("SocketManager", "⚠️ Socket non initialisé. Appelez init() d'abord.")
            return
        }

        if (mSocket?.connected() != true) {
            Log.d("SocketManager", "Connexion en cours...")
            mSocket?.connect()
        } else {
            Log.d("SocketManager", "Socket déjà connecté")
        }
    }

    /**
     * Déconnecte le socket
     */
    fun disconnect() {
        if (mSocket?.connected() == true) {
            Log.d("SocketManager", "Déconnexion...")
            mSocket?.disconnect()
        }
    }

    /**
     * Vérifie si le socket est connecté
     */
    fun isConnected(): Boolean {
        return mSocket?.connected() ?: false
    }

    /**
     * Écoute un événement spécifique
     * @param event Nom de l'événement
     * @param callback Fonction callback qui reçoit les arguments
     */
    fun on(event: String, callback: (args: Array<Any?>) -> Unit) {
        val listener = Emitter.Listener { args ->
            try {
                callback(args)
            } catch (e: Exception) {
                Log.e("SocketManager", "Erreur dans le listener '$event': ${e.message}")
            }
        }
        mSocket?.on(event, listener)
        Log.d("SocketManager", "Listener ajouté pour l'événement: $event")
    }

    /**
     * Émet un événement vers le serveur
     * @param event Nom de l'événement
     * @param args Arguments à envoyer
     */
    fun emit(event: String, vararg args: Any) {
        if (mSocket?.connected() == true) {
            mSocket?.emit(event, *args)
            Log.d("SocketManager", "Événement émis: $event")
        } else {
            Log.w("SocketManager", "⚠️ Impossible d'émettre '$event': Socket non connecté")
        }
    }

    /**
     * Émet un événement avec acknowledgement (callback)
     * @param event Nom de l'événement
     * @param data Données à envoyer
     * @param callback Fonction appelée quand le serveur répond
     */
    fun emitWithAck(event: String, data: Any, callback: (Array<Any>) -> Unit) {
        if (mSocket?.connected() == true) {
            mSocket?.emit(event, data,object :io.socket.client.Ack {
                override fun call(vararg args: Any) {
                    try {
                        callback(args as Array<Any>)
                    } catch (e: Exception) {
                        Log.e("SocketManager", "Erreur: ${e.message}")
                    }
                }
            })
            Log.d("SocketManager", "Événement avec ACK émis: $event")
        } else {
            Log.w("SocketManager", "Impossible d'émettre '$event': Socket non connecté")
        }
    }

    /**
     * Retire tous les listeners d'un événement
     * @param event Nom de l'événement
     */
    fun off(event: String) {
        mSocket?.off(event)
        Log.d("SocketManager", "Listeners retirés pour l'événement: $event")
    }

    /**
     * Retire un listener spécifique d'un événement
     * @param event Nom de l'événement
     * @param listener Le listener à retirer
     */
    fun off(event: String, listener: Emitter.Listener) {
        mSocket?.off(event, listener)
    }

    /**
     * Rejoint une room (conversation)
     * @param roomId ID de la room/conversation
     */
    fun joinRoom(roomId: String) {
        emit("join_room", JSONObject().apply {
            put("room", roomId)
        })
        Log.d("SocketManager", "Tentative de rejoindre la room: $roomId")
    }

    /**
     * Quitte une room
     * @param roomId ID de la room/conversation
     */
    fun leaveRoom(roomId: String) {
        emit("leave_room", JSONObject().apply {
            put("room", roomId)
        })
        Log.d("SocketManager", "Tentative de quitter la room: $roomId")
    }

    /**
     * Nettoie toutes les ressources
     */
    fun cleanup() {
        Log.d("SocketManager", "Nettoyage du SocketManager...")
        mSocket?.off() // Retire tous les listeners
        mSocket?.disconnect()
        mSocket = null
        isInitialized = false
    }

    /**
     * Obtient l'ID du socket (utile pour le debugging)
     */
    fun getSocketId(): String? {
        return mSocket?.id()
    }

    /**
     * Obtient l'état de la connexion sous forme de texte
     */
    fun getConnectionStatus(): String {
        return when {
            mSocket == null -> "Non initialisé"
            mSocket?.connected() == true -> "Connecté (ID: ${mSocket?.id()})"
            else -> "Déconnecté"
        }
    }
}