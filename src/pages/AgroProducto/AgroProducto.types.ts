export interface Producto {
    [key: string]: unknown;
    produ_producto:     number;
    produ_nombre:       string;
    produ_tipo:         string;   // "Fungicida" | "Bactericida" | "Insecticida"
    produ_concentracion:string;
    produ_unidad:       string;
    produ_activo:       number;
}

export interface ProductoFormData {
    [key: string]: unknown;
    produ_nombre:        string;
    produ_tipo:          string;
    produ_concentracion: string;
    produ_unidad:        string;
}

export const PRODUCTO_FORM_INICIAL: ProductoFormData = {
    produ_nombre:        "",
    produ_tipo:          "",
    produ_concentracion: "",
    produ_unidad:        "",
};

export const TIPO_PRODUCTO: Record<string, { label: string; bg: string; text: string }> = {
    Fungicida:    { label: "Fungicida",    bg: "#f3e8ff", text: "#7c3aed" },
    Bactericida:  { label: "Bactericida",  bg: "#ddeef8", text: "#2563a0" },
    Insecticida:  { label: "Insecticida",  bg: "#fde8e0", text: "#a03020" },
    Herbicida:    { label: "Herbicida",    bg: "#fef3c7", text: "#b45309" },
    Fertilizante: { label: "Fertilizante", bg: "#e8f0e0", text: "#4a7c59" },
};