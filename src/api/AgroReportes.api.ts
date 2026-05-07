import api from "./Axios";

export const getReportes = async (fincaId?: number) => {
    const url = fincaId ? `/agro-reportes?fincaId=${fincaId}` : "/agro-reportes";
    const res = await api.get(url);
    return res.data;
};

export const createReporte = async (data: {
    fin_finca: number;
    usu_usuario: number | null;
    repo_tipo: string;
    repo_secciones: string;
    chart_image?: string;
    report_data?: any;
}) => {
    const res = await api.post("/agro-reportes", data);
    return res.data;
};

export const deleteReporte = async (id: number) => {
    const res = await api.delete(`/agro-reportes/${id}`);
    return res.data;
};

export const downloadReportePdf = async (id: number) => {
    const res = await api.get(`/agro-reportes/${id}/pdf`, { responseType: "blob" });
    return res.data;
};
