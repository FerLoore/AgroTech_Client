import api from "./Axios";

// GET /agro-producto
export const getProductos = async () => {
    const res = await api.get("/agro-producto");
    return res.data.productos;
};

// POST /agro-producto
export const createProducto = async (data: {
    produ_nombre:         string;
    produ_tipo:           string;
    produ_concentracion?: string;
    produ_unidad?:        string;
    produ_stock_actual?:  number;
    produ_stock_minimo?:  number;
}) => {
    const res = await api.post("/agro-producto", data);
    return res.data.producto;
};

// PUT /agro-producto/:id
export const updateProducto = async (id: number, data: {
    produ_nombre?:        string;
    produ_tipo?:          string;
    produ_concentracion?: string;
    produ_unidad?:        string;
    produ_stock_actual?:  number;
    produ_stock_minimo?:  number;
}) => {
    const res = await api.put(`/agro-producto/${id}`, data);
    return res.data.producto;
};

// DELETE /agro-producto/:id  — borrado lógico
export const deleteProducto = async (id: number) => {
    const res = await api.delete(`/agro-producto/${id}`);
    return res.data;
};