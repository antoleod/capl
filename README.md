# Caply — AI Video Generator

Caply convierte fotos en videos MP4 con transiciones, audio y estilos personalizables, usando IA para generar scripts y narración.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- npm v9 o superior
- FFmpeg (incluido automáticamente vía `ffmpeg-static`)

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd capl

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias del backend
cd server
npm install
cd ..
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_OPENAI_API_KEY=sk-...    # Tu API key de OpenAI
```

> El backend puede requerir variables adicionales según la configuración del servidor.

---

## Iniciar el proyecto

### Desarrollo (frontend + backend simultáneo)

```bash
npm run dev
```

Esto lanza:
- **Frontend** en `http://localhost:5173` (Vite + React)
- **Backend** en `http://localhost:3000` (Express)

### Solo frontend

```bash
npm run dev:frontend
```

### Solo backend

```bash
npm run dev:backend
```

---

## Build para producción

```bash
npm run build
```

La carpeta `dist/` contiene el frontend compilado.

---

## Estructura del proyecto

```
capl/
├── src/               # Frontend React + TypeScript
│   └── App.tsx        # Componente principal
├── server/            # Backend Express
│   └── server.js      # API y pipeline de video
├── public/            # Recursos estáticos
├── package.json       # Scripts y dependencias del frontend
└── vite.config.ts     # Configuración de Vite
```

---

## Flujo de generación de video

1. El usuario sube fotos y audio opcional
2. El frontend envía todo al backend vía `POST /render`
3. El backend procesa el video con FFmpeg y devuelve un `jobId`
4. El frontend hace polling a `GET /status/:jobId` hasta que el video está listo
5. El usuario descarga el MP4 resultante

Para más detalles, ver [VIDEO_GENERATION_FLOW.md](./VIDEO_GENERATION_FLOW.md).

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia frontend y backend en paralelo |
| `npm run dev:frontend` | Solo el servidor de desarrollo Vite |
| `npm run dev:backend` | Solo el servidor Express |
| `npm run build` | Compila el frontend para producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run preview` | Previsualiza el build de producción |
