import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3000",  // IP y puerto de tu backend
    headers: {
        "Content-Type": "application/json"
    }
}); 

export default api;