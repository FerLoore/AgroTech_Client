import axios from "./Axios";

export const getFumigaciones = async () => {
    const { data } = await axios.get("/agro-fumigacion");
    return data?.fumigaciones || data || [];
};

export const createFumigacion = async (payload: any) => {
    const { data } = await axios.post("/agro-fumigacion", payload);
    return data;
};

export const marcarRealizada = async (id: number) => {
    const { data } = await axios.put(`/agro-fumigacion/${id}/realizada`);
    return data;
};