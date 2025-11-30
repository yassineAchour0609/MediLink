package com.example.medilink.ui.dossiermedical

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.medilink.data.model.*
import com.example.medilink.utils.SharedPrefsManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.widget.Toast
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.FileProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.FileOutputStream
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import kotlinx.coroutines.delay
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.TextButton

@Composable
fun DossierMedicalScreen(
    patientId: Int,
    onBack: () -> Unit,
    viewModel: DossierMedicalViewModel = viewModel()
) {
    val context = LocalContext.current
    val userRole = SharedPrefsManager.getUserRole(context)?.lowercase() ?: ""
    val isPatient = userRole == "patient"
    
    val dossier by viewModel.dossier.collectAsState()
    val analyses by viewModel.analyses.collectAsState()
    val ordonnances by viewModel.ordonnances.collectAsState()
    val notes by viewModel.notes.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val errorMessage by viewModel.errorMessage.collectAsState()
    val selectedTab by viewModel.selectedTab.collectAsState()
    val showEditDossierDialog by viewModel.showEditDossierDialog.collectAsState()
    val showAddAnalyseDialog by viewModel.showAddAnalyseDialog.collectAsState()
    val showEditAnalyseDialog by viewModel.showEditAnalyseDialog.collectAsState()
    val selectedAnalyse by viewModel.selectedAnalyse.collectAsState()
    val medecins by viewModel.medecins.collectAsState()
    val userId = SharedPrefsManager.getUserId(context)
    
    var selectedFileAnalyse by remember { mutableStateOf<File?>(null) }
    
    val filePickerAnalyse = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            val inputStream = context.contentResolver.openInputStream(it)
            val file = File(context.cacheDir, "analyse_${System.currentTimeMillis()}.pdf")
            inputStream?.use { stream ->
                file.outputStream().use { output ->
                    stream.copyTo(output)
                }
            }
            selectedFileAnalyse = file
        }
    }

    LaunchedEffect(patientId) {
        viewModel.loadDossier(patientId)
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF8F9FA))
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            // Header
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(Color(0xFF667EEA), Color(0xFF764BA2))
                        )
                    )
                    .padding(24.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = onBack) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .padding(start = 8.dp)
                    ) {
                        Text(
                            "Dossier Médical",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            "Votre historique médical complet",
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.8f)
                        )
                    }
                }
            }

            // Tabs
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = Color.White,
                contentColor = Color(0xFF667EEA),
                modifier = Modifier.fillMaxWidth()
            ) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { viewModel.selectTab(0) },
                    text = { Text("Infos", fontSize = 12.sp) }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { viewModel.selectTab(1) },
                    text = { Text("Analyses", fontSize = 12.sp) }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { viewModel.selectTab(2) },
                    text = { 
                        Text(
                            "Ordonn.", 
                            fontSize = 11.sp,
                            maxLines = 1
                        ) 
                    }
                )
                Tab(
                    selected = selectedTab == 3,
                    onClick = { viewModel.selectTab(3) },
                    text = { Text("Notes", fontSize = 12.sp) }
                )
            }

            // Content
            if (isLoading) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Color(0xFF667EEA))
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    when (selectedTab) {
                        0 -> {
                            item {
                                DossierInfoCard(
                                    dossier = dossier,
                                    onEditClick = { viewModel.openEditDossierDialog() }
                                )
                            }
                        }
                        1 -> {
                            item {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 12.dp),
                                    horizontalArrangement = Arrangement.End
                                ) {
                                    Button(
                                        onClick = { viewModel.openAddAnalyseDialog() },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = Color(0xFF51CF66)
                                        )
                                    ) {
                                        Icon(
                                            Icons.Default.Add,
                                            contentDescription = "Add",
                                            tint = Color.White,
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Ajouter", color = Color.White, fontSize = 13.sp)
                                    }
                                }
                            }
                            items(analyses) { analyse ->
                                AnalyseCard(
                                    analyse = analyse,
                                    onEdit = { viewModel.openEditAnalyseDialog(analyse) },
                                    onDownloadFile = { url ->
                                        CoroutineScope(Dispatchers.IO).launch {
                                            try {
                                                // Construire l'URL complète si c'est un chemin relatif
                                                val fullUrl = if (url.startsWith("/")) {
                                                    "http://ur_ip_adresse:3001$url"
                                                } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
                                                    "http://ur_ip_adresse:3001/$url"
                                                } else {
                                                    url
                                                }
                                                
                                                val client = OkHttpClient()
                                                val request = Request.Builder()
                                                    .url(fullUrl)
                                                    .build()
                                                
                                                val response = client.newCall(request).execute()
                                                
                                                if (response.isSuccessful) {
                                                    val fileName = "analyse_${analyse.idAnalyse}_${System.currentTimeMillis()}.pdf"
                                                    
                                                    // Télécharger dans le cache
                                                    val cacheFile = File(context.cacheDir, fileName)
                                                    response.body?.byteStream()?.use { input ->
                                                        FileOutputStream(cacheFile).use { output ->
                                                            input.copyTo(output)
                                                        }
                                                    }
                                                    
                                                    // Copier vers Downloads si possible
                                                    try {
                                                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                                            val contentValues = android.content.ContentValues().apply {
                                                                put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                                                                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                                                                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                                                            }
                                                            context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)?.let { uri ->
                                                                context.contentResolver.openOutputStream(uri)?.use { output ->
                                                                    cacheFile.inputStream().use { input ->
                                                                        input.copyTo(output)
                                                                    }
                                                                }
                                                            }
                                                        } else {
                                                            val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                                                            val downloadFile = File(downloadsDir, fileName)
                                                            cacheFile.copyTo(downloadFile, overwrite = true)
                                                        }
                                                    } catch (_: Exception) {
                                                        // Ignorer l'erreur de copie, on garde le fichier dans le cache
                                                    }
                                                    
                                                    withContext(Dispatchers.Main) {
                                                        Toast.makeText(context, "Téléchargement terminé: $fileName", Toast.LENGTH_LONG).show()
                                                        
                                                        // Ouvrir le fichier téléchargé
                                                        try {
                                                            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", cacheFile)
                                                            val intent = Intent(Intent.ACTION_VIEW).apply {
                                                                setDataAndType(uri, "application/pdf")
                                                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                                                            }
                                                            context.startActivity(intent)
                                                        } catch (_: Exception) {
                                                            Toast.makeText(context, "Fichier téléchargé: $fileName", Toast.LENGTH_SHORT).show()
                                                        }
                                                    }
                                                } else {
                                                    withContext(Dispatchers.Main) {
                                                        Toast.makeText(context, "Erreur: ${response.code}", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            } catch (e: Exception) {
                                                withContext(Dispatchers.Main) {
                                                    Toast.makeText(context, "Erreur: ${e.message}", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        }
                                        Toast.makeText(context, "Téléchargement en cours...", Toast.LENGTH_SHORT).show()
                                    }
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                            if (analyses.isEmpty()) {
                                item {
                                    EmptyStateCard(message = "Aucune analyse enregistrée")
                                }
                            }
                        }
                        2 -> {
                            items(ordonnances) { ordonnance ->
                                OrdonnanceCard(
                                    ordonnance = ordonnance,
                                    onDownloadFile = { url ->
                                        CoroutineScope(Dispatchers.IO).launch {
                                            try {
                                                // Construire l'URL complète si c'est un chemin relatif
                                                val fullUrl = if (url.startsWith("/")) {
                                                    "http://ur_ip_adresse:3001$url"
                                                } else if (!url.startsWith("http://") && !url.startsWith("https://")) {
                                                    "http://ur_ip_adresse:3001/$url"
                                                } else {
                                                    url
                                                }
                                                
                                                val client = OkHttpClient()
                                                val request = Request.Builder()
                                                    .url(fullUrl)
                                                    .build()
                                                
                                                val response = client.newCall(request).execute()
                                                
                                                if (response.isSuccessful) {
                                                    val fileName = "ordonnance_${ordonnance.idOrdonnance}_${System.currentTimeMillis()}.pdf"
                                                    
                                                    val file = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                                                        // Android 10+ : utiliser MediaStore
                                                        val contentValues = android.content.ContentValues().apply {
                                                            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                                                            put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                                                            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                                                        }
                                                        val uri = context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues)
                                                        if (uri != null) {
                                                            context.contentResolver.openOutputStream(uri)?.use { output ->
                                                                response.body?.byteStream()?.use { input ->
                                                                    input.copyTo(output)
                                                                }
                                                            }
                                                            // Créer un fichier temporaire pour l'ouverture
                                                            File(context.cacheDir, fileName).also { cacheFile ->
                                                                context.contentResolver.openInputStream(uri)?.use { input ->
                                                                    FileOutputStream(cacheFile).use { output ->
                                                                        input.copyTo(output)
                                                                    }
                                                                }
                                                            }
                                                        } else {
                                                            File(context.cacheDir, fileName)
                                                        }
                                                    } else {
                                                        // Android 9 et inférieur
                                                        val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                                                        File(downloadsDir, fileName).also { file ->
                                                            response.body?.byteStream()?.use { input ->
                                                                FileOutputStream(file).use { output ->
                                                                    input.copyTo(output)
                                                                }
                                                            }
                                                        }
                                                    }
                                                    
                                                    withContext(Dispatchers.Main) {
                                                        Toast.makeText(context, "Téléchargement terminé: $fileName", Toast.LENGTH_LONG).show()
                                                        
                                                        // Ouvrir le fichier téléchargé
                                                        try {
                                                            val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
                                                            val intent = Intent(Intent.ACTION_VIEW).apply {
                                                                setDataAndType(uri, "application/pdf")
                                                                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                                                            }
                                                            context.startActivity(intent)
                                                        } catch (_: Exception) {
                                                            Toast.makeText(context, "Fichier téléchargé dans Downloads", Toast.LENGTH_SHORT).show()
                                                        }
                                                    }
                                                } else {
                                                    withContext(Dispatchers.Main) {
                                                        Toast.makeText(context, "Erreur: ${response.code}", Toast.LENGTH_SHORT).show()
                                                    }
                                                }
                                            } catch (e: Exception) {
                                                withContext(Dispatchers.Main) {
                                                    Toast.makeText(context, "Erreur: ${e.message}", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        }
                                        Toast.makeText(context, "Téléchargement en cours...", Toast.LENGTH_SHORT).show()
                                    }
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                            if (ordonnances.isEmpty()) {
                                item {
                                    EmptyStateCard(message = "Aucune ordonnance enregistrée")
                                }
                            }
                        }
                        3 -> {
                            items(notes) { note ->
                                NoteCard(
                                    note = note
                                )
                                Spacer(modifier = Modifier.height(12.dp))
                            }
                            if (notes.isEmpty()) {
                                item {
                                    EmptyStateCard(message = "Aucune note médicale enregistrée")
                                }
                            }
                        }
                    }
                }
            }

            // Error/Success message with auto-dismiss
            if (errorMessage.isNotEmpty()) {
                LaunchedEffect(errorMessage) {
                    delay(3000)
                    viewModel.clearMessage()
                }
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (errorMessage.contains("succès", ignoreCase = true)) 
                            Color(0xFF51CF66) 
                        else 
                            Color(0xFFFF6B6B)
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            if (errorMessage.contains("succès", ignoreCase = true)) 
                                Icons.Default.CheckCircle 
                            else 
                                Icons.Default.Warning,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            errorMessage,
                            color = Color.White,
                            fontSize = 13.sp,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(
                            onClick = { viewModel.clearMessage() },
                            modifier = Modifier.size(24.dp)
                        ) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Close",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                }
            }
        }
    }

    // Dialogs
    if (showEditDossierDialog) {
        EditDossierDialog(
            dossier = dossier,
            onDismiss = { viewModel.closeEditDossierDialog() },
            onSave = { groupeSanguin, antecedents, traitements, vaccinations, diagnostic ->
                viewModel.updateDossier(groupeSanguin, antecedents, traitements, vaccinations, diagnostic)
            }
        )
    }

    if (showAddAnalyseDialog) {
        AddAnalyseDialog(
            onDismiss = { 
                viewModel.closeAddAnalyseDialog()
                selectedFileAnalyse = null
            },
            onSave = { idMedecin, type, date, resultats, laboratoire, notes, file ->
                viewModel.addAnalyse(idMedecin ?: userId, type, date, resultats, laboratoire, notes, file)
                selectedFileAnalyse = null
            },
            selectedFile = selectedFileAnalyse,
            onFileSelect = { filePickerAnalyse.launch("application/pdf") },
            medecins = medecins,
            defaultIdMedecin = if (userRole == "medecin") userId else null
        )
    }
    
    if (showEditAnalyseDialog && selectedAnalyse != null) {
        EditAnalyseDialog(
            analyse = selectedAnalyse!!,
            onDismiss = { 
                viewModel.closeEditAnalyseDialog()
                selectedFileAnalyse = null
            },
            onSave = { idMedecin, type, date, resultats, laboratoire, notes, file ->
                viewModel.updateAnalyse(
                    selectedAnalyse!!.idAnalyse!!,
                    idMedecin ?: userId,
                    type,
                    date,
                    resultats,
                    laboratoire,
                    notes,
                    file
                )
                selectedFileAnalyse = null
            },
            selectedFile = selectedFileAnalyse,
            onFileSelect = { filePickerAnalyse.launch("application/pdf") },
            medecins = medecins
        )
    }

}

@Composable
fun DossierInfoCard(
    dossier: DossierMedical?,
    onEditClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    "Informations Générales",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2C3E50)
                )
                IconButton(onClick = onEditClick) {
                    Icon(
                        Icons.Default.Edit,
                        contentDescription = "Edit",
                        tint = Color(0xFF667EEA),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            InfoRow(label = "Groupe Sanguin", value = dossier?.groupeSanguin ?: "Non renseigné")
            InfoRow(label = "Antécédents Médicaux", value = dossier?.antecedentsMedicaux ?: "Aucun")
            InfoRow(label = "Traitements en Cours", value = dossier?.traitementsEnCours ?: "Aucun")
            InfoRow(label = "Vaccinations", value = dossier?.vaccinations ?: "Aucune")
            InfoRow(label = "Diagnostic", value = dossier?.diagnostic ?: "Aucun")
            
            dossier?.derMiseAJour?.let {
                Text(
                    "Dernière mise à jour: $it",
                    fontSize = 11.sp,
                    color = Color(0xFF7F8C8D),
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Column {
        Text(
            label,
            fontSize = 12.sp,
            color = Color(0xFF7F8C8D),
            fontWeight = FontWeight.Medium
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            value,
            fontSize = 14.sp,
            color = Color(0xFF2C3E50),
            fontWeight = FontWeight.Normal
        )
    }
}

@Composable
fun AnalyseCard(
    analyse: Analyse, 
    onEdit: (() -> Unit)? = null,
    onDownloadFile: (String) -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    analyse.typeAnalyse ?: "Analyse",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2C3E50)
                )
                // Bouton Modifier - toujours visible
                onEdit?.let {
                    IconButton(onClick = it, modifier = Modifier.size(32.dp)) {
                        Icon(
                            Icons.Default.Edit,
                            contentDescription = "Modifier",
                            tint = Color(0xFF667EEA),
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
            analyse.dateAnalyse?.let {
                Text("Date: $it", fontSize = 12.sp, color = Color(0xFF7F8C8D))
            }
            analyse.laboratoire?.let {
                Text("Laboratoire: $it", fontSize = 12.sp, color = Color(0xFF7F8C8D))
            }
            analyse.resultats?.let {
                Text("Résultats: $it", fontSize = 13.sp, color = Color(0xFF2C3E50))
            }
            analyse.notes?.let {
                Text("Notes: $it", fontSize = 13.sp, color = Color(0xFF2C3E50))
            }
            analyse.medecinNom?.let { nom ->
                analyse.medecinPrenom?.let { prenom ->
                    Text(
                        "Par: Dr $prenom $nom",
                        fontSize = 11.sp,
                        color = Color(0xFF667EEA)
                    )
                }
            }
            
            // Document PDF download button
            analyse.urlDocument?.let { url ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Button(
                        onClick = { onDownloadFile(url) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF667EEA)
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("📥", fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Télécharger le document PDF",
                            color = Color.White,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun OrdonnanceCard(
    ordonnance: Ordonnance, 
    onDownloadFile: (String) -> Unit = {}
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                "Ordonnance",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF2C3E50)
            )
            ordonnance.dateOrdonnance?.let {
                Text("Date: $it", fontSize = 12.sp, color = Color(0xFF7F8C8D))
            }
            ordonnance.medicaments?.let {
                Text("Médicaments: $it", fontSize = 13.sp, color = Color(0xFF2C3E50))
            }
            ordonnance.posologie?.let {
                Text("Posologie: $it", fontSize = 12.sp, color = Color(0xFF7F8C8D))
            }
            ordonnance.dureeTraitement?.let {
                Text("Durée: $it", fontSize = 12.sp, color = Color(0xFF7F8C8D))
            }
            ordonnance.medecinNom?.let { nom ->
                ordonnance.medecinPrenom?.let { prenom ->
                    Text(
                        "Par: Dr $prenom $nom",
                        fontSize = 11.sp,
                        color = Color(0xFF667EEA)
                    )
                }
            }
            
            // Document PDF download button
            ordonnance.urlDocument?.let { url ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Button(
                        onClick = { onDownloadFile(url) },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF667EEA)
                        ),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("📥", fontSize = 18.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Télécharger le document PDF",
                            color = Color.White,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun NoteCard(note: NoteMedicale) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                note.typeNote ?: "Note Médicale",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF2C3E50)
            )
            note.contenuNote?.let {
                Text(it, fontSize = 13.sp, color = Color(0xFF2C3E50))
            }
            note.createdAt?.let {
                Text("Date: $it", fontSize = 11.sp, color = Color(0xFF7F8C8D))
            }
            note.medecinNom?.let { nom ->
                note.medecinPrenom?.let { prenom ->
                    Text(
                        "Par: Dr $prenom $nom",
                        fontSize = 11.sp,
                        color = Color(0xFF667EEA)
                    )
                }
            }
        }
    }
}

@Composable
fun EmptyStateCard(message: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                message,
                fontSize = 14.sp,
                color = Color(0xFF7F8C8D),
                textAlign = TextAlign.Center
            )
        }
    }
}

// Dialogs
@Composable
fun EditDossierDialog(
    dossier: DossierMedical?,
    onDismiss: () -> Unit,
    onSave: (String?, String?, String?, String?, String?) -> Unit
) {
    var groupeSanguin by remember { mutableStateOf(dossier?.groupeSanguin ?: "") }
    var antecedents by remember { mutableStateOf(dossier?.antecedentsMedicaux ?: "") }
    var traitements by remember { mutableStateOf(dossier?.traitementsEnCours ?: "") }
    var vaccinations by remember { mutableStateOf(dossier?.vaccinations ?: "") }
    var diagnostic by remember { mutableStateOf(dossier?.diagnostic ?: "") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Modifier le Dossier",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )
                OutlinedTextField(
                    value = groupeSanguin,
                    onValueChange = { groupeSanguin = it },
                    label = { Text("Groupe Sanguin") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = antecedents,
                    onValueChange = { antecedents = it },
                    label = { Text("Antécédents Médicaux") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                OutlinedTextField(
                    value = traitements,
                    onValueChange = { traitements = it },
                    label = { Text("Traitements en Cours") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                OutlinedTextField(
                    value = vaccinations,
                    onValueChange = { vaccinations = it },
                    label = { Text("Vaccinations") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2
                )
                OutlinedTextField(
                    value = diagnostic,
                    onValueChange = { diagnostic = it },
                    label = { Text("Diagnostic") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE74C3C))
                    ) {
                        Text("Annuler", color = Color.White)
                    }
                    Button(
                        onClick = {
                            onSave(
                                groupeSanguin.ifBlank { null },
                                antecedents.ifBlank { null },
                                traitements.ifBlank { null },
                                vaccinations.ifBlank { null },
                                diagnostic.ifBlank { null }
                            )
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF667EEA)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Enreg", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddAnalyseDialog(
    onDismiss: () -> Unit,
    onSave: (Int?, String, String, String?, String?, String?, File?) -> Unit,
    selectedFile: File? = null,
    onFileSelect: () -> Unit = {},
    medecins: List<com.example.medilink.data.network.PatientApiService.MedecinData> = emptyList(),
    defaultIdMedecin: Int? = null
) {
    val datePickerState = rememberDatePickerState()
    var showDatePicker by remember { mutableStateOf(false) }
    var expandedMedecinDropdown by remember { mutableStateOf(false) }
    
    var selectedMedecin by remember { 
        mutableStateOf(
            medecins.find { it.idUtilisateur == defaultIdMedecin }
        )
    }
    var type by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }
    var resultats by remember { mutableStateOf("") }
    var laboratoire by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Ajouter une Analyse",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )
                
                // Médecin selector
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = selectedMedecin?.let { "Dr ${it.prenom} ${it.nom} - ${it.specialite}" } ?: "Sélectionner un médecin",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Médecin *") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { expandedMedecinDropdown = true },
                        trailingIcon = {
                            IconButton(onClick = { expandedMedecinDropdown = true }) {
                                Text("▼", fontSize = 16.sp, color = Color(0xFF667EEA))
                            }
                        },
                        singleLine = true
                    )
                    DropdownMenu(
                        expanded = expandedMedecinDropdown,
                        onDismissRequest = { expandedMedecinDropdown = false },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        medecins.forEach { medecin ->
                            DropdownMenuItem(
                                onClick = {
                                    selectedMedecin = medecin
                                    expandedMedecinDropdown = false
                                },
                                text = { 
                                    Text("Dr ${medecin.prenom} ${medecin.nom} - ${medecin.specialite}")
                                }
                            )
                        }
                    }
                }
                
                OutlinedTextField(
                    value = type,
                    onValueChange = { type = it },
                    label = { Text("Type d'analyse *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = date,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Date *") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDatePicker = true },
                    trailingIcon = {
                        IconButton(onClick = { showDatePicker = true }) {
                            Icon(Icons.Default.DateRange, contentDescription = "Select date")
                        }
                    },
                    singleLine = true
                )
                OutlinedTextField(
                    value = resultats,
                    onValueChange = { resultats = it },
                    label = { Text("Résultats") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                OutlinedTextField(
                    value = laboratoire,
                    onValueChange = { laboratoire = it },
                    label = { Text("Laboratoire") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2
                )
                
                // File picker button
                Button(
                    onClick = onFileSelect,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF95A5A6)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("📄", fontSize = 18.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        selectedFile?.name ?: "Sélectionner un fichier PDF",
                        color = Color.White,
                        fontSize = 13.sp
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE74C3C))
                    ) {
                        Text("Annuler", color = Color.White)
                    }
                    Button(
                        onClick = {
                            if (type.isNotBlank() && date.isNotBlank() && selectedMedecin != null) {
                                onSave(
                                    selectedMedecin?.idUtilisateur,
                                    type,
                                    date,
                                    resultats.ifBlank { null },
                                    laboratoire.ifBlank { null },
                                    notes.ifBlank { null },
                                    selectedFile
                                )
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF667EEA))
                    ) {
                        Text("Enreg", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
    
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                        val formattedDate = sdf.format(Date(millis))
                        date = formattedDate
                    }
                    showDatePicker = false
                }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Annuler")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditAnalyseDialog(
    analyse: Analyse,
    onDismiss: () -> Unit,
    onSave: (Int?, String?, String?, String?, String?, String?, File?) -> Unit,
    selectedFile: File? = null,
    onFileSelect: () -> Unit = {},
    medecins: List<com.example.medilink.data.network.PatientApiService.MedecinData> = emptyList()
) {
    val datePickerState = rememberDatePickerState()
    var showDatePicker by remember { mutableStateOf(false) }
    var expandedMedecinDropdown by remember { mutableStateOf(false) }
    
    var selectedMedecin by remember { 
        mutableStateOf(
            medecins.find { it.idUtilisateur == analyse.idMedecinPrescripteur }
        )
    }
    var type by remember { mutableStateOf(analyse.typeAnalyse ?: "") }
    var date by remember { 
        mutableStateOf(
            analyse.dateAnalyse?.substringBefore("T") ?: ""
        ) 
    }
    var resultats by remember { mutableStateOf(analyse.resultats ?: "") }
    var laboratoire by remember { mutableStateOf(analyse.laboratoire ?: "") }
    var notes by remember { mutableStateOf(analyse.notes ?: "") }
    
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier.fillMaxWidth(0.9f),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    "Modifier l'Analyse",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.fillMaxWidth(),
                    textAlign = TextAlign.Center
                )
                
                // Médecin selector
                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = selectedMedecin?.let { "Dr ${it.prenom} ${it.nom} - ${it.specialite}" } ?: "Sélectionner un médecin",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Médecin *") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { expandedMedecinDropdown = true },
                        trailingIcon = {
                            IconButton(onClick = { expandedMedecinDropdown = true }) {
                                Text("▼", fontSize = 16.sp, color = Color(0xFF667EEA))
                            }
                        },
                        singleLine = true
                    )
                    DropdownMenu(
                        expanded = expandedMedecinDropdown,
                        onDismissRequest = { expandedMedecinDropdown = false },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        medecins.forEach { medecin ->
                            DropdownMenuItem(
                                onClick = {
                                    selectedMedecin = medecin
                                    expandedMedecinDropdown = false
                                },
                                text = { 
                                    Text("Dr ${medecin.prenom} ${medecin.nom} - ${medecin.specialite}")
                                }
                            )
                        }
                    }
                }
                
                OutlinedTextField(
                    value = type,
                    onValueChange = { type = it },
                    label = { Text("Type d'analyse *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = date,
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Date *") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showDatePicker = true },
                    trailingIcon = {
                        IconButton(onClick = { showDatePicker = true }) {
                            Icon(Icons.Default.DateRange, contentDescription = "Select date")
                        }
                    },
                    singleLine = true
                )
                OutlinedTextField(
                    value = resultats,
                    onValueChange = { resultats = it },
                    label = { Text("Résultats") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 3
                )
                OutlinedTextField(
                    value = laboratoire,
                    onValueChange = { laboratoire = it },
                    label = { Text("Laboratoire") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes") },
                    modifier = Modifier.fillMaxWidth(),
                    maxLines = 2
                )
                
                // File picker button
                Button(
                    onClick = onFileSelect,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF95A5A6)
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("📄", fontSize = 18.sp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        selectedFile?.name ?: "Sélectionner un fichier PDF",
                        color = Color.White,
                        fontSize = 13.sp
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE74C3C))
                    ) {
                        Text("Annuler", color = Color.White)
                    }
                    Button(
                        onClick = {
                            if (type.isNotBlank() && date.isNotBlank() && selectedMedecin != null) {
                                onSave(
                                    selectedMedecin?.idUtilisateur,
                                    type,
                                    date,
                                    resultats.ifBlank { null },
                                    laboratoire.ifBlank { null },
                                    notes.ifBlank { null },
                                    selectedFile
                                )
                            }
                        },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF667EEA))
                    ) {
                        Text("Enreg", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        }
    }
    
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                        val formattedDate = sdf.format(Date(millis))
                        date = formattedDate
                    }
                    showDatePicker = false
                }) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Annuler")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}


