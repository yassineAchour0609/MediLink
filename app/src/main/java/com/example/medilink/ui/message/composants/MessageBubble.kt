package com.example.medilink.ui.message.composants

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.medilink.data.model.Message
import com.example.medilink.data.network.createdAtFormatted

@Composable
fun MessageBubble(message: Message, isOwn: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isOwn) Arrangement.End else Arrangement.Start
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 260.dp)
                .background(
                    if (isOwn) Color(0xFF667EEA) else Color(0xFFE8EAF6),
                    RoundedCornerShape(16.dp)
                )
                .padding(12.dp)
        ) {
            if (!message.contenu.isNullOrBlank()) {
                Text(
                    text = message.contenu,
                    color = if (isOwn) Color.White else Color.Black,
                    fontSize = 15.sp
                )
            }

            if (message.urlDocument != null) {
                Spacer(modifier = Modifier.height(5.dp))
                Text(
                    text = "Pièce jointe: ${message.nomDocument}",
                    color = if (isOwn) Color.White else Color(0xFF3F51B5),
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp
                )
            }

            Text(
                text = message.createdAtFormatted(),
                color = if (isOwn) Color.White.copy(alpha = 0.7f)
                else Color.DarkGray.copy(alpha = 0.6f),
                fontSize = 11.sp,
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}
