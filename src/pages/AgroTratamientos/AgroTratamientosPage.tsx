import { Stethoscope } from "lucide-react";
import { useAgroTratamientos } from "./UseAgroTratamientos";
// 1. CORRECCIÓN DE IMPORTACIÓN: Separamos el componente de los tipos
import CrudTabla from "../../components/CrudTabla";
import type { ColumnaConfig, CampoFormulario } from "../../components/CrudTabla";

const AgroTratamientosPage = () => {
    const {
        tratamientos, productos, alertas, loading, error, busqueda, setBusqueda,
        modal, form, setForm, guardando, formError,
        abrirCrear, cerrarModal, handleGuardar, onFinalizarClick
    } = useAgroTratamientos();

    const COLUMNAS: ColumnaConfig[] = [
        { header: "ID", key: "trata_tratamientos" }, // Plural, como en tu BD
        { header: "Alerta", key: "alerta_nom" },
        { header: "Producto", key: "produ_producto_nom" },
        { header: "Dosis", key: "trata_dosis" },
        { header: "Cantidad Extraída", key: "trata_cantidad" },
        { 
            header: "Fecha Inicio", 
            key: "trata_fecha_inicio", 
            // 2. CORRECCIÓN FORMATO: Usamos render en lugar de la propiedad 'formato'
            render: (val: string) => val ? new Date(val).toLocaleDateString() : '' 
        },
        { 
            header: "Fecha Fin", 
            key: "trata_fecha_fin",
            render: (val: string) => val ? new Date(val).toLocaleDateString() : '' 
        },
        { 
            header: "Estado", 
            key: "trata_estado",
            // Si 'badge' te marca error en el futuro, cámbialo por un 'render' como hicimos antes
            badge: {
                "En curso": { label: "⏳ En curso", bg: "#e0f2fe", text: "#0284c7" },
                "Finalizado": { label: "✅ Finalizado", bg: "#dcfce7", text: "#16a34a" }
            }
        }
    ];

    const CAMPOS: CampoFormulario[] = [
        { 
            key: "alertsalu_alerta_salud", 
            label: "Alerta de Salud (Diagnóstico)", 
            tipo: "select", 
            opciones: (alertas || []).map(a => ({
                valor: String(a?.alertsalud_id),
                label: `Alerta #${a?.alertsalud_id} (Árbol ${a?.arb_arbol})`
            })),
            requerido: true 
        },
        { 
            key: "produ_producto", // Nombre exacto de tu BD
            label: "Seleccionar Producto", 
            tipo: "select", 
            opciones: (productos || []).map(p => ({
                valor: String(p?.produ_producto),
                label: `${p?.produ_nombre} (En Bodega: ${p?.produ_stock || 0})`
            })),
            requerido: true 
        },
        { key: "trata_cantidad", label: "Cantidad a Extraer del Stock", tipo: "number", requerido: true },
        { key: "trata_dosis", label: "Dosis e Instrucciones", tipo: "text", requerido: true },
        { key: "trata_fecha_inicio", label: "Fecha de Inicio", tipo: "date", requerido: true },
        { key: "trata_fecha_fin", label: "Fecha Estimada de Fin", tipo: "date", requerido: false },
        { key: "trata_observaciones", label: "Observaciones", tipo: "text", requerido: false }
    ];

    return (
        <CrudTabla
            titulo="Prescripción y Seguimiento"
            subtitulo="Control de Tratamientos y Descuento de Stock"
            icono={Stethoscope}
            columnas={COLUMNAS}
            datos={tratamientos}
            idKey="trata_tratamientos" // Plural
            campos={CAMPOS}
            loading={loading}
            error={error}
            busqueda={busqueda}
            setBusqueda={setBusqueda}
            modal={modal}
            editando={null} 
            form={form}
            setForm={setForm}
            guardando={guardando}
            formError={formError}
            onNuevo={abrirCrear}
            onEliminar={onFinalizarClick} 
            labelEliminar="Finalizar"
            onGuardar={handleGuardar}
            onCerrar={cerrarModal}
        />
    );
};

export default AgroTratamientosPage;