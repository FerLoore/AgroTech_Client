import axios from './Axios';

export const getAgroClimas = () => axios.get('/agro-clima');
export const getAgroClimaById = (id: number) => axios.get(`/agro-clima/${id}`);
export const createAgroClima = (data: any) => axios.post('/agro-clima', data);
export const updateAgroClima = (id: number, data: any) => axios.put(`/agro-clima/${id}`, data);
export const deleteAgroClima = (id: number) => axios.delete(`/agro-clima/${id}`);