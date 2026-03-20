import axios from './Axios';

export const getAgroFincas = () => axios.get('/agro-finca');
export const getAgroFincaById = (id: number) => axios.get(`/agro-finca/${id}`);
export const createAgroFinca = (data: any) => axios.post('/agro-finca', data);
export const updateAgroFinca = (id: number, data: any) => axios.put(`/agro-finca/${id}`, data);
export const deleteAgroFinca = (id: number) => axios.delete(`/agro-finca/${id}`);