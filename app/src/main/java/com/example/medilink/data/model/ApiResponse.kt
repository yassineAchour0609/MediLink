package com.example.medilink.data.model

data class ApiResponse<T>(
    val success: Boolean,
    val message: String? = null,
    val id: Int? = null,
    val url_document: String? = null
)
