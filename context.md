# Objetive
Quiero crear una aplicacion tanto para mobile como para escritorio llamada Reqly en la cual quiero que sea una imitacion de PostMan o HTTpie basicamente que tenga las mismas funcionalidades, quiero que tenga un diseño atractivo y fácil de usar ademas de simple. Luego quiero que haya una opcion activable que se refiera la opcion de utilizar un proxy tanto que proporcione yo (oculto para el usuario) o uno que proponga el usuario. Quiero que tenga un sistema de historial, un sistema de pestañas para tener varias sesiones abiertas, luego otro componente que sera para configurar el tipo de peticion, contenido, headers, body (body tendra formateadores, de text, json, o adjuntar un archivo y modificar su formato de envio), params, Auth (Normal, Basic Auth, Bearer Token API key), luego en la seccion de respuesta de la peticion (que obviamente va a tener un sistema de espera indefinido hasta que cargue la peticion final) va a ver dos secciones una que sea Request y otra la response y por utlimo un boton para ver la preview de la peticion enviada

# Rules
Es necesario utilizar el archivo `App.css` para los estilos, Puedes crear, eliminar o editar los archivos existentes excepto `App.css`, utilizar `motion/react` para las animaciones y transiciones

# Status
✅ **COMPLETADO**: Aplicación funcional con todas las características solicitadas

## Características Implementadas:
- ✅ Sistema de pestañas con soporte para múltiples sesiones
- ✅ Gestión completa de peticiones HTTP (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- ✅ Configuración de headers, parámetros y body (text, JSON, file)
- ✅ Sistema de autenticación (None, Basic Auth, Bearer Token, API Key)
- ✅ Configuración de proxy (habilitado/deshabilitado, personalizado)
- ✅ Historial de peticiones con persistencia local
- ✅ Visualización de respuestas con formato JSON y raw
- ✅ Animaciones suaves con motion/react
- ✅ Atajos de teclado (Ctrl+T: nueva pestaña, Ctrl+W: cerrar, Ctrl+Enter: enviar)
- ✅ Persistencia de estado en localStorage
- ✅ Sistema de notificaciones toast
- ✅ Interfaz responsiva y atractiva
- ✅ Preview de peticiones en la sección de respuesta

## Estructura Final:
- `src/App.css`: Variables de estilo (mantenido intacto)
- `src/lib/`: Funciones y utilidades compartidas
  - `types.ts`: Tipos TypeScript para toda la aplicación
  - `hooks.ts`: Hook principal para gestión de estado con persistencia
  - `http.ts`: Manejo de peticiones HTTP
  - `storage.ts`: Utilidades de persistencia localStorage
  - `keyboard.ts`: Atajos de teclado
  - `toast.tsx`: Sistema de notificaciones
- `src/components/`: Componentes principales
  - `Fetch.tsx`: Barra superior con pestañas y envío de peticiones
  - `Historial.tsx`: Panel lateral con historial de peticiones
  - `Params.tsx`: Configuración de parámetros, headers, body y auth
  - `Response.tsx`: Visualización de respuestas y preview de peticiones
  - `Ai.tsx`: Configuración de proxy
- `src/components/ui/`: Componentes UI reutilizables (todos los necesarios creados)

# Context
- `src/App.css`: Variables de estilo estrictamente necesitadas
- `src/lib/`: Funciones y utilidades compartidas.
- `src/components/`: Secciones de usuario.
    - `Historial.tsx`: Componente para mostrar el historial de peticiones.
    - `Params.tsx`: Componente para mostrar y editar los parámetros de la petición.
    - `Response.tsx`: Componente para mostrar la respuesta de la petición.
    - `Fetch.tsx`: Componente para realizar la petición HTTP o HTTPS.
    - `Ai.tsx`: Componente para configuración de proxy.
- `src/components/ui`: Componente de interfaz de usuario.
    - `alert.tsx` : Componente para mostrar alertas y notificaciones.
    - `button.tsx` : Componente de boton reutilizable.
    - `card.tsx` : Componente de tarjeta para mostrar contenido.
    - `checkbox.tsx` : Componente de casilla de verificación.
    - `input.tsx` : Componente de entrada de texto.
    - `resizable.tsx` : Componente de panel redimensionable.
    - `scroll-area.tsx` : Componente de área de desplazamiento.
    - `select.tsx` : Componente de selección (En combinación con un modal).
    - `switch.tsx` : Componente de interruptor.
    - `table.tsx` : Componente de tabla normal.
    - `tabs.tsx` : Componente de pestañas.
    - `tooltip.tsx` : Componente de información sobre herramientas.
    - `badge.tsx` : Componente de etiquetas/badges para status codes.

