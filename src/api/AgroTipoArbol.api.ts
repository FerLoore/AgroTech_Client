// ============================================================
// agroTipoArbol.api.ts
// ============================================================

import api from "./Axios";

// GET /agro-tipo-arbol
export const getTipoArboles = async () => {
    const res = await api.get("/agro-tipo-arbol");
    return res.data.tipoArboles;
};

// GET /agro-tipo-arbol/:id
export const getTipoArbolById = async (id: number) => {
    const res = await api.get(`/agro-tipo-arbol/${id}`);
    return res.data.tipoArbol;
};

// POST /agro-tipo-arbol
export const createTipoArbol = async (data: {
    tipar_nombre_comun:       string;
    tipar_nombre_cientifico?: string;
    tipar_anios_produccion?:  number;
    tipar_descripcion?:       string;
}) => {
    const res = await api.post("/agro-tipo-arbol", data);
    return res.data.tipoArbol;
};

// PUT /agro-tipo-arbol/:id
export const updateTipoArbol = async (id: number, data: {
    tipar_nombre_comun?:      string;
    tipar_nombre_cientifico?: string;
    tipar_anios_produccion?:  number;
    tipar_descripcion?:       string;
}) => {
    const res = await api.put(`/agro-tipo-arbol/${id}`, data);
    return res.data.tipoArbol;
};

// DELETE /agro-tipo-arbol/:id  — eliminación FÍSICA
export const deleteTipoArbol = async (id: number) => {
    const res = await api.delete(`/agro-tipo-arbol/${id}`);
    return res.data;
};