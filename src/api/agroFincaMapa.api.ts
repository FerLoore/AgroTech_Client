// ============================================================
// agroFincaMapa.api.ts
// Llama al endpoint unificado del mapa
// ============================================================

import api from "./Axios";
import type { MapaFincaResponse } from "../pages/AgroMapa/agroMapa.types";

// GET /agro-finca-mapa/:fincaId
// Retorna: { ok, finca, perimetro, arboles }
export const getMapaFinca = async (fincaId: number): Promise<MapaFincaResponse> => {
    // Forzamos Number() para quitar cualquier ":1" o string residual
    const idLimpio = Number(fincaId);
    const res = await api.get(`/agro-finca-mapa/${idLimpio}`);
    return res.data;
};
// GET /agro-finca — para el selector de fincas
export const getFincas = async () => {
    const res = await api.get("/agro-finca");
    return res.data.fincas;
};

// POST /agro-finca-perimetro/:fincaId
// Body: { puntos: [{ lat, lng }] }
export const guardarPerimetro = async (fincaId: number, puntos: { lat: number; lng: number }[]) => {
    const res = await api.post(`/agro-finca-perimetro/${fincaId}`, { puntos });
    return res.data;
};