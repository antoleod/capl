niciar el Servidor (Backend)
El servidor es el encargado de procesar los archivos y ejecutar FFmpeg para generar los videos.

Abre una terminal y dirígete a la carpeta del servidor:
bash
cd server
Instala las dependencias (si no lo has hecho):
bash
npm install
Inicia el servidor:
bash
node server.js
Verás un mensaje confirmando: Backend server listening on http://localhost:3001.
2. Iniciar la Aplicación (Frontend)
Vite se encarga de servir la interfaz de usuario y redirigir las peticiones de red al servidor de Node.js.

Abre una nueva terminal en la raíz del proyecto (c:\Users\X1\Documents\capl):
Instala las dependencias:
bash
npm install
Inicia el entorno de desarrollo:
bash
npm run dev
Abre el navegador en la dirección que te indique