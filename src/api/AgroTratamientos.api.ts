import api from "./Axios";

// GET
export const getTratamientos = async () => {
    const res = await api.get("/agro-tratamientos");
    return res.data;
};

// POST
export const createTratamiento = async (data: {
    trata_fecha_inicio: string;
    trata_fecha_fin?: string;
    trata_estado: string;
    trata_dosis?: string;
    trata_observaciones?: string;
    alertsalu_alerta_salud: number;
    produ_producto: number;
}) => {
    const res = await api.post("/agro-tratamientos", data);
    return res.data;
};

// PUT
export const updateTratamiento = async (
    id: number,
    data: {
        trata_fecha_inicio?: string;
        trata_fecha_fin?: string;
        trata_estado?: string;
        trata_dosis?: string;
        trata_observaciones?: string;
        alertsalu_alerta_salud?: number;
        produ_producto?: number;
    }
) => {
    const res = await api.put(`/agro-tratamientos/${id}`, data);
    return res.data;
};

// DELETE
export const deleteTratamiento = async (id: number) => {
    const res = await api.delete(`/agro-tratamientos/${id}`);
    return res.data;
};