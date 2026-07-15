import multer from 'multer';
import { AppError } from '../utils/AppError';

// Profile photos are small and go straight to R2, so we keep them in memory like
// recordingUpload.middleware.ts rather than writing to disk like the resume upload.
export const avatarUploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new AppError(400, 'AvatarMustBeImage'));
        }
        cb(null, true);
    },
}).single('file');
