package com.example.medilink.ui.message

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.SocketManager
import com.example.medilink.data.model.*
import com.example.medilink.data.network.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class MessageViewModel : ViewModel(){
    private val api = RetrofitClient.MessageInstance
    // Liste de toutes les conversations
    private val _conversations = MutableStateFlow<List<Conversation>>(emptyList())
    val conversations: StateFlow<List<Conversation>> = _conversations

    // Messages de la conversation active
    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages

    // États de chargement
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _sendingMessage = MutableStateFlow(false)
    val sendingMessage: StateFlow<Boolean> = _sendingMessage

    private val _uploadingFile = MutableStateFlow(false)
    val uploadingFile: StateFlow<Boolean> = _uploadingFile

    // Gestion des erreurs
    private val _errorMessage = MutableStateFlow("")
    val errorMessage: StateFlow<String> = _errorMessage

    private val _successMessage = MutableStateFlow("")
    val successMessage: StateFlow<String> = _successMessage

    // État de connexion Socket.IO
    private val _socketConnected = MutableStateFlow(false)
    val socketConnected: StateFlow<Boolean> = _socketConnected

    // Conversation active
    private var currentConversationId: Int? = null
    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount

    init {
        setupSocketConnection()
    }
    /**
     * Configure la connexion Socket.IO et les listeners
     */
    private fun setupSocketConnection() {
        // Vérifier si Socket.IO est connecté
        _socketConnected.value = SocketManager.isConnected()

        // Connecter si nécessaire
        if (!SocketManager.isConnected()) {
            SocketManager.connect()
        }

        // Écouter les événements de connexion
        SocketManager.on("connect") {
            _socketConnected.value = true
            Log.d("MessageViewModel", "Socket.IO connecté")
        }

        SocketManager.on("disconnect") {
            _socketConnected.value = false
            Log.d("MessageViewModel", "Socket.IO déconnecté")
        }
    }

    /**
     * Configure le listener pour les nouveaux messages en temps réel
     */
    private fun setupRealtimeListener(idAutre: Int) {
        // Retirer l'ancien listener
        SocketManager.off("nouveau_message")

        // Écouter les nouveaux messages
        SocketManager.on("nouveau_message") { args ->
            try {
                val data = args.getOrNull(0) as? Map<*, *> ?: return@on
                val messageData = data["message"] as? Map<*, *> ?: return@on

                // Parser le message
                val newMessage = parseMessageFromMap(messageData)

                // Ajouter si c'est pour la conversation active
                if (newMessage != null &&
                    (newMessage.idEmetteur == idAutre || newMessage.idDestinaire == idAutre)) {

                    addMessageToList(newMessage)

                    // Marquer comme lu si c'est un message reçu
                    if (newMessage.idEmetteur == idAutre && newMessage.lu != 1) {
                        markAsRead(newMessage.idMessage)
                    }

                    Log.d("MessageViewModel", "Nouveau message reçu: ${newMessage.idMessage}")
                }
            } catch (e: Exception) {
                Log.e("MessageViewModel", "Erreur parsing message temps réel", e)
            }
        }

        // Écouter les notifications de nouveaux messages (pour mettre à jour la liste)
        SocketManager.on("notif_message") {
            loadConversations() // Rafraîchir la liste des conversations
        }
    }

    /**
     * Parse un message depuis les données Socket.IO
     */
    private fun parseMessageFromMap(data: Map<*, *>): Message? {
        return try {
            Message(
                idMessage = (data["idMessage"] as? Number)?.toInt() ?: return null,
                idDestinaire = (data["idEmetteur"] as? Number)?.toInt() ?: return null,
                idEmetteur = (data["idDestinataire"] as? Number)?.toInt() ?: return null,
                contenu = data["contenu"] as? String ?: "",
                typeMessage = data["type_message"] as? String,
                urlDocument = data["url_document"] as? String,
                nomDocument = data["nom_document"] as? String,
                lu = (data["lu"] as? Number)?.toInt() ?: 0,
                dateCreation = data["date_creation"] as? String,
                dateLecture = data["date_lecture"] as? String,
                nom = data["nom"] as? String,
                prenom = data["prenom"] as? String
            )
        } catch (e: Exception) {
            Log.e("MessageViewModel", "Erreur parsing message", e)
            null
        }
    }

    /**
     * Ajoute un message à la liste (évite les doublons)
     */
    private fun addMessageToList(message: Message) {
        val currentMessages = _messages.value.toMutableList()

        // Vérifier si le message existe déjà
        if (currentMessages.none { it.idMessage == message.idMessage }) {
            currentMessages.add(message)
            _messages.value = currentMessages
        }
    }

    // ==================== Conversations Management ====================

    /**
     * Charge toutes les conversations de l'utilisateur
     */
    fun loadConversations() {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _errorMessage.value = ""

                Log.d("MessageViewModel", "Chargement des conversations...")

                val response = api.getConversations()

                if (response.isSuccessful) {
                    val apiResponse = response.body()

                    if (apiResponse != null && apiResponse.success) {
                        _conversations.value = apiResponse.data ?: emptyList()
                        Log.d("MessageViewModel", "${_conversations.value.size} conversations chargées")
                    } else {
                        _errorMessage.value = apiResponse?.message ?: "Erreur lors du chargement"
                        Log.e("MessageViewModel", "Erreur API: ${apiResponse?.message}")
                    }
                } else {
                    _errorMessage.value = "Erreur serveur: ${response.code()}"
                    Log.e("MessageViewModel", "Erreur HTTP: ${response.code()}")
                }

            } catch (e: Exception) {
                _errorMessage.value = "Erreur réseau: ${e.message}"
                Log.e("MessageViewModel", "Exception", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Charge les messages d'une conversation spécifique
     */
    fun loadConversation(idAutre: Int, forceRefresh: Boolean = false) {
        // Éviter de recharger si déjà chargée
        if (!forceRefresh && currentConversationId == idAutre && _messages.value.isNotEmpty()) {
            return
        }

        viewModelScope.launch {
            try {
                _isLoading.value = true
                _errorMessage.value = ""

                Log.d("MessageViewModel", "Chargement conversation avec user $idAutre...")

                val response = api.getConversation(idAutre)

                if (response.isSuccessful) {
                    val apiResponse = response.body()

                    if (apiResponse != null && apiResponse.success) {
                        _messages.value = apiResponse.data ?: emptyList()
                        currentConversationId = idAutre

                        // Configurer le listener temps réel
                        setupRealtimeListener(idAutre)

                        // Rejoindre la room Socket.IO
                        SocketManager.joinRoom("conversation_$idAutre")

                        Log.d("MessageViewModel", "${_messages.value.size} messages chargés")
                    } else {
                        _errorMessage.value = apiResponse?.message ?: "Erreur lors du chargement"
                        Log.e("MessageViewModel", "Erreur API: ${apiResponse?.message}")
                    }
                } else {
                    _errorMessage.value = when (response.code()) {
                        404 -> "Conversation non trouvée"
                        403 -> "Accès non autorisé"
                        500 -> "Erreur serveur"
                        else -> "Erreur: ${response.code()}"
                    }
                    Log.e("MessageViewModel", "Erreur HTTP: ${response.code()}")
                }

            } catch (e: Exception) {
                _errorMessage.value = "Erreur réseau: ${e.message}"
                Log.e("MessageViewModel", "Exception", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    // ==================== Send Messages ====================

    /**
     * Envoie un message texte
     */
    fun sendMessage(toId: Int, text: String?, file: File?) {

        if ((text == null || text.isBlank()) && file == null) {
            _errorMessage.value = "Le message ne peut pas être vide"
            return
        }

        viewModelScope.launch {
            try {
                _sendingMessage.value = true
                _errorMessage.value = ""

                var uploadedFileUrl: String? = null
                var uploadedFileName: String? = null

                /** ------------------ UPLOAD FICHIER ------------------ */
                if (file != null) {
                    try {
// Étape 1: Upload du fichier// 1. Create a RequestBody from the file
                        val requestBody = file.asRequestBody("multipart/form-data".toMediaTypeOrNull())
// 2. Create the MultipartBody.Part, which includes the file name and request body
                        val body = MultipartBody.Part.createFormData("file", file.name, requestBody)
// 3. Call the API with the created body part
                        val uploadResponse = api.uploadFile(body)
                        if (uploadResponse.isSuccessful) {
                            val uploadApi = uploadResponse.body()
                            if (uploadApi != null && uploadApi.success) {
                                uploadedFileUrl = uploadApi.url
                                uploadedFileName = uploadApi.filename
                                Log.d("MessageViewModel", "📎 Fichier uploadé: $uploadedFileUrl")
                            } else {
                                _errorMessage.value = uploadApi?.message ?: "Échec de l'upload"
                                Log.e("MessageViewModel", "Upload API error: ${uploadApi?.message}")
                                return@launch
                            }
                        } else {
                            _errorMessage.value = "Erreur upload: ${uploadResponse.code()}"
                            return@launch
                        }

                    } catch (e: Exception) {
                        _errorMessage.value = "Erreur upload: ${e.message}"
                        Log.e("MessageViewModel", "Exception upload", e)
                        return@launch
                    }
                }

                /** ------------------ ENVOI DU MESSAGE ------------------ */
                Log.d("MessageViewModel", "Envoi message...")

                val request = SendMessageRequest(
                    idDestinaire = toId,
                    contenu = text?.trim(),
                    type_message = if (file != null) "document" else "texte",
                    url_document = uploadedFileUrl,
                    nom_document = uploadedFileName
                )

                val response = api.sendMessage(request)

                if (response.isSuccessful) {
                    val apiResponse = response.body()

                    if (apiResponse != null && apiResponse.success) {
                        apiResponse.data?.let { newMessage ->
                            addMessageToList(newMessage)
                        }
                        Log.d("MessageViewModel", "Message envoyé")
                    } else {
                        _errorMessage.value = apiResponse?.message ?: "Échec de l'envoi"
                    }

                } else {
                    _errorMessage.value = "Erreur HTTP: ${response.code()}"
                }

            } catch (e: Exception) {
                _errorMessage.value = "Erreur réseau: ${e.message}"
                Log.e("MessageViewModel", "Exception", e)
            } finally {
                _sendingMessage.value = false
            }
        }
    }

    /**
     * Upload un fichier et envoie un message avec le fichier
     */
    fun uploadAndSendFile(file: File, toId: Int, messageType: String = "fichier") {
        if (!file.exists()) {
            _errorMessage.value = "Le fichier n'existe pas"
            return
        }

        if (messageType !in listOf("fichier", "image")) {
            _errorMessage.value = "Type de message invalide"
            return
        }

        viewModelScope.launch {
            try {
                _uploadingFile.value = true
                _errorMessage.value = ""

                Log.d("MessageViewModel", "Upload fichier: ${file.name}...")

// Étape 1: Upload du fichier// 1. Create a RequestBody from the file
                val requestBody = file.asRequestBody("multipart/form-data".toMediaTypeOrNull())

// 2. Create the MultipartBody.Part, which includes the file name and request body
                val body = MultipartBody.Part.createFormData("file", file.name, requestBody)

// 3. Call the API with the created body part
                val uploadResponse = api.uploadFile(body)
                if (uploadResponse.isSuccessful) {
                    val uploadData = uploadResponse.body()

                    if (uploadData?.success == true && uploadData.url != null) {
                        Log.d("MessageViewModel", "Fichier uploadé: ${uploadData.url}")

                        // Étape 2: Envoyer le message avec l'URL du fichier
                        val request = SendMessageRequest(
                            idDestinaire = toId,
                            contenu = uploadData.filename ?: file.name,
                            type_message = messageType,
                            url_document = uploadData.url,
                            nom_document = uploadData.filename ?: file.name
                        )

                        val sendResponse = api.sendMessage(request)

                        if (sendResponse.isSuccessful) {
                            val apiResponse = sendResponse.body()

                            if (apiResponse != null && apiResponse.success) {
                                apiResponse.data?.let { newMessage ->
                                    addMessageToList(newMessage)
                                }
                                _successMessage.value = "Fichier envoyé avec succès"
                                Log.d("MessageViewModel", "Message avec fichier envoyé")
                            } else {
                                _errorMessage.value = "Fichier uploadé mais échec de l'envoi"
                            }
                        } else {
                            _errorMessage.value = "Erreur lors de l'envoi: ${sendResponse.code()}"
                        }

                    } else {
                        _errorMessage.value = uploadData?.message ?: "Échec de l'upload"
                        Log.e("MessageViewModel", "Échec upload: ${uploadData?.message}")
                    }
                } else {
                    _errorMessage.value = when (uploadResponse.code()) {
                        413 -> "Fichier trop volumineux"
                        415 -> "Type de fichier non supporté"
                        else -> "Erreur d'upload: ${uploadResponse.code()}"
                    }
                    Log.e("MessageViewModel", "Erreur HTTP upload: ${uploadResponse.code()}")
                }

            } catch (e: Exception) {
                _errorMessage.value = "Erreur lors de l'upload: ${e.message}"
                Log.e("MessageViewModel", "Exception upload", e)
            } finally {
                _uploadingFile.value = false
            }
        }
    }

    // ==================== Message Actions ====================

    /**
     * Marque un message comme lu
     */
    fun markAsRead(idMessage: Int?) {
        if (idMessage == null) return
        viewModelScope.launch {
            try {
                Log.d("MessageViewModel", "Marquage message $idMessage comme lu...")

                val response = api.markAsRead(idMessage)

                if (response.isSuccessful) {
                    // Mettre à jour dans la liste locale
                    _messages.value = _messages.value.map { message ->
                        if (message.idMessage == idMessage) {
                            message.copy(lu = 1, dateLecture = getCurrentDateTime())
                        } else {
                            message
                        }
                    }
                    Log.d("MessageViewModel", "Message marqué comme lu")
                }
            } catch (e: Exception) {
                Log.e("MessageViewModel", "Erreur marquage message", e)
            }
        }
    }

    /**
     * Marque tous les messages non lus d'une conversation comme lus
     */
    fun markAllAsRead(idAutre: Int) {
        viewModelScope.launch {
            val unreadMessages = _messages.value.filter {
                it.idEmetteur == idAutre && it.lu != 1
            }

            unreadMessages.forEach { message ->
                markAsRead(message.idMessage)
            }
        }
    }

    /**
     * Supprime un message
     */
    fun deleteMessage(idMessage: Int) {
        viewModelScope.launch {
            try {
                _isLoading.value = true

                Log.d("MessageViewModel", "Suppression message $idMessage...")

                val response = api.deleteMessage(idMessage)

                if (response.isSuccessful) {
                    // Retirer de la liste locale
                    _messages.value = _messages.value.filter { it.idMessage != idMessage }
                    _successMessage.value = "Message supprimé"
                    Log.d("MessageViewModel", "Message supprimé")
                } else {
                    _errorMessage.value = "Échec de la suppression: ${response.code()}"
                    Log.e("MessageViewModel", "Erreur suppression: ${response.code()}")
                }

            } catch (e: Exception) {
                _errorMessage.value = "Erreur lors de la suppression: ${e.message}"
                Log.e("MessageViewModel", "Exception suppression", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    /**
     * Supprime une conversation entière
     */
    fun deleteConversation(idAutre: Int) {
        viewModelScope.launch {
            try {
                _isLoading.value = true

                Log.d("MessageViewModel", "Suppression conversation avec user $idAutre...")

                val response = api.deleteConversation(idAutre)

                if (response.isSuccessful) {
                    // Retirer de la liste des conversations
                    _conversations.value = _conversations.value.filter { it.idAutre != idAutre }

                    // Vider les messages si c'était la conversation active
                    if (currentConversationId == idAutre) {
                        _messages.value = emptyList()
                        currentConversationId = null
                    }

                    // Quitter la room Socket.IO
                    SocketManager.leaveRoom("conversation_$idAutre")

                    _successMessage.value = "Conversation supprimée"
                    Log.d("MessageViewModel", "Conversation supprimée")
                } else {
                    _errorMessage.value = "Échec de la suppression: ${response.code()}"
                    Log.e("MessageViewModel", "Erreur suppression: ${response.code()}")
                }

            } catch (e: Exception) {
                _errorMessage.value = "Erreur lors de la suppression: ${e.message}"
                Log.e("MessageViewModel", "Exception suppression", e)
            } finally {
                _isLoading.value = false
            }
        }
    }
    // ==================== Utility Functions ====================

    /**
     * Rafraîchit la conversation active
     */
    fun refresh() {
        currentConversationId?.let { id ->
            loadConversation(id, forceRefresh = true)
        }
    }

    /**
     * Reconnecte Socket.IO si déconnecté
     */
    fun reconnectSocket() {
        if (!SocketManager.isConnected()) {
            SocketManager.connect()
        }
    }

    /**
     * Vérifie si un message vient de l'utilisateur actuel
     */
    fun isMessageFromCurrentUser(message: Message, currentUserId: Int): Boolean {
        return message.idEmetteur == currentUserId
    }

    /**
     * Obtient la date/heure actuelle au format backend
     */
    private fun getCurrentDateTime(): String {
        return java.text.SimpleDateFormat(
            "yyyy-MM-dd HH:mm:ss",
            java.util.Locale.getDefault()
        ).format(java.util.Date())
    }

    /**
     * Efface le message d'erreur
     */
    fun clearErrorMessage() {
        _errorMessage.value = ""
    }

    /**
     * Efface le message de succès
     */
    fun clearSuccessMessage() {
        _successMessage.value = ""
    }

    // ==================== Lifecycle ====================

    override fun onCleared() {
        super.onCleared()

        // Nettoyer les listeners Socket.IO
        SocketManager.off("nouveau_message")
        SocketManager.off("notif_message")

        // Quitter la room actuelle
        currentConversationId?.let { id ->
            SocketManager.leaveRoom("conversation_$id")
        }
        Log.d("MessageViewModel", "ViewModel nettoyé")
    }
}