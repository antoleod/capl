// server.js
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for unique filenames
import fs from 'fs';
import { fileURLToPath } from 'url';
import { renderVideo, jobStatus } from './renderer.js';
import { UPLOAD_DIR, OUTPUT_DIR } from './constants.js';
import cron from 'node-cron';

const app = express();
const port = Number(process.env.PORT) || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Función de utilidad para limpiar archivos antiguos
const cleanupOldFiles = (directory, maxAgeHours = 24) => {
  const threshold = Date.now() - (maxAgeHours * 60 * 60 * 1000);

  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error(`[Cleanup] Error leyendo ${directory}:`, err);
      return;
    }

    files.forEach(file => {
      if (file === '.gitkeep') return;
      const filePath = path.join(directory, file);

      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (stats.mtimeMs < threshold) {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`[Cleanup] Error eliminando ${file}:`, err);
            else console.log(`[Cleanup] Archivo antiguo eliminado: ${file}`);
          });
        }
      });
    });
  });
};

// Programar limpieza automática cada hora
cron.schedule('0 * * * *', () => {
  console.log('[Cleanup] Iniciando mantenimiento de archivos...');
  cleanupOldFiles(uploadsDir);
  cleanupOldFiles(OUTPUT_DIR);

  // Limpiar también los trabajos antiguos del Map para liberar memoria
  const threshold = Date.now() - (24 * 60 * 60 * 1000);
  for (const [id, job] of jobs.entries()) {
    if (job.createdAt < threshold) jobs.delete(id);
  }
});

// Almacenamiento temporal de trabajos de renderizado
const jobs = new Map();

// CORS middleware to allow requests from your frontend
app.use(cors({
  origin: true, // Allow requests from any origin during development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Debugging middleware to log all requests
app.use((req, res, next) => {
  console.log(`[Backend] ${req.method} ${req.url}`);
  next();
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir); // Files will be saved in the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using uuid and keep the original extension
    const uniqueSuffix = uuidv4();
    const fileExtension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExtension}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // Límite de 500MB para archivos grandes
}).fields([
  { name: 'files', maxCount: 50 },
  { name: 'audio', maxCount: 1 }
]);

// Route to handle file uploads
app.post('/upload/photos', upload, (req, res) => {
  const files = req.files?.['files'] || [];
  const audio = req.files?.['audio'] || [];

  if (files.length === 0 && audio.length === 0) {
    return res.status(400).json({ message: 'No files uploaded.' });
  }

  const uploadedFiles = [...files, ...audio].map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: `/uploads/${file.filename}` // URL path to access the file
  }));

  console.log('Files uploaded successfully:', uploadedFiles);
  res.status(200).json({ message: 'Files uploaded successfully', files: uploadedFiles });
});

app.use('/outputs', express.static(OUTPUT_DIR));

// Ruta para iniciar el renderizado
app.post('/render', async (req, res) => {
  const jobId = uuidv4();
  const config = req.body;
  console.log('[Backend] /render payload:', config);

  try {
    // Reconstruir rutas absolutas para el renderizador
    const imagePaths = (config.imagePaths || []).map(p => 
      path.join(__dirname, p.replace(/^\//, ''))
    );
    const audioPath = config.audioPath ? path.join(__dirname, config.audioPath.replace(/^\//, '')) : null;

    const jobConfig = {
      ...config,
      id: jobId,
      imagePaths,
      audioPath,
    };

    // Crear un estado inicial para el trabajo
    const jobState = {
      id: jobId,
      status: 'processing',
      progress: 0,
      config: config,
      createdAt: Date.now()
    };
    jobs.set(jobId, jobState);

    console.log(`[Backend] Starting render for job ${jobId}`);

    // Iniciar el renderizado en segundo plano
    renderVideo(jobConfig)
      .then((outputPath) => {
        const job = jobs.get(jobId);
        if (job) {
          job.status = 'done';
          job.progress = 100;
          job.url = `/outputs/${path.basename(outputPath)}`;
          jobs.set(jobId, job);
          console.log(`[Backend] Render finished for job ${jobId}`);
        }
      })
      .catch((error) => {
        console.error(`[Backend] Render error for job ${jobId}:`, error);
        const job = jobs.get(jobId);
        if (job) {
          job.status = 'error';
          job.error = error.message || 'Render failed';
          jobs.set(jobId, job);
        }
      });

    // Actualizar el progreso desde el jobStatus del renderer
    const progressInterval = setInterval(() => {
      const job = jobs.get(jobId);
      if (!job || job.status !== 'processing') {
        clearInterval(progressInterval);
        return;
      }
      
      const status = jobStatus.get(jobId);
      if (status && typeof status.progress === 'number') {
        job.progress = status.progress;
        jobs.set(jobId, job);
      }
    }, 1000);

    res.status(202).json({ jobId });
  } catch (error) {
    console.error('[Backend] Error in /render route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta para consultar el estado
app.get('/status/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ status: 'error', error: 'Job not found' });
  res.json(job);
});

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(uploadsDir));

// Start the server
app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
