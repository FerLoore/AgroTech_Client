import api from "./Axios";

// GET todos
export const getArboles = async () => {
    const res = await api.get("/agro-arboles");
    return res.data.arboles;
};

// GET por ID
export const getArbolById = async (id: number) => {
    const res = await api.get(`/agro-arboles/${id}`);
    return res.data.arbol;
};

// POST
export const createArbol = async (data: {
    arb_posicion_surco: number;
    arb_fecha_siembra: string;
    tipar_tipo_arbol: number;
    arb_estado?: string;
    sur_surcos: number;
}) => {
    const res = await api.post("/agro-arboles", data);
    return res.data.arbol;
};

// PUT
export const updateArbol = async (id: number, data: {
    arb_posicion_surco?: number;
    arb_fecha_siembra?: string;
    tipar_tipo_arbol?: number;
    arb_estado?: string;
    sur_surcos?: number;
}) => {
    const res = await api.put(`/agro-arboles/${id}`, data);
    return res.data;  // ← también estaba retornando res.data.arbol que puede ser undefined en PUT
};

// DELETE (lógico)
export const deleteArbol = async (id: number) => {
    const res = await api.delete(`/agro-arboles/${id}`);
    return res.data;
};