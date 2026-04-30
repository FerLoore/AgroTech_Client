import axios from 'axios';

const API_URL = 'http://localhost:9090/agro-mantenimiento';

export const getMantenimientos = async () => {
    return await axios.get(API_URL);
};

export const createMantenimiento = async (data: any) => {
    return await axios.post(API_URL, data);
};

export const updateMantenimiento = async (id: number, data: any) => {
    return await axios.put(`${API_URL}/${id}`, data);
};

export const deleteMantenimiento = async (id: number) => {
    return await axios.delete(`${API_URL}/${id}`);
};
