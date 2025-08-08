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
      // Apply variable substitution
      const processedUrl = substituteVariables(requestConfig.url, environment);
      const processedHeaders = substituteInHeaders(requestConfig.headers, environment);
      const processedParams = substituteInParams(requestConfig.params, environment);
      
      // Determinar si usar proxy (siempre habilitado con la configuración por defecto)
      const useProxy = proxyConfig?.enabled !== false;
      
      let requestUrl: string;
      let requestHeaders: Record<string, string> = {};

      if (useProxy) {
        // Usar el proxy - obtener URL del proxy desde configuración
        const proxyUrl = proxyConfig?.userProvided && proxyConfig?.url 
          ? proxyConfig.url 
          : config.PROXY_URL;
          
        requestUrl = proxyUrl;
        
        // Headers automáticos del proxy (ocultos para el usuario)
        requestHeaders['X-API-Key'] = config.PROXY_API_KEY;
        requestHeaders['url'] = processedUrl;
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
      let body: string | undefined = undefined;
      if (requestConfig.method !== 'GET' && requestConfig.method !== 'HEAD' && requestConfig.body.type !== 'none') {
        if (requestConfig.body.type === 'text' || requestConfig.body.type === 'json') {
          body = substituteInBody(requestConfig.body.content || '', environment);
          if (requestConfig.body.type === 'json' && !requestHeaders['Content-Type']) {
            requestHeaders['Content-Type'] = 'application/json';
          }
        }
        // TODO: Implementar file upload
      }

      // Configurar opciones de fetch
      const fetchOptions: RequestInit = {
        method: requestConfig.method,
        headers: requestHeaders,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
      };

      // Agregar body si existe
      if (body !== undefined) {
        fetchOptions.body = body;
      }

      // Si no se usa proxy, agregar parámetros a la URL
      if (!useProxy) {
        const url = new URL(requestConfig.url);
        requestConfig.params
          .filter(param => param.enabled && param.key)
          .forEach(param => {
            url.searchParams.append(param.key, param.value);
          });
        requestUrl = url.toString();
      }

      // Realizar la petición
      const response = await fetch(requestUrl, fetchOptions);
      
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
      throw new Error(error instanceof Error ? error.message : 'Request failed');
    }
  }, []);

  return { executeRequest };
};
