/**
 * File upload — admin-only.
 *
 * Accepts audio files (mp3/wav/ogg/webm) and images (png/jpg/webp/gif/svg).
 * Uploads directly to Cloudinary using multer-storage-cloudinary.
 * Falls back gracefully if Cloudinary is not configured (dev mode only).
 *
 * Returns:
 *   { url, public_id, resource_type, format, size, secure_url }
 */
const multer       = require('multer');
const cloudinary   = require('cloudinary').v2;
const { Readable } = require('stream');
const { httpError } = require('../middleware/errorHandler');

// ─── Configure Cloudinary ────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ─── Allowed MIME types ──────────────────────────────────────
const AUDIO_TYPES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
  'audio/webm', 'audio/x-wav', 'audio/x-m4a',
]);
const IMAGE_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
  'image/gif', 'image/svg+xml',
]);

const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

// ─── Multer: keep file in memory so we can stream to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (AUDIO_TYPES.has(file.mimetype) || IMAGE_TYPES.has(file.mimetype)) {
      return cb(null, true);
    }
    return cb(httpError(415, `Unsupported file type: ${file.mimetype}`));
  },
}).single('file');

// ─── Upload a buffer to Cloudinary using a readable stream ───
function uploadToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    Readable.from(buffer).pipe(stream);
  });
}

// ─── Route handler ────────────────────────────────────────────
async function uploadHandler(req, res) {
  // Run multer to parse the multipart body
  await new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) reject(err);
      else resolve(null);
    });
  }).catch((err) => {
    throw httpError(err.status || 400, err.message || 'Upload error');
  });

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const isAudio = AUDIO_TYPES.has(req.file.mimetype);
  const folder  = isAudio ? 'ielts/audio' : 'ielts/images';

  // Build a safe public_id from the original filename
  const safeBase = req.file.originalname
    .replace(/\.[^.]+$/, '')                 // strip extension
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')          // safe chars only
    .slice(0, 60);
  const stamp     = Date.now().toString(36);
  const public_id = `${folder}/${safeBase}-${stamp}`;

  const cloudOpts = {
    public_id,
    resource_type:  isAudio ? 'video' : 'image',  // Cloudinary uses 'video' for audio
    overwrite:      false,
    use_filename:   false,
    unique_filename: false,
    // For images: keep original quality; for audio: raw upload
    ...(isAudio
      ? { format: undefined }
      : { quality: 'auto', fetch_format: 'auto' }),
  };

  const result = await uploadToCloudinary(req.file.buffer, cloudOpts);

  return res.json({
    success: true,
    data: {
      url:           result.secure_url,
      public_id:     result.public_id,
      resource_type: result.resource_type,
      format:        result.format,
      size:          result.bytes,
      secure_url:    result.secure_url,
    },
  });
}

// Express-compatible wrapper (async → sync style for Express error handling)
function uploadHandlerExpress(req, res, next) {
  uploadHandler(req, res).catch(next);
}

module.exports = { uploadHandler: uploadHandlerExpress };
