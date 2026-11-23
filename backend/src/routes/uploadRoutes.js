import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from '../middleware/auth.js';
import { config } from '../config/env.js';

const router = express.Router();

// Configure Cloudinary if credentials are provided
const isCloudinaryConfigured = Boolean(
  config.CLOUDINARY_CLOUD_NAME &&
  config.CLOUDINARY_API_KEY &&
  config.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('[Upload] Cloudinary storage configured successfully');
} else {
  console.log('[Upload] Cloudinary credentials not detected; using local storage fallback');
}

// Multer storage: use memory storage when Cloudinary is active, disk storage otherwise
const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = isCloudinaryConfigured
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, uniqueName);
      }
    });

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are permitted (JPEG, PNG, WebP, etc.)'), false);
    }
  }
});

// Upload endpoint
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (isCloudinaryConfigured) {
      // Upload buffer directly to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'expensely',
            resource_type: 'image',
            transformation: [{ quality: 'auto', fetch_format: 'auto' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      return res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes
      });
    }

    // Local file fallback
    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json({
      success: true,
      url: fileUrl,
      publicId: req.file.filename,
      filename: req.file.filename
    });
  } catch (err) {
    console.error('[Upload] Upload error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Image upload failed' });
  }
});

// Delete replaced image endpoint
router.delete('/:publicId', requireAuth, async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID is required' });
    }

    if (isCloudinaryConfigured && !publicId.includes('.')) {
      await cloudinary.uploader.destroy(publicId);
    } else {
      const filePath = path.join(uploadDir, path.basename(publicId));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return res.json({ success: true, message: 'Image deleted successfully' });
  } catch (err) {
    console.error('[Upload] Delete error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete image' });
  }
});

export default router;
