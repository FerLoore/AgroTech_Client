import api from "./Axios";

// GET
export const getAnalisisLaboratorio = async () => {
  const res = await api.get("/agro-analisis-laboratorio");
  return res.data;
};

// POST
export const createAnalisisLaboratorio = async (data: {
  analab_analisis_laboratorio: number;
  analab_laboratorio_nombre: string;
  analab_fecha_envio: string;
  analab_fecha_resultado?: string | null;
  analab_resultado_tipo?: string | null;
  alert_alerta_salud: number;
  catpato_catalogo_patogeno?: number | null;
  usu_usuario?: number | null;
}) => {
  const res = await api.post("/agro-analisis-laboratorio", data);
  return res.data;
};

// PUT
export const updateAnalisisLaboratorio = async (
  id: number,
  data: {
    analab_analisis_laboratorio?: number;
    analab_laboratorio_nombre?: string;
    analab_fecha_envio?: string;
    analab_fecha_resultado?: string | null;
    analab_resultado_tipo?: string | null;
    alert_alerta_salud?: number;
    catpato_catalogo_patogeno?: number | null;
    usu_usuario?: number | null;
  }
) => {
  const res = await api.put(`/agro-analisis-laboratorio/${id}`, data);
  return res.data;
};

// DELETE
export const deleteAnalisisLaboratorio = async (id: number) => {
  const res = await api.delete(`/agro-analisis-laboratorio/${id}`);
  return res.data;
};