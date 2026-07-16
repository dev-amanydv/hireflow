import multer from 'multer';
import { AppError } from '../utils/AppError';

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
