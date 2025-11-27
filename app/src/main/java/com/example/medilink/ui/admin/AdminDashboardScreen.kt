package com.example.medilink.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminDashboardScreen(
    viewModel: AdminViewModel = viewModel(),
    token: String,
    onNavigateToMedecins: () -> Unit,
    onNavigateToPatients: () -> Unit,
    onLogout: () -> Unit
) {
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val stats by viewModel.stats.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadStats(token)
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Color.White,
                modifier = Modifier.width(280.dp)
            ) {
                DrawerContent(
                    onCloseDrawer = {
                        scope.launch { drawerState.close() }
                    },
                    onNavigateToMedecins = {
                        scope.launch { drawerState.close() }
                        onNavigateToMedecins()
                    },
                    onNavigateToPatients = {
                        scope.launch { drawerState.close() }
                        onNavigateToPatients()
                    },
                    onLogout = onLogout
                )
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "Tableau de Bord",
                                fontWeight = FontWeight.Bold,
                                fontSize = 22.sp
                            )
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = {
                            scope.launch { drawerState.open() }
                        }) {
                            Icon(
                                Icons.Default.Menu,
                                contentDescription = "Menu",
                                tint = Color(0xFF667EEA)
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = Color.White
                    )
                )
            }
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFFF8F9FA))
                    .padding(padding)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    ModernHeader()
                }

                item {
                    ColorfulStatsGrid(stats = stats)
                }

                item {
                    Text(
                        "Gestion",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF2C3E50)
                    )
                }

                item {
                    ManagementCardsGrid(
                        onNavigateToMedecins = onNavigateToMedecins,
                        onNavigateToPatients = onNavigateToPatients
                    )
                }
            }
        }
    }
}

@Composable
fun DrawerContent(
    onCloseDrawer: () -> Unit,
    onNavigateToMedecins: () -> Unit,
    onNavigateToPatients: () -> Unit,
    onLogout: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
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
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(70.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(40.dp)
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    "Admin",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Text(
                    "Administrateur",
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.9f)
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        DrawerMenuItem(
            icon = Icons.Default.Home,
            title = "Tableau de Bord",
            isActive = true,
            onClick = {
                onCloseDrawer()
            }
        )

        DrawerMenuItem(
            icon = Icons.Default.Person,
            title = "Gérer les Médecins",
            isActive = false,
            onClick = onNavigateToMedecins
        )

        DrawerMenuItem(
            icon = Icons.Default.Face,
            title = "Gérer les Patients",
            isActive = false,
            onClick = onNavigateToPatients
        )

        Spacer(modifier = Modifier.weight(1f))

        Divider()

        DrawerMenuItem(
            icon = Icons.Default.ExitToApp,
            title = "Déconnexion",
            isActive = false,
            onClick = {
                onCloseDrawer()
                onLogout()
            },
            isLogout = true
        )

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
fun DrawerMenuItem(
    icon: ImageVector,
    title: String,
    isActive: Boolean,
    onClick: () -> Unit,
    isLogout: Boolean = false
) {
    Surface(
        onClick = onClick,
        color = if (isActive) Color(0xFFE8EAFF) else Color.Transparent,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = when {
                    isLogout -> Color(0xFFFF6B6B)
                    isActive -> Color(0xFF667EEA)
                    else -> Color(0xFF7F8C8D)
                },
                modifier = Modifier.size(24.dp)
            )

            Spacer(modifier = Modifier.width(16.dp))

            Text(
                title,
                fontSize = 16.sp,
                fontWeight = if (isActive) FontWeight.SemiBold else FontWeight.Normal,
                color = when {
                    isLogout -> Color(0xFFFF6B6B)
                    isActive -> Color(0xFF667EEA)
                    else -> Color(0xFF2C3E50)
                }
            )
        }
    }
}

@Composable
fun ModernHeader() {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape)
                    .background(
                        Brush.linearGradient(
                            colors = listOf(Color(0xFF667EEA), Color(0xFF764BA2))
                        )
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    "A",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            Column {
                Text(
                    "Bonjour Admin 👋",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF2C3E50)
                )
                Text(
                    "Bienvenue sur votre tableau de bord",
                    fontSize = 14.sp,
                    color = Color(0xFF7F8C8D)
                )
            }
        }
    }
}

@Composable
fun ColorfulStatsGrid(stats: AdminStats) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        modifier = Modifier.height(155.dp)
    ) {
        item {
            ColorfulStatCard(
                number = stats.totalMedecins.toString(),
                label = "Médecins",
                icon = Icons.Default.Person,
                gradient = listOf(Color(0xFF667EEA), Color(0xFF764BA2))
            )
        }
        item {
            ColorfulStatCard(
                number = stats.totalPatients.toString(),
                label = "Patients",
                icon = Icons.Default.Favorite,
                gradient = listOf(Color(0xFF51CF66), Color(0xFF2ECC71))
            )
        }
    }
}

@Composable
fun ColorfulStatCard(
    number: String,
    label: String,
    icon: ImageVector,
    gradient: List<Color>
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(150.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.linearGradient(gradient))
                .padding(16.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.3f),
                modifier = Modifier
                    .size(60.dp)
                    .align(Alignment.TopEnd)
            )

            Column(
                modifier = Modifier.align(Alignment.BottomStart)
            ) {
                Text(
                    number,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    label,
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.9f),
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun ManagementCardsGrid(
    onNavigateToMedecins: () -> Unit,
    onNavigateToPatients: () -> Unit
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        ManagementCard(
            icon = Icons.Default.Person,
            title = "Gérer les Médecins",
            description = "Ajouter, modifier ou supprimer des médecins",
            gradient = listOf(Color(0xFF667EEA), Color(0xFF764BA2)),
            onClick = onNavigateToMedecins
        )

        ManagementCard(
            icon = Icons.Default.Face,
            title = "Gérer les Patients",
            description = "Consulter et gérer les dossiers patients",
            gradient = listOf(Color(0xFF51CF66), Color(0xFF2ECC71)),
            onClick = onNavigateToPatients
        )
    }
}

@Composable
fun ManagementCard(
    icon: ImageVector,
    title: String,
    description: String,
    gradient: List<Color>,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(120.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Brush.linearGradient(gradient))
                .padding(20.dp)
        ) {
            Icon(
                icon,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.2f),
                modifier = Modifier
                    .size(80.dp)
                    .align(Alignment.TopEnd)
            )

            Column(
                modifier = Modifier.align(Alignment.CenterStart)
            ) {
                Text(
                    title,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    description,
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.9f)
                )
            }

            Icon(
                Icons.Default.ArrowForward,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier
                    .size(24.dp)
                    .align(Alignment.BottomEnd)
            )
        }
    }
}
