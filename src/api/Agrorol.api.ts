// ============================================================
// agroRol.api.ts
// Capa de acceso a datos — todas las llamadas HTTP a la API
// para la tabla AGRO_ROL. Usa la instancia axios configurada.
//
// Cada función:
//   1. Llama a la API con el método HTTP correcto
//   2. Extrae solo el dato relevante de res.data
//   3. Devuelve el dato tipado
//
// Los errores NO se manejan aquí — se propagan al hook
// que los captura en try/catch y muestra toasts.
// ============================================================

import api from "./Axios";

// ------------------------------------------------------------
// getRoles — obtiene todos los roles activos
// GET /agro-roles
// Retorna: Rol[]
// ------------------------------------------------------------
export const getRoles = async () => {
    const res = await api.get("/agro-roles");
    return res.data.roles; // el backend devuelve { ok, roles: [...] }
};

// ------------------------------------------------------------
// getRolById — obtiene un rol por su ID
// GET /agro-roles/:id
// Retorna: Rol
// (no se usa actualmente pero está disponible)
// ------------------------------------------------------------
export const getRolById = async (id: number) => {
    const res = await api.get(`/agro-roles/${id}`);
    return res.data.rol;
};

// ------------------------------------------------------------
// createRol — crea un nuevo rol
// POST /agro-roles
// Body: { rol_nombre, rol_descripcion?, rol_permiso }
// Nota: NO se envía rol_rol — el trigger Oracle lo asigna
// Retorna: Rol creado con su ID asignado
// ------------------------------------------------------------
export const createRol = async (data: {
    rol_nombre:       string;
    rol_descripcion?: string;
    rol_permiso:      number;
}) => {
    const res = await api.post("/agro-roles", data);
    return res.data.rol;
};

// ------------------------------------------------------------
// updateRol — actualiza un rol existente
// PUT /agro-roles/:id
// Body: campos a actualizar (todos opcionales)
// Retorna: Rol actualizado
// ------------------------------------------------------------
export const updateRol = async (id: number, data: {
    rol_nombre?:      string;
    rol_descripcion?: string;
    rol_permiso?:     number;
}) => {
    const res = await api.put(`/agro-roles/${id}`, data);
    return res.data.rol;
};

// ------------------------------------------------------------
// deleteRol — desactiva un rol (borrado lógico)
// DELETE /agro-roles/:id
// El backend pone rol_activo = 0, no borra el registro
// Retorna: { ok, message }
// ------------------------------------------------------------
export const deleteRol = async (id: number) => {
    const res = await api.delete(`/agro-roles/${id}`);
    return res.data;
};