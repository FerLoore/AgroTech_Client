import { useEffect, useState, useMemo } from "react";
import { getArboles, createArbol, updateArbol, deleteArbol } from "../../api/AgroArbol.api";
import { ARBOL_FORM_INICIAL } from "./agroArbol.types";
import type { Arbol, ArbolFormData } from "./agroArbol.types";
import { getTipoArboles } from "../../api/AgroTipoArbol.api";
import { getHistorialByArbol } from "../../api/AgroHistorial.api";
import { getSurcos } from "../../api/AgroSurco.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";
import { getAgroFincas } from "../../api/AgroFinca.api"; // 👈 NUEVO
import type { Historial } from "../AgroHistorial/agroHistorial.types";
import { toast } from "sonner";

const calcularEdad = (fecha: string): number => {
    return Math.floor(
        (Date.now() - new Date(fecha).getTime()) / (365.25 * 24 * 3600 * 1000)
    );
};

export const useAgroArbol = () => {

    const [arboles, setArboles] = useState<Arbol[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroSurco, setFiltroSurco] = useState("");
    const [filtroSeccion, setFiltroSeccion] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [filtroFinca, setFiltroFinca] = useState(""); // 👈 NUEVO
    const [seccionForm, setSeccionForm] = useState("");

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
    const [surcos, setSurcos] = useState<any[]>([]);
    const [secciones, setSecciones] = useState<any[]>([]);
    const [fincas, setFincas] = useState<any[]>([]); // 👈 NUEVO

    const formatFecha = (fecha: string) => {
        try { return new Date(fecha).toISOString().split("T")[0]; }
        catch { return ""; }
    };

    const cargar = async () => {
        try {
            setLoading(true);
            const data = await getArboles();
            setArboles(data.map((a: Arbol) => ({ ...a, arb_estado: String(a.arb_estado) })));
            setError("");
        } catch {
            setError("Error al cargar árboles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await cargar();
            try {
                const [tipos, surcoData, seccionData, fincaData] = await Promise.all([
                    getTipoArboles(),
                    getSurcos(),
                    getAgroSecciones().then(r => r.data.secciones ?? r.data),
                    getAgroFincas().then(r => r.data.fincas ?? r.data) // 👈 NUEVO
                ]);
                setTiposArbol(tipos);
                setSurcos(surcoData);
                setSecciones(seccionData);
                setFincas(fincaData); // 👈 NUEVO
            } catch {
                console.error("Error cargando catálogos");
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

    const arbolesEnriquecidos = useMemo(() => {
        return arboles.map(a => {
            const surco = surcos.find(s => s.sur_surco === a.sur_surcos);
            const referencia = surco
                ? `S${surco.sur_numero_surco}-P${a.arb_posicion_surco}`
                : `P${a.arb_posicion_surco}`;
            return {
                ...a,
                arb_edad: calcularEdad(a.arb_fecha_siembra),
                arb_referencia: referencia,
                sur_numero: surco?.sur_numero_surco ?? a.sur_surcos,
                secc_id: surco?.secc_secciones ?? null
            };
        });
    }, [arboles, surcos]);

    const surcosPorSeccion = useMemo(() => {
        if (!seccionForm) return surcos;
        return surcos.filter(s => String(s.secc_secciones) === seccionForm);
    }, [surcos, seccionForm]);

    // Secciones filtradas según finca seleccionada en los filtros
    const seccionesFiltradas = useMemo(() => {
        if (!filtroFinca) return secciones;
        return secciones.filter(s => String(s.fin_finca) === filtroFinca);
    }, [secciones, filtroFinca]);

    // Surcos filtrados según sección filtrada
    const surcosFiltrados = useMemo(() => {
        if (!filtroFinca && !filtroSeccion) return surcos;
        const seccionIds = seccionesFiltradas.map(s => String(s.secc_seccion));
        return surcos.filter(s => seccionIds.includes(String(s.secc_secciones)));
    }, [surcos, seccionesFiltradas, filtroFinca, filtroSeccion]);

    const opcionesSecciones = secciones.map(s => ({
        valor: String(s.secc_seccion),
        label: s.secc_nombre
    }));

    const opcionesSurcos = surcosPorSeccion.map(s => ({
        valor: String(s.sur_surco),
        label: `Surco ${s.sur_numero_surco}`
    }));

    // Filtros combinados incluyendo finca
    const arbolesFiltrados = useMemo(() => {
        // IDs de secciones que pertenecen a la finca seleccionada
        const seccionIdsDeFinca = filtroFinca
            ? seccionesFiltradas.map(s => String(s.secc_seccion))
            : null;

        // IDs de surcos que pertenecen a esas secciones
        const surcoIdsDeFinca = seccionIdsDeFinca
            ? surcos
                .filter(s => seccionIdsDeFinca.includes(String(s.secc_secciones)))
                .map(s => String(s.sur_surco))
            : null;

        return arbolesEnriquecidos.filter(a => {
            const matchBusqueda = busqueda
                ? String(a.arb_referencia).toLowerCase().includes(busqueda.toLowerCase()) ||
                String(a.arb_estado).toLowerCase().includes(busqueda.toLowerCase()) ||
                String(a.arb_arbol).includes(busqueda)
                : true;
            const matchEstado = filtroEstado ? a.arb_estado === filtroEstado : true;
            const matchSurco = filtroSurco ? String(a.sur_surcos) === filtroSurco : true;
            const matchTipo = filtroTipo ? String(a.tipar_tipo_arbol) === filtroTipo : true;
            const matchSeccion = filtroSeccion ? String(a.secc_id) === filtroSeccion : true;
            const matchFinca = surcoIdsDeFinca
                ? surcoIdsDeFinca.includes(String(a.sur_surcos))
                : true;
            return matchBusqueda && matchEstado && matchSurco && matchTipo && matchSeccion && matchFinca;
        });
    }, [arbolesEnriquecidos, busqueda, filtroEstado, filtroSurco, filtroTipo, filtroSeccion, filtroFinca, seccionesFiltradas, surcos]);

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

    const handleEliminar = (a: Arbol) => {
        toast.warning(`¿Desactivar árbol #${a.arb_arbol}?`, {
            action: {
                label: "Desactivar",
                onClick: async () => {
                    await deleteArbol(a.arb_arbol);
                    cargar();
                    toast.success("Árbol desactivado");
                }
            }
        });
    };

    const abrirHistorial = async (a: Arbol) => {
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
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        filtroSurco, setFiltroSurco,
        filtroSeccion, setFiltroSeccion,
        filtroTipo, setFiltroTipo,
        filtroFinca, setFiltroFinca, // 👈 NUEVO
        surcos,
        surcosFiltrados, // 👈 NUEVO — surcos ya filtrados por finca/sección para los selects
        secciones,
        seccionesFiltradas, // 👈 NUEVO — secciones ya filtradas por finca para el select
        fincas, // 👈 NUEVO
        tiposArbol,
        modal,
        editando,
        form, setForm,
        guardando,
        formError,
        abrirCrear,
        abrirEditar,
        cerrarModal: () => setModal(false),
        handleGuardar,
        handleEliminar,
        opcionesTipoArbol,
        opcionesSecciones,
        opcionesSurcos,
        seccionForm, setSeccionForm,
        TIPOS_ARBOL_DINAMICO,
        modalHistorial,
        historialArbol,
        loadingHistorial,
        abrirHistorial,
        arbolSeleccionado,
        cerrarHistorial: () => setModalHistorial(false)
    };
};