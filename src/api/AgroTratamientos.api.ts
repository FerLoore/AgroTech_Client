import axios from "./Axios";

export const getTratamientos = async () => {
    const { data } = await axios.get("/agro-tratamientos");
    return data?.tratamientos || data || [];
};

export const createTratamiento = async (payload: any) => {
    const { data } = await axios.post("/agro-tratamientos", payload);
    return data;
};

export const finalizarTratamiento = async (id: number) => {
    const { data } = await axios.put(`/agro-tratamientos/${id}/finalizar`);
    return data;
};