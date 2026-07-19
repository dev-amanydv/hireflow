
const isProd = import.meta.env.VITE_NODE_ENV === 'production' ? true : false
export const BACKEND_URL = isProd ? import.meta.env.VITE_BACKEND_API_URL : 'http://localhost:8000/api/v1'