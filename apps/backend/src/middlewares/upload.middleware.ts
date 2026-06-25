import multer from 'multer';

export const uploadMiddleware = multer({dest: './uploads/', limits: {
    fileSize: 5242880
}}).single('resume')