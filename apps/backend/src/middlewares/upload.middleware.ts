import multer from 'multer';

export const uploadMiddleware = multer({dest: 'uploads/', limits: {
    fileSize: 1000000
}}).single('resume')