package com.example.medilink.ui.chatbot

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.medilink.data.network.ChatRequest
import com.example.medilink.data.network.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ChatbotViewModel : ViewModel() {
    private val api = RetrofitClient.chatbotInstance

    private val _messages = MutableStateFlow<List<ChatMessage>>(
        listOf(ChatMessage("Bonjour ! Je suis votre assistant médical. Décrivez vos symptômes.", isUser = false))
    )
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _userInput = MutableStateFlow("")
    val userInput: StateFlow<String> = _userInput.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun onUserInputChange(newInput: String) {
        _userInput.value = newInput
    }

    fun sendMessage() {
        val message = _userInput.value.trim()
        if (message.isBlank()) return

        _messages.value = _messages.value + ChatMessage(message, isUser = true)
        _userInput.value = ""
        _isLoading.value = true

        viewModelScope.launch {
            try {
                val response = api.sendMessage(ChatRequest(message))
                _messages.value = _messages.value + ChatMessage(response.reply, isUser = false)
            } catch (e: Exception) {
                _messages.value = _messages.value + ChatMessage(
                    "Erreur: ${e.message}",
                    isUser = false
                )
            } finally {
                _isLoading.value = false
            }
        }
    }
}