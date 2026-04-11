import api from "./Axios";

export const getAuditorias = async (filtros?: {
    tabla?:   string;
    accion?:  string;
    usuario?: string;
    desde?:   string;
    hasta?:   string;
}) => {
    const params = new URLSearchParams();
    if (filtros?.tabla)   params.append("tabla",   filtros.tabla);
    if (filtros?.accion)  params.append("accion",  filtros.accion);
    if (filtros?.usuario) params.append("usuario", filtros.usuario);
    if (filtros?.desde)   params.append("desde",   filtros.desde);
    if (filtros?.hasta)   params.append("hasta",   filtros.hasta);

    const res = await api.get(`/agro-auditoria?${params.toString()}`);
    return res.data.auditorias;
};