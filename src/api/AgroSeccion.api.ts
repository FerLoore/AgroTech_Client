import axios from './Axios';

export const getAgroSecciones = async () => {
    const response = await axios.get('/agro-seccion');
    return response.data;
};

export const getAgroSeccionById = async (id: number) => {
    const response = await axios.get(`/agro-seccion/${id}`);
    return response.data;
};

export const createAgroSeccion = async (data: any) => {
    const response = await axios.post('/agro-seccion', data);
    return response.data;
};

export const updateAgroSeccion = async (id: number, data: any) => {
    const response = await axios.put(`/agro-seccion/${id}`, data);
    return response.data;
};

export const deleteAgroSeccion = async (id: number) => {
    const response = await axios.delete(`/agro-seccion/${id}`);
    return response.data;
};