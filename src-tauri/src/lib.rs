use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct KeyValue {
    id: String,
    key: String,
    value: String,
    enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum AuthType {
    None,
    Basic,
    Bearer,
    ApiKey,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AuthConfig {
    #[serde(rename = "type")]
    auth_type: AuthType,
    username: Option<String>,
    password: Option<String>,
    token: Option<String>,
    api_key: Option<String>,
    api_key_header: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
pub enum BodyType {
    None,
    Text,
    Json,
    File,
    FormData,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RequestBody {
    #[serde(rename = "type")]
    body_type: BodyType,
    content: Option<String>,
    form_data: Option<Vec<KeyValue>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestConfig {
    method: String,
    url: String,
    headers: Vec<KeyValue>,
    params: Vec<KeyValue>,
    body: RequestBody,
    auth: AuthConfig,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseData {
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
    body: String,
    time: u64,
    size: usize,
}

#[tauri::command]
async fn execute_http_request(request: RequestConfig) -> Result<ResponseData, String> {
    let start_time = Instant::now();

    // Normalizar URL - agregar http:// si es localhost o IP sin protocolo
    let mut url = request.url.clone();
    if url.starts_with("localhost:") || url.chars().next().map_or(false, |c| c.is_numeric()) {
        if !url.starts_with("http://") && !url.starts_with("https://") {
            url = format!("http://{}", url);
        }
    }

    // Construir URL con parámetros
    let mut final_url = url::Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;
    
    for param in request.params.iter() {
        if param.enabled && !param.key.is_empty() {
            final_url.query_pairs_mut().append_pair(&param.key, &param.value);
        }
    }

    // Crear cliente reqwest con timeout
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .danger_accept_invalid_certs(true) // Para desarrollo local
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Construir request
    let method = reqwest::Method::from_bytes(request.method.as_bytes())
        .map_err(|e| format!("Invalid HTTP method: {}", e))?;

    let mut req_builder = client.request(method, final_url.as_str());

    // Agregar headers
    for header in request.headers.iter() {
        if header.enabled && !header.key.is_empty() {
            req_builder = req_builder.header(&header.key, &header.value);
        }
    }

    // Agregar autenticación
    match request.auth.auth_type {
        AuthType::Basic => {
            if let (Some(username), Some(password)) = (&request.auth.username, &request.auth.password) {
                let credentials = base64::Engine::encode(
                    &base64::engine::general_purpose::STANDARD,
                    format!("{}:{}", username, password)
                );
                req_builder = req_builder.header("Authorization", format!("Basic {}", credentials));
            }
        }
        AuthType::Bearer => {
            if let Some(token) = &request.auth.token {
                req_builder = req_builder.header("Authorization", format!("Bearer {}", token));
            }
        }
        AuthType::ApiKey => {
            if let (Some(key), Some(header)) = (&request.auth.api_key, &request.auth.api_key_header) {
                req_builder = req_builder.header(header, key);
            }
        }
        AuthType::None => {}
    }

    // Agregar body según el tipo
    match request.body.body_type {
        BodyType::None => {}
        BodyType::Text => {
            if let Some(content) = &request.body.content {
                req_builder = req_builder.body(content.clone());
            }
        }
        BodyType::Json => {
            if let Some(content) = &request.body.content {
                // Verificar si el contenido tiene Content-Type ya definido
                let has_content_type = request.headers.iter()
                    .any(|h| h.enabled && h.key.to_lowercase() == "content-type");
                
                if !has_content_type {
                    req_builder = req_builder.header("Content-Type", "application/json");
                }
                req_builder = req_builder.body(content.clone());
            }
        }
        BodyType::FormData => {
            if let Some(form_fields) = &request.body.form_data {
                let mut form = reqwest::multipart::Form::new();
                for field in form_fields.iter() {
                    if field.enabled && !field.key.is_empty() {
                        form = form.text(field.key.clone(), field.value.clone());
                    }
                }
                req_builder = req_builder.multipart(form);
            }
        }
        BodyType::File => {
            // Los archivos se manejarán en el frontend por ahora
            // debido a restricciones de seguridad
        }
    }

    // Ejecutar request
    let response = req_builder
        .send()
        .await
        .map_err(|e| {
            if e.is_timeout() {
                "Request timeout - The request took too long to complete".to_string()
            } else if e.is_connect() {
                "Network error - Unable to connect to the server. Check if the server is running.".to_string()
            } else {
                format!("Request failed: {}", e)
            }
        })?;

    // Extraer información de la respuesta
    let status = response.status().as_u16();
    let status_text = response.status().canonical_reason().unwrap_or("Unknown").to_string();

    // Convertir headers a HashMap
    let mut headers = HashMap::new();
    for (key, value) in response.headers().iter() {
        if let Ok(value_str) = value.to_str() {
            headers.insert(key.to_string(), value_str.to_string());
        }
    }

    // Obtener body
    let body = response
        .text()
        .await
        .unwrap_or_else(|e| format!("Failed to read response body: {}", e));

    let elapsed = start_time.elapsed().as_millis() as u64;
    let size = body.len();

    Ok(ResponseData {
        status,
        status_text,
        headers,
        body,
        time: elapsed,
        size,
    })
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, execute_http_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
