import axios from "axios";

const api = axios.create({
    baseURL: "http://192.168.1.67:9090",  // IP y puerto de tu backend
    headers: {
        "Content-Type": "application/json"
    }
});

export default api;