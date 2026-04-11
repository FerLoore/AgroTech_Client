import api from "./Axios";

// GET
export const getAlertas = async () => {
    const res = await api.get("/agro-alerta-salud");
    return res.data;
};

// GET por árbol
export const getAlertasByArbol = async (id: number) => {
    const res = await api.get(`/agro-alerta-salud/arbol/${id}`);
    return res.data;
};

// POST
export const createAlerta = async (data: {
    fecha_deteccion: string;
    descripcion_sintoma?: string;
    foto?: string;
    arb_arbol: number;
    usu_usuario: number;
}) => {
    const res = await api.post("/agro-alerta-salud", data);
    return res.data;
};

// PUT
export const updateAlerta = async (
    id: number,
    data: {
        fecha_deteccion?: string;
        descripcion_sintoma?: string;
        foto?: string;
        arb_arbol?: number;
        usu_usuario?: number;
    }
) => {
    const res = await api.put(`/agro-alerta-salud/${id}`, data);
    return res.data;
};

// DELETE
export const deleteAlerta = async (id: number) => {
    const res = await api.delete(`/agro-alerta-salud/${id}`);
    return res.data;
};