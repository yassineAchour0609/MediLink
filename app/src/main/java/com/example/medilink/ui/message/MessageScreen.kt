package com.example.medilink.ui.message

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.medilink.ui.message.composants.MessageBubble
import com.example.medilink.utils.SharedPrefsManager
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MessageScreen(
    receiverId: Int,
    onBack: () -> Unit,
    viewModel: MessageViewModel = viewModel()
) {
    val context = LocalContext.current
    val userId = SharedPrefsManager.getUserId(context)

    val messages by viewModel.messages.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val sendingMessage by viewModel.sendingMessage.collectAsState()
    val uploadingFile by viewModel.uploadingFile.collectAsState()

    var messageText by remember { mutableStateOf("") }
    var selectedFile by remember { mutableStateOf<File?>(null) }

    val filePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            try {
                context.contentResolver.openInputStream(it)?.use { input ->
                    val fileName = uri.lastPathSegment?.takeLast(50) ?: "file_${System.currentTimeMillis()}"
                    val file = File(context.cacheDir, "msg_${System.currentTimeMillis()}_$fileName")
                    file.outputStream().use { output -> input.copyTo(output) }
                    selectedFile = file
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    LaunchedEffect(receiverId) {
        viewModel.loadConversation(receiverId)
    }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Messages", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color(0xFF667EEA)
                )
            )
        },
        containerColor = Color(0xFFF5F6FA)
    ) { paddingValues ->

        Box(modifier = Modifier.padding(paddingValues)) {
            Column(modifier = Modifier.fillMaxSize()) {

                // Liste des messages
                if (isLoading && messages.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = Color(0xFF667EEA))
                    }
                } else if (messages.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Aucun message pour le moment", color = Color.Gray)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.weight(1f).padding(horizontal = 12.dp),
                        reverseLayout = true,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(messages.reversed(), key = { it.idMessage!! }) { msg ->
                            MessageBubble(
                                message = msg,
                                isOwn = msg.idEmetteur == userId
                            )
                        }
                    }
                }
            }

            // Barre d’envoi (en bas)
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .background(Color.White)
                    .padding(12.dp)
            ) {
                // Aperçu fichier
                selectedFile?.let { file ->
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .background(Color(0xFFE8EAF6), RoundedCornerShape(12.dp))
                            .padding(12.dp)
                    ) {
                        Icon(Icons.Filled.Attachment, contentDescription = null, tint = Color(0xFF667EEA))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = file.name, modifier = Modifier.weight(1f), fontSize = 14.sp)
                        IconButton(onClick = { selectedFile = null }) {
                            Icon(Icons.Filled.Close, contentDescription = "Supprimer")
                        }
                    }
                }

                // Input + boutons
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { filePicker.launch("*/*") }) {
                        Icon(Icons.Filled.AttachFile, contentDescription = "Pièce jointe", tint = Color(0xFF667EEA))
                    }

                    TextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        placeholder = { Text("Écrire un message…") },
                        modifier = Modifier
                            .weight(1f)
                            .background(Color(0xFFF2F2F7), RoundedCornerShape(24.dp)),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFFF2F2F7),
                            unfocusedContainerColor = Color(0xFFF2F2F7),
                            disabledContainerColor = Color(0xFFF2F2F7),
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent
                        ),
                        shape = RoundedCornerShape(24.dp),
                        singleLine = true,
                        trailingIcon = {
                            if (sendingMessage || uploadingFile) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    strokeWidth = 2.dp,
                                    color = Color(0xFF667EEA)
                                )
                            }
                        }
                    )

                    IconButton(
                        onClick = {
                            viewModel.sendMessage(
                                toId = receiverId,
                                text = messageText.takeIf { it.isNotBlank() },
                                file = selectedFile
                            )
                            messageText = ""
                            selectedFile = null
                        },
                        enabled = messageText.isNotBlank() || selectedFile != null
                    ) {
                        Icon(Icons.Filled.Send, contentDescription = "Envoyer", tint = Color(0xFF667EEA))
                    }
                }
            }
        }
    }
}