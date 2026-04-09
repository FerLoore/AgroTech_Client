import axios from "axios";

// Acceder a la variable de entorno de Vite
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:9090";

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json"
    }
});

// Interceptor opcional: útil para depuración en consola
api.interceptors.request.use((config) => {
    console.log(`🚀 Petición a: ${config.baseURL}${config.url}`);
    return config;
});

export default api;