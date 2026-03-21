import { useEffect, useState, useMemo } from "react";
import { getArboles, createArbol, updateArbol, deleteArbol } from "../../api/AgroArbol.api";
import { ARBOL_FORM_INICIAL } from "./agroArbol.types";
import type { Arbol, ArbolFormData } from "./agroArbol.types";
import { getTipoArboles } from "../../api/AgroTipoArbol.api";
import { getHistorialByArbol } from "../../api/AgroHistorial.api";
import type { Historial } from "../AgroHistorial/agroHistorial.types";
import { toast } from "sonner";

export const useAgroArbol = () => {

    const [arboles, setArboles] = useState<Arbol[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Arbol | null>(null);
    const [form, setForm] = useState<ArbolFormData>(ARBOL_FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");
    const [modalHistorial, setModalHistorial] = useState(false);
    const [historialArbol, setHistorialArbol] = useState<Historial[]>([]);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [arbolSeleccionado, setArbolSeleccionado] = useState<Arbol | null>(null);
    const [tiposArbol, setTiposArbol] = useState<any[]>([]);
    // FORMATEADOR DE FECHA (CLAVE)
    const formatFecha = (fecha: string) => {
        try {
            return new Date(fecha).toISOString().split("T")[0];
        } catch {
            return "";
        }
    };

    const cargar = async () => {
        try {
            setLoading(true);
            const data = await getArboles();
            // normalizamos arb_estado a mayúsculas para que coincida con TipoArbol
            const normalizados = data.map((a: Arbol) => ({
                ...a,
                arb_estado: String(a.arb_estado)
            }));
            setArboles(normalizados);
            setError("");
        } catch {
            setError("Error al cargar árboles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await cargar();        // 👈 ESTO FALTABA
            try {
                const data = await getTipoArboles();
                setTiposArbol(data);
            } catch {
                console.error("Error cargando tipos de árbol");
            }
        };

        init();
    }, []);
    const opcionesTipoArbol = tiposArbol.map(t => ({
        valor: String(t.tipar_tipo_arbol),
        label: t.tipar_nombre_comun
    }));

    const TIPOS_ARBOL_DINAMICO = useMemo(() => {
        const colores = [
            { bg: "#fff7e6", text: "#b45309" },
            { bg: "#e6f4ea", text: "#166534" },
            { bg: "#fff1f2", text: "#ea580c" },
            { bg: "#f0fdf4", text: "#65a30d" },
            { bg: "#fef3c7", text: "#d97706" },
            { bg: "#ede9fe", text: "#5b21b6" },
        ];
        return tiposArbol.reduce((acc, t, i) => {
            acc[t.tipar_tipo_arbol] = {
                label: t.tipar_nombre_comun,
                bg: colores[i % colores.length].bg,
                text: colores[i % colores.length].text
            };
            return acc;
        }, {} as Record<number, { label: string; bg: string; text: string }>);
    }, [tiposArbol]);

    const arbolesFiltrados = arboles.filter(a =>
        a.arb_estado.toLowerCase().includes(busqueda.toLowerCase())
    );

    const abrirCrear = () => {
        setEditando(null);
        setForm(ARBOL_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (a: Arbol) => {
        setEditando(a);
        setForm({
            arb_posicion_surco: String(a.arb_posicion_surco),
            arb_fecha_siembra: formatFecha(a.arb_fecha_siembra),
            tipar_tipo_arbol: String(a.tipar_tipo_arbol),
            arb_estado: String(a.arb_estado),
            sur_surcos: String(a.sur_surcos)
        });
        setFormError("");
        setModal(true);
    };
    console.log("ESTADO:", form.arb_estado);
    const handleGuardar = async () => {
        if (!form.arb_posicion_surco || !form.arb_fecha_siembra) {
            setFormError("Campos requeridos");
            return;
        }

        try {
            setGuardando(true);

            if (editando) {
                await updateArbol(editando.arb_arbol, {
                    arb_posicion_surco: Number(form.arb_posicion_surco),
                    arb_fecha_siembra: form.arb_fecha_siembra,
                    tipar_tipo_arbol: Number(form.tipar_tipo_arbol),
                    arb_estado: form.arb_estado,
                    sur_surcos: Number(form.sur_surcos)
                });
                toast.success("Actualizado");
            } else {
                await createArbol({
                    arb_posicion_surco: Number(form.arb_posicion_surco),
                    arb_fecha_siembra: form.arb_fecha_siembra,
                    tipar_tipo_arbol: Number(form.tipar_tipo_arbol),
                    arb_estado: form.arb_estado,
                    sur_surcos: Number(form.sur_surcos)
                });
                toast.success("Creado");
            }

            setModal(false);
            cargar();

        } catch {
            toast.error("Error al guardar");
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (a: Arbol) => {
        await deleteArbol(a.arb_arbol);
        cargar();
        toast.success("Eliminado");
    };

    const abrirHistorial = async (a: Arbol) => {
        console.log("abrirHistorial llamado", a);
        setArbolSeleccionado(a);
        setModalHistorial(true);
        setLoadingHistorial(true);
        try {
            const data = await getHistorialByArbol(a.arb_arbol);
            setHistorialArbol(data);
        } catch {
            toast.error("Error al cargar historial");
        } finally {
            setLoadingHistorial(false);
        }
    };

    return {
        arbolesFiltrados,
        loading,
        error,
        busqueda,
        setBusqueda,
        modal,
        editando,
        form,
        setForm,
        guardando,
        formError,
        abrirCrear,
        abrirEditar,
        cerrarModal: () => setModal(false),
        handleGuardar,
        handleEliminar,
        opcionesTipoArbol,
        modalHistorial,
        historialArbol,
        loadingHistorial,
        abrirHistorial,
        arbolSeleccionado,
        cerrarHistorial: () => setModalHistorial(false),
        TIPOS_ARBOL_DINAMICO
    };
};