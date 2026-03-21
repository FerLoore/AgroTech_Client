import axios from './Axios'; 

export const getAgroUsuarios = () => axios.get('/agro-usuario');
export const getAgroUsuarioById = (id: number) => axios.get(`/agro-usuario/${id}`);
export const createAgroUsuario = (data: any) => axios.post('/agro-usuario', data);
export const updateAgroUsuario = (id: number, data: any) => axios.put(`/agro-usuario/${id}`, data);
export const deleteAgroUsuario = (id: number) => axios.delete(`/agro-usuario/${id}`);