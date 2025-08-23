// Configuración de la aplicación
export const config = {
  // URL del proxy desde variable de entorno o valor por defecto
  PROXY_URL: import.meta.env.VITE_PROXY || 'http://127.0.0.1:8765/proxy',
  
  // API Key para el proxy (oculta para el usuario)
  PROXY_API_KEY: import.meta.env.VITE_PROXY_API_KEY || '',
  
  // Configuración por defecto del proxy
  DEFAULT_PROXY_CONFIG: {
    enabled: true,
    userProvided: false,
    url: import.meta.env.VITE_PROXY || 'http://127.0.0.1:8765/proxy'
  }
};
