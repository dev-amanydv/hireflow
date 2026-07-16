import multer from 'multer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const uploadDir = path.join(os.tmpdir(), 'quick-hire-uploads');
fs.mkdirSync(uploadDir, { recursive: true });

export const uploadMiddleware = multer({dest: uploadDir, limits: {
    fileSize: 5242880
}}).single('resume')
