import api from "./Axios";

// GET /agro-catalogo-patogeno
export const getCatalogoPatogenos = async () => {
    const res = await api.get("/agro-catalogo-patogeno");
    return res.data.cataloGoPatogenos;
};

// POST /agro-catalogo-patogeno
export const createCatalogoPatogeno = async (data: {
    catpato_nombre_comun:       string;
    catpato_nombre_cientifico?: string;
    catpato_tipo:               string;
    catpato_gravedad:           number;
}) => {
    const res = await api.post("/agro-catalogo-patogeno", data);
    return res.data.cataloGoPatogeno;
};

// PUT /agro-catalogo-patogeno/:id
export const updateCatalogoPatogeno = async (id: number, data: {
    catpato_nombre_comun?:      string;
    catpato_nombre_cientifico?: string;
    catpato_tipo?:              string;
    catpato_gravedad?:          number;
}) => {
    const res = await api.put(`/agro-catalogo-patogeno/${id}`, data);
    return res.data.cataloGoPatogeno;
};

// DELETE /agro-catalogo-patogeno/:id  — borrado lógico
export const deleteCatalogoPatogeno = async (id: number) => {
    const res = await api.delete(`/agro-catalogo-patogeno/${id}`);
    return res.data;
};