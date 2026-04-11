import React from "react";
import { Package } from "lucide-react";
import { useAgroProducto } from "./UseAgroProducto";
import { TIPO_PRODUCTO } from "./AgroProducto.types";
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const COLUMNAS: ColumnaConfig[] = [
    { header: "ID",            key: "produ_producto"     },
    { header: "Nombre",        key: "produ_nombre"       },
    {
        header: "Tipo",
        key:    "produ_tipo",
        badge:  Object.fromEntries(
            Object.entries(TIPO_PRODUCTO).map(([k, v]) => [k, { label: v.label, bg: v.bg, text: v.text }])
        )
    },
    { header: "Concentración", key: "produ_concentracion" },
    { header: "Unidad",        key: "produ_unidad"        },
    { 
        header: "Stock Actual",  
        key: "produ_stock_actual",
        render: (valor: any, item: any) => {
            const esBajo = item.produ_stock_actual <= item.produ_stock_minimo;
            return (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, color: esBajo ? "#dc2626" : "#16a34a", fontSize: "15px" }}>
                        {valor}
                    </span>
                    {esBajo && (
                        <span style={{
                            padding: "2px 8px", fontSize: "10px", fontWeight: 700,
                            background: "#fee2e2", color: "#b91c1c",
                            borderRadius: "12px", border: "1px solid #fecaca",
                            textTransform: "uppercase"
                        }}>
                            Bajo
                        </span>
                    )}
                </div>
            );
        }
    },
    { header: "Stock Mínimo",  key: "produ_stock_minimo"  },
];

const CAMPOS: CampoFormulario[] = [
    {
        key:         "produ_nombre",
        label:       "Nombre",
        tipo:        "text",
        placeholder: "Ej: Mancozeb 80%",
        requerido:   true,
    },
    {
        key:       "produ_tipo",
        label:     "Tipo",
        tipo:      "select",
        requerido: true,
        opciones: [
            { valor: "Fungicida",    label: "Fungicida"    },
            { valor: "Bactericida",  label: "Bactericida"  },
            { valor: "Insecticida",  label: "Insecticida"  },
            { valor: "Herbicida",    label: "Herbicida"    },
            { valor: "Fertilizante", label: "Fertilizante" },
        ]
    },
    {
        key:         "produ_concentracion",
        label:       "Concentración",
        tipo:        "text",
        placeholder: "Ej: 80%",
    },
    {
        key:         "produ_unidad",
        label:       "Unidad",
        tipo:        "text",
        placeholder: "Ej: kg, L, ml",
    },
    {
        key:         "produ_stock_actual",
        label:       "Stock Inicial",
        tipo:        "number",
        placeholder: "0",
    },
    {
        key:         "produ_stock_minimo",
        label:       "Stock Mínimo (Alerta)",
        tipo:        "number",
        placeholder: "0",
    },
];

const AgroProductoPage = () => {
    const {
        productosFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    } = useAgroProducto();

    return (
        <CrudTabla
            titulo="Productos"
            subtitulo="AGRO_PRODUCTO"
            icono={Package}
            columnas={COLUMNAS}
            datos={productosFiltrados}
            idKey="produ_producto"
            campos={CAMPOS}
            loading={loading}
            error={error}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            modal={modal}
            editando={editando}
            form={form}
            setForm={setForm as (f: Record<string, unknown>) => void}
            guardando={guardando}
            formError={formError}
            onNuevo={abrirCrear}
            onEditar={abrirEditar}
            onEliminar={handleEliminar}
            onGuardar={handleGuardar}
            onCerrar={cerrarModal}
        />
    );
};

export default AgroProductoPage;