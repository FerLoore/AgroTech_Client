// ============================================================
// agroHistorial.api.ts
// Capa de acceso a datos — AGRO_HISTORIAL
//
// IMPORTANTE:
// Esta tabla es SOLO LECTURA (auditoría).
// No existen create/update/delete.
// ============================================================

import api from "./Axios";

// ------------------------------------------------------------
// getHistorial — obtiene todo el historial
// GET /agro-historial
// Retorna: Historial[]
// ------------------------------------------------------------
export const getHistorial = async (page = 1, limit = 1000) => {
    const res = await api.get(`/agro-historial?page=${page}&limit=${limit}`);
    return res.data;
};

// ------------------------------------------------------------
// getHistorialById — obtiene un registro por ID
// GET /agro-historial/:id
// Retorna: Historial
// ------------------------------------------------------------
export const getHistorialById = async (id: number) => {
    const res = await api.get(`/agro-historial/${id}`);
    return res.data.historial;
};

// ------------------------------------------------------------
// getHistorialByArbol — historial de un árbol específico
// GET /agro-historial/arbol/:id
// Retorna: Historial[]

export const getHistorialByArbol = async (arbId: number) => {
    const res = await api.get(`/agro-historial/arbol/${arbId}`);
    return res.data.historiales;
};