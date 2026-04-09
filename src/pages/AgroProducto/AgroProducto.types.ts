export interface Producto {
    [key: string]: unknown;
    produ_producto:      number;
    produ_nombre:        string;
    produ_tipo:          string;   
    produ_concentracion: string;
    produ_unidad:        string;
    produ_activo:        number;
    produ_stock:         number; // Nuevo
    produ_stock_minimo:  number; // Nuevo
}

export interface ProductoFormData {
    [key: string]: unknown;
    produ_nombre:        string;
    produ_tipo:          string;
    produ_concentracion: string;
    produ_unidad:        string;
    produ_stock:         number | string; // Permitimos string temporalmente mientras el usuario escribe en el input
    produ_stock_minimo:  number | string; 
}

// Valores por defecto al darle click al botón "Nuevo"
export const PRODUCTO_FORM_INICIAL: ProductoFormData = {
    produ_nombre:        "",
    produ_tipo:          "",
    produ_concentracion: "",
    produ_unidad:        "",
    produ_stock:         0, 
    produ_stock_minimo:  5, 
};

export const TIPO_PRODUCTO: Record<string, { label: string; bg: string; text: string }> = {
    Fungicida:    { label: "Fungicida",    bg: "#f3e8ff", text: "#7c3aed" },
    Bactericida:  { label: "Bactericida",  bg: "#ddeef8", text: "#2563a0" },
    Insecticida:  { label: "Insecticida",  bg: "#fde8e0", text: "#a03020" },
    Herbicida:    { label: "Herbicida",    bg: "#fef3c7", text: "#b45309" },
    Fertilizante: { label: "Fertilizante", bg: "#e8f0e0", text: "#4a7c59" },
};