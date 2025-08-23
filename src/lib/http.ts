import { useCallback } from 'preact/hooks';
import { RequestConfig, ResponseData, Environment } from './types';
import { config } from './config';
import { 
  substituteVariables, 
  substituteInHeaders, 
  substituteInParams, 
  substituteInBody 
} from './variables';

export const useHttpRequest = () => {
  const executeRequest = useCallback(async (
    requestConfig: RequestConfig, 
    proxyConfig?: any,
    environment?: Environment
  ): Promise<ResponseData> => {
    const startTime = Date.now();
    
    try {
      // Apply variable substitution y normalizar URL
      let processedUrl = substituteVariables(requestConfig.url, environment);
      
      // Parsear localhost:puerto a formato HTTP
      if (processedUrl.match(/^localhost:\d+/) || processedUrl.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/)) {
        processedUrl = `http://${processedUrl}`;
      }
      
      const processedHeaders = substituteInHeaders(requestConfig.headers, environment);
      const processedParams = substituteInParams(requestConfig.params, environment);
      
      // Determinar si usar proxy (solo si está explícitamente habilitado)
      const useProxy = proxyConfig?.enabled === true;
      
      let requestUrl: string;
      let requestHeaders: Record<string, string> = {};

      if (useProxy) {
        // Usar el proxy - obtener URL del proxy desde configuración
        const proxyUrl = proxyConfig?.userProvided && proxyConfig?.url 
          ? proxyConfig.url 
          : config.PROXY_URL;
          
        requestUrl = proxyUrl;
        
        // Solo header de autenticación para el proxy
        requestHeaders['X-API-Key'] = config.PROXY_API_KEY;
        // No configurar Content-Type aquí, se configurará después si es necesario
      } else {
        // Petición directa - construir URL con parámetros
        const url = new URL(processedUrl);
        processedParams
          .filter(param => param.enabled && param.key)
          .forEach(param => {
            url.searchParams.append(param.key, param.value);
          });
        requestUrl = url.toString();
      }
      
      // Agregar headers del usuario
      processedHeaders
        .filter(header => header.enabled && header.key)
        .forEach(header => {
          requestHeaders[header.key] = header.value;
        });

      // Agregar autenticación
      if (requestConfig.auth.type === 'basic' && requestConfig.auth.username && requestConfig.auth.password) {
        const credentials = btoa(`${requestConfig.auth.username}:${requestConfig.auth.password}`);
        requestHeaders['Authorization'] = `Basic ${credentials}`;
      } else if (requestConfig.auth.type === 'bearer' && requestConfig.auth.token) {
        requestHeaders['Authorization'] = `Bearer ${requestConfig.auth.token}`;
      } else if (requestConfig.auth.type === 'apikey' && requestConfig.auth.apiKey && requestConfig.auth.apiKeyHeader) {
        requestHeaders[requestConfig.auth.apiKeyHeader] = requestConfig.auth.apiKey;
      }

      // Determinar si se necesita body
      let body: string | FormData | undefined = undefined;
      let originalBodyRaw: string | undefined; // Para debug / verificación
      if (requestConfig.method !== 'GET' && requestConfig.method !== 'HEAD' && requestConfig.body.type !== 'none') {
        if (requestConfig.body.type === 'text') {
          originalBodyRaw = requestConfig.body.content || '';
          body = substituteInBody(originalBodyRaw, environment);
        } else if (requestConfig.body.type === 'json') {
          // Enviar JSON sin parsear - exactamente como el usuario lo escribió
          originalBodyRaw = requestConfig.body.content || '';
          body = substituteInBody(originalBodyRaw, environment);
          
          // Para peticiones directas, asegurar Content-Type
          if (!useProxy && !requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = 'application/json; charset=utf-8';
          }

          // Si es petición directa y el body está vacío pero el usuario tenía algo (por sustitución vacía), evitar enviar body vacío por accidente
          if (!useProxy && body.trim() === '' && originalBodyRaw.trim() !== '') {
            // Restaurar el original si la sustitución borró el contenido
            body = originalBodyRaw;
          }
        } else if (requestConfig.body.type === 'file') {
          // Single or multiple file upload
          if (requestConfig.body.files && requestConfig.body.files.length > 0) {
            const formData = new FormData();
            requestConfig.body.files.forEach((file, index) => {
              formData.append(`file${index}`, file);
            });
            body = formData;
            // Don't set Content-Type header, let browser set it with boundary
          }
        } else if (requestConfig.body.type === 'form-data') {
          // Form data with fields and files
          const formData = new FormData();
          
          // Add form fields
          if (requestConfig.body.formData) {
            requestConfig.body.formData
              .filter(field => field.enabled && field.key)
              .forEach(field => {
                const processedValue = substituteVariables(field.value, environment);
                formData.append(field.key, processedValue);
              });
          }
          
          // Add files
          if (requestConfig.body.files) {
            requestConfig.body.files.forEach((file, index) => {
              formData.append(`file${index}`, file);
            });
          }
          
          body = formData;
          // Don't set Content-Type header, let browser set it with boundary
        }
      }

      // Configurar opciones de fetch con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60000); // 60 segundos timeout

      const fetchOptions: RequestInit = {
        method: useProxy ? 'POST' : requestConfig.method, // Siempre POST para proxy
        headers: requestHeaders,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
        signal: controller.signal,
      };

      // Agregar body si existe (permitir body string vacío explícitamente sólo si el usuario realmente lo dejó vacío)
      if (body !== undefined) {
        if (useProxy) {
          // Para proxy, construir payload con método y URL original
          const targetUrl = new URL(processedUrl);
          // Agregar parámetros a la URL objetivo
          processedParams
            .filter(param => param.enabled && param.key)
            .forEach(param => {
              targetUrl.searchParams.append(param.key, param.value);
            });

          const proxyPayload: any = {
            url: targetUrl.toString(),
            method: requestConfig.method,
            headers: Object.fromEntries(
              processedHeaders
                .filter(header => header.enabled && header.key)
                .map(header => [header.key, header.value])
            ),
            bodyType: requestConfig.body.type // Indicar el tipo de body al proxy
          };

          // Agregar body - mantenerlo como string para compatibilidad
          if (!(body instanceof FormData)) {
            // Para JSON y texto, enviar el body como string
            proxyPayload.body = body;
          } else {
            // Para FormData, convertir a objeto para serialización JSON
            const formDataObject: { [key: string]: any } = {};
            body.forEach((value, key) => {
              formDataObject[key] = value;
            });
            proxyPayload.body = formDataObject;
          }

          fetchOptions.body = JSON.stringify(proxyPayload);
          // Configurar Content-Type para el proxy DESPUÉS de procesar headers del usuario
          requestHeaders['Content-Type'] = 'application/json';
        } else {
          // Petición directa
          if (typeof body === 'string') {
            // Asegurar Content-Type para JSON detectando heurísticamente aunque el usuario no lo haya puesto
            const trimmed = body.trim();
            const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
            if (looksLikeJson && !Object.keys(requestHeaders).some(h => h.toLowerCase() === 'content-type')) {
              requestHeaders['Content-Type'] = 'application/json; charset=utf-8';
            }
          }
          fetchOptions.body = body;
        }
      } else if (useProxy) {
        // Incluso sin body, enviar información completa al proxy
        const targetUrl = new URL(processedUrl);
        // Agregar parámetros a la URL objetivo
        processedParams
          .filter(param => param.enabled && param.key)
          .forEach(param => {
            targetUrl.searchParams.append(param.key, param.value);
          });

        const proxyPayload = {
          url: targetUrl.toString(),
          method: requestConfig.method,
          headers: Object.fromEntries(
            processedHeaders
              .filter(header => header.enabled && header.key)
              .map(header => [header.key, header.value])
          )
        };
        fetchOptions.body = JSON.stringify(proxyPayload);
        // Configurar Content-Type para el proxy
        requestHeaders['Content-Type'] = 'application/json';
      }

      // Configurar URL final para la petición
      let finalUrl = requestUrl;
      if (useProxy) {
        // Usar URL del proxy que ya está configurada
        finalUrl = requestUrl; // requestUrl ya es la URL del proxy cuando useProxy es true
        // Los headers del proxy ya están configurados anteriormente
      } else {
        // Si no se usa proxy, agregar parámetros a la URL
        const url = new URL(requestConfig.url);
        requestConfig.params
          .filter(param => param.enabled && param.key)
          .forEach(param => {
            url.searchParams.append(param.key, param.value);
          });
        finalUrl = url.toString();
      }

      let response: Response;
      
      try {
        // Debug opcional en desarrollo (sólo si no proxy) para verificar body antes de enviar
        try {
          if (!useProxy && (window as any)?.__REQ_DEBUG__ !== false) {
            // Evitar logging de archivos grandes
            const preview = typeof body === 'string' ? (body.length > 500 ? body.slice(0,500) + '...(+truncated)' : body) : '[FormData]';
            // eslint-disable-next-line no-console
            console.info('[Reqly][HTTP] Sending request', {
              url: finalUrl,
              method: requestConfig.method,
              headers: requestHeaders,
              bodyPreview: preview,
              bodyLength: typeof body === 'string' ? body.length : undefined
            });
          }
        } catch {}

        // Realizar la petición
        response = await fetch(finalUrl, fetchOptions);
        // Limpiar el timeout
        clearTimeout(timeoutId);
      } catch (error) {
        // Limpiar el timeout en caso de error
        clearTimeout(timeoutId);
        
        // Manejar diferentes tipos de error
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - The request took too long to complete');
          } else if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error - Unable to connect to the server. Check your internet connection or if the server is running.');
          } else {
            throw new Error(error.message);
          }
        }
        
        throw new Error('Unknown error occurred during request');
      }
      
      // Determinar cómo procesar la respuesta basado en el Content-Type
      const contentType = response.headers.get('content-type') || '';
      let responseBody: string;
      
      if (contentType.includes('image/')) {
        // Para imágenes, usar directamente la URL original de la configuración
        // Esto evita problemas de CORS y es más eficiente
        responseBody = requestConfig.url;
      } else {
        // Para otros tipos, usar texto
        responseBody = await response.text();
      }
      
      const endTime = Date.now();

      // Convertir headers de Response a objeto
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseBody,
        time: endTime - startTime,
        size: new Blob([responseBody]).size
      };
    } catch (error) {
      // Este catch se ejecutará si hay algún error no manejado en el try-catch interno
      throw error;
    }
  }, []);

  return { executeRequest };
};
