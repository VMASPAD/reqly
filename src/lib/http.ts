import { useCallback } from 'preact/hooks';
import { RequestConfig, ResponseData, Environment } from './types';
import { invoke } from '@tauri-apps/api/core';
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
    try {
      // Apply variable substitution y normalizar URL
      let processedUrl = substituteVariables(requestConfig.url, environment);
      
      // Parsear localhost:puerto a formato HTTP (Rust lo manejará también)
      if (processedUrl.match(/^localhost:\d+/) || processedUrl.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+/)) {
        processedUrl = `http://${processedUrl}`;
      }
      
      const processedHeaders = substituteInHeaders(requestConfig.headers, environment);
      const processedParams = substituteInParams(requestConfig.params, environment);
      
      // Preparar el body
      let processedBody = { ...requestConfig.body };
      
      if (requestConfig.body.type === 'json' || requestConfig.body.type === 'text') {
        if (requestConfig.body.content) {
          processedBody.content = substituteInBody(requestConfig.body.content, environment);
        }
      } else if (requestConfig.body.type === 'form-data' && requestConfig.body.formData) {
        processedBody.formData = requestConfig.body.formData.map(field => ({
          ...field,
          value: substituteVariables(field.value, environment)
        }));
      }
      
      // Preparar la configuración de la petición
      const rustRequest: RequestConfig = {
        ...requestConfig,
        url: processedUrl,
        headers: processedHeaders,
        params: processedParams,
        body: processedBody
      };
      
      // Llamar al comando de Rust
      const response = await invoke<ResponseData>('execute_http_request', {
        request: rustRequest
      });
      
      return response;
    } catch (error) {
      // Manejar errores
      if (error instanceof Error) {
        throw new Error(error.message);
      } else if (typeof error === 'string') {
        throw new Error(error);
      } else {
        throw new Error('Unknown error occurred during request');
      }
    }
  }, []);

  return { executeRequest };
};
