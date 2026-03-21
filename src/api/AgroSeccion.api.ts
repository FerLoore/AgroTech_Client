import axios from './Axios';

export const getAgroSecciones = () => axios.get('/agro-seccion');
export const getAgroSeccionById = (id: number) => axios.get(`/agro-seccion/${id}`);
export const createAgroSeccion = (data: any) => axios.post('/agro-seccion', data);
export const updateAgroSeccion = (id: number, data: any) => axios.put(`/agro-seccion/${id}`, data);
export const deleteAgroSeccion = (id: number) => axios.delete(`/agro-seccion/${id}`);