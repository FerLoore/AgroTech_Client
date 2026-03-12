import api from "./Axios";

// GET /api/agro-roles
export const getRoles = async () => {
    const res = await api.get("/agro-roles");
    return res.data.roles;
};

// GET /api/agro-roles/:id
export const getRolById = async (id: number) => {
    const res = await api.get(`/agro-roles/${id}`);
    return res.data.rol;
};

// POST /api/agro-roles
export const createRol = async (data: {
    rol_nombre: string;
    rol_descripcion?: string;
    rol_permiso: number;
}) => {
    const res = await api.post("/agro-roles", data);
    return res.data.rol;
};

// PUT /api/agro-roles/:id
export const updateRol = async (id: number, data: {
    rol_nombre?: string;
    rol_descripcion?: string;
    rol_permiso?: number;
}) => {
    const res = await api.put(`/agro-roles/${id}`, data);
    return res.data.rol;
};

// DELETE /api/agro-roles/:id
export const deleteRol = async (id: number) => {
    const res = await api.delete(`/agro-roles/${id}`);
    return res.data;
};