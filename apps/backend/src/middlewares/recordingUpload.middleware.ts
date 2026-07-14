import multer from 'multer';

// The agent worker streams the finalized OGG/Opus session recording here. We keep
// it in memory (not on disk like the resume upload) so it can be handed straight to
// R2. Opus interview audio is small; 50MB is a generous ceiling.
export const recordingUploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 52428800 },
}).single('file');
