import multer from 'multer';

export const recordingUploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 52428800 },
}).single('file');
