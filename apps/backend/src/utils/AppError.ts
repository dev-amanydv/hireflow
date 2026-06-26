
export class AppError extends Error {
    public statusCode;
    constructor(statusCode: number, message: string){
        super(message);
        this.statusCode = statusCode;
        
        Error.captureStackTrace(this, this.constructor)
    }
}