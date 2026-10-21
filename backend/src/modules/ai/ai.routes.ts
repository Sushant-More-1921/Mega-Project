import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middleware/auth.middleware';
import { AIController } from './ai.controller';

const router = Router();
const controller = new AIController();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!file.originalname.match(/\.(flac|m4a|mp3|mp4|mpeg|ogg|wav|webm)$/i)) {
      const error = Object.assign(new Error('Unsupported audio file format.'), {
        statusCode: 400,
      });
      callback(error);
      return;
    }
    callback(null, true);
  },
});

router.post('/chatbot/complaint', controller.complaintChat);
router.post('/image/analyze', authMiddleware, controller.analyzeImage);
router.post(
  '/voice/transcribe',
  authMiddleware,
  upload.single('audio'),
  controller.transcribeAudio
);

export default router;
