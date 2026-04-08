import api from "./Axios";

export const getSurcos = async (page = 1, limit = 1000) => {
    const res = await api.get(`/agro-surcos?page=${page}&limit=${limit}`);
    return res.data;
};

export const getSurcoById = async (id: number) => {
    const res = await api.get(`/agro-surcos/${id}`);
    return res.data.surco;
};

export const createSurco = async (data: {
    sur_numero_surco: number;
    sur_orientacion?: string;
    sur_espaciamiento: number;
    secc_secciones: number;
}) => {
    const res = await api.post("/agro-surcos", data);
    return res.data.surco;
};

export const updateSurco = async (id: number, data: {
    sur_numero_surco?: number;
    sur_orientacion?: string;
    sur_espaciamiento?: number;
}) => {
    const res = await api.put(`/agro-surcos/${id}`, data);
    return res.data.surco;
};

export const deleteSurco = async (id: number) => {
    const res = await api.delete(`/agro-surcos/${id}`);
    return res.data;
};