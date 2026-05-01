import { useEffect, useState } from "react";
import {
    getTratamientos,
    createTratamiento,
    updateTratamiento,
    deleteTratamiento
} from "../../api/AgroTratamientos.api";
import { getAlertas } from "../../api/AgroAlertaSalud.api";
import { getProductos } from "../../api/AgroProducto.api";
import { getAnalisisLaboratorio } from "../../api/agroAnalisisLaboratorio.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";
import { getArboles } from "../../api/AgroArbol.api";
import { getSurcos } from "../../api/AgroSurco.api";
import { getAgroFincas } from "../../api/AgroFinca.api";
import type { Tratamiento, TratamientoFormData } from "./AgroTratamientos.types";
import { TRATAMIENTO_FORM_INICIAL } from "./AgroTratamientos.types";
import { toast } from "sonner";

export const useAgroTratamientos = () => {
    const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [alertas, setAlertas] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [analisis, setAnalisis] = useState<any[]>([]);
    const [arboles, setArboles] = useState<any[]>([]);
    const [surcos, setSurcos] = useState<any[]>([]);
    const [secciones, setSecciones] = useState<any[]>([]);
    const [fincas, setFincas] = useState<any[]>([]);

    // Filtros de tabla
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");
    const [filtroProducto, setFiltroProducto] = useState("");
    const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
    const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
    const [filtroFincaTabla, setFiltroFincaTabla] = useState("");

    // Filtro de finca en formulario
    const [filtroFincaForm, setFiltroFincaForm] = useState("");

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Tratamiento | null>(null);
    const [form, setForm] = useState<TratamientoFormData>(TRATAMIENTO_FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    const cargarTratamientos = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getTratamientos();
            setTratamientos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error al cargar los tratamientos:", err);
            setError("Error al cargar los tratamientos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await cargarTratamientos();
            try {
                const [resAlertas, resProductos, resAnalisis, resSecciones, resArboles, resSurcos, resFincas] = await Promise.all([
                    getAlertas(),
                    getProductos(),
                    getAnalisisLaboratorio(),
                    getAgroSecciones(),
                    getArboles(1, 2000),
                    getSurcos(),
                    getAgroFincas(),
                ]);
                
                setAlertas(Array.isArray(resAlertas) ? resAlertas : []);
                setProductos(Array.isArray(resProductos) ? resProductos : []);
                setAnalisis(Array.isArray(resAnalisis) ? resAnalisis : []);
                setSecciones((resSecciones as any)?.data?.secciones || []);
                setArboles(resArboles?.arboles || []);
                setSurcos(resSurcos?.surcos || (Array.isArray(resSurcos) ? resSurcos : []));
                setFincas(resFincas?.data?.fincas || []);
            } catch (err) {
                console.error("Error cargando datos maestros:", err);
            }
        };
        init();
    }, []);

    // 1. Filtrar alertas confirmadas
    const alertasConfirmadas = alertas.filter(alerta => {
        return analisis.some(an => 
            Number(an.alert_alerta_salud) === Number(alerta.alertsalud_id) && 
            an.analab_resultado_tipo === "Positivo"
        );
    });

    // 2. Opciones de alertas filtradas por finca en formulario
    const opcionesAlertas = alertasConfirmadas
        .filter(alerta => {
            if (!filtroFincaForm) return true;
            const arbol = arboles.find(a => Number(a.arb_arbol) === Number(alerta.arb_arbol));
            const surco = arbol ? surcos.find(s => Number(s.sur_surco) === Number(arbol.sur_surcos)) : null;
            const seccion = surco ? secciones.find(s => Number(s.secc_seccion) === Number(surco.secc_secciones)) : null;
            const finca = seccion ? fincas.find(f => Number(f.fin_finca) === Number(seccion.fin_finca)) : null;
            return String(finca?.fin_finca) === String(filtroFincaForm);
        })
        .map(a => ({
            valor: String(a.alertsalud_id),
            label: `Alerta #${a.alertsalud_id} - Árbol ${a.arb_arbol}`
        }));

    const opcionesProductos = productos.map(p => ({
        valor: String(p.produ_producto),
        label: p.produ_nombre
    }));

    const opcionesSecciones = secciones.map(s => ({
        valor: String(s.secc_seccion),
        label: s.secc_nombre
    }));

    const opcionesFincas = fincas.map(f => ({
        valor: String(f.fin_finca),
        label: f.fin_nombre
    }));

    // 3. Lógica de filtrado de tabla avanzada
    const tratamientosFiltrados = tratamientos.filter((t: any) => {
        // Filtro por búsqueda general
        const matchBusqueda = !busqueda || 
            String(t.trata_estado ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(t.trata_tipo ?? "").toLowerCase().includes(busqueda.toLowerCase());
        
        // Filtro por estado
        const matchEstado = !filtroEstado || t.trata_estado === filtroEstado;
        
        // Filtro por producto
        const matchProducto = !filtroProducto || String(t.produ_producto) === String(filtroProducto);
        
        // Filtro por fecha inicio
        const fechaTrata = String(t.trata_fecha_inicio ?? "").split("T")[0];
        const matchFecha = (!filtroFechaDesde || fechaTrata >= filtroFechaDesde) &&
                           (!filtroFechaHasta || fechaTrata <= filtroFechaHasta);

        // Filtro por finca (Tabla)
        let matchFinca = true;
        if (filtroFincaTabla) {
            let fincaId = null;
            if (t.trata_tipo === "Curativo" && t.alertsalu_alerta_salud) {
                const alerta = alertas.find(a => Number(a.alertsalud_id) === Number(t.alertsalu_alerta_salud));
                const arbol = alerta ? arboles.find(a => Number(a.arb_arbol) === Number(alerta.arb_arbol)) : null;
                const surco = arbol ? surcos.find(s => Number(s.sur_surco) === Number(arbol.sur_surcos)) : null;
                const seccion = surco ? secciones.find(s => Number(s.secc_seccion) === Number(surco.secc_secciones)) : null;
                fincaId = seccion ? seccion.fin_finca : null;
            } else if (t.trata_tipo === "Preventivo" && t.secc_seccion) {
                const seccion = secciones.find(s => Number(s.secc_seccion) === Number(t.secc_seccion));
                fincaId = seccion ? seccion.fin_finca : null;
            }
            matchFinca = String(fincaId) === String(filtroFincaTabla);
        }

        return matchBusqueda && matchEstado && matchProducto && matchFecha && matchFinca;
    }).map((t: any) => {
        // Enriquecer con ID de árbol para la tabla
        let ui_arbol_id = "—";
        if (t.trata_tipo === "Curativo" && t.alertsalu_alerta_salud) {
            const alerta = alertas.find(a => Number(a.alertsalud_id) === Number(t.alertsalu_alerta_salud));
            ui_arbol_id = alerta ? `Árbol #${alerta.arb_arbol}` : `Alerta #${t.alertsalu_alerta_salud}`;
        } else if (t.trata_tipo === "Preventivo" && t.secc_seccion) {
            const seccion = secciones.find(s => Number(s.secc_seccion) === Number(t.secc_seccion));
            ui_arbol_id = seccion ? seccion.secc_nombre : `Secc #${t.secc_seccion}`;
        }

        // Nombre del producto
        const producto = productos.find(p => Number(p.produ_producto) === Number(t.produ_producto));
        const ui_producto_nombre = producto ? producto.produ_nombre : `Ref #${t.produ_producto}`;

        return { ...t, ui_arbol_id, ui_producto_nombre };
    });

    const abrirCrear = () => {
        setEditando(null);
        setForm(TRATAMIENTO_FORM_INICIAL);
        setFiltroFincaForm("");
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (t: Tratamiento) => {
        setEditando(t);
        const toDate = (d?: string) => d ? String(d).split("T")[0] : "";

        // Restaurar el filtro de finca en el formulario para tratamientos Curativos
        if (t.trata_tipo === "Curativo" && t.alertsalu_alerta_salud) {
            const alerta = alertas.find(a => Number(a.alertsalud_id) === Number(t.alertsalu_alerta_salud));
            if (alerta) {
                const arbol   = arboles.find(a => Number(a.arb_arbol) === Number(alerta.arb_arbol));
                const surco   = arbol   ? surcos.find(s => Number(s.sur_surco) === Number(arbol.sur_surcos)) : null;
                const seccion = surco   ? secciones.find(s => Number(s.secc_seccion) === Number(surco.secc_secciones)) : null;
                const finca   = seccion ? fincas.find(f => Number(f.fin_finca) === Number(seccion.fin_finca)) : null;
                setFiltroFincaForm(finca ? String(finca.fin_finca) : "");
            }
        } else {
            setFiltroFincaForm("");
        }

        // Extraer num_aplicaciones del texto de observaciones si existe
        let numAplicaciones: number | null = null;
        const obs = t.trata_observaciones || "";
        const matchNum = obs.match(/por un total de (\d+) aplicaciones/);
        if (matchNum) numAplicaciones = parseInt(matchNum[1]);

        setForm({
            trata_fecha_inicio: toDate(t.trata_fecha_inicio),
            trata_fecha_fin: toDate(t.trata_fecha_fin as string),
            trata_estado: t.trata_estado,
            trata_dosis: t.trata_dosis || "",
            trata_observaciones: obs,
            alertsalu_alerta_salud: t.alertsalu_alerta_salud !== undefined ? t.alertsalu_alerta_salud : null,
            produ_producto: t.produ_producto,
            trata_tipo: t.trata_tipo || "Curativo",
            secc_seccion: t.secc_seccion !== undefined ? t.secc_seccion : null,
            trata_num_aplicaciones: numAplicaciones,
        });
        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    const handleGuardar = async () => {
        if (!String(form.trata_fecha_inicio).trim()) {
            setFormError("La fecha de inicio es requerida");
            return;
        }

        if (form.trata_tipo === "Curativo" && !form.alertsalu_alerta_salud) {
            setFormError("La alerta de salud es requerida para tratamientos curativos");
            return;
        }

        if (form.trata_tipo === "Preventivo" && !form.secc_seccion) {
            setFormError("La sección es requerida para tratamientos preventivos");
            return;
        }

        if (!Number(form.produ_producto)) {
            setFormError("El producto es requerido");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            const obsActual = String(form.trata_observaciones || "");
            // Si el usuario cambió num_aplicaciones, actualizamos ese valor en las observaciones
            let obsActualizada = obsActual;
            if (form.trata_num_aplicaciones !== null && form.trata_num_aplicaciones !== undefined) {
                const numApl = Number(form.trata_num_aplicaciones);
                if (obsActual.match(/por un total de \d+ aplicaciones/)) {
                    // Reemplazar el valor existente
                    obsActualizada = obsActual.replace(
                        /por un total de \d+ aplicaciones/,
                        `por un total de ${numApl} aplicaciones`
                    );
                } else if (obsActual.trim()) {
                    // Agregar al final si hay observaciones pero no tiene el patrón
                    obsActualizada = `${obsActual} [Número de aplicaciones: ${numApl}]`;
                } else {
                    // Sin observaciones previas, crear una nueva
                    obsActualizada = `Número de aplicaciones: ${numApl}`;
                }
            }

            const payload = {
                ...form,
                trata_fecha_inicio: form.trata_fecha_inicio || new Date().toISOString().split("T")[0],
                trata_fecha_fin:    form.trata_fecha_fin    || null,
                trata_estado:       form.trata_estado       || "En curso",
                trata_observaciones: obsActualizada || undefined,
                alertsalu_alerta_salud: form.trata_tipo === "Curativo" ? Number(form.alertsalu_alerta_salud) : null,
                secc_seccion:           form.trata_tipo === "Preventivo" ? Number(form.secc_seccion) : null,
                produ_producto:         Number(form.produ_producto),
                usu_usuario:            1,
            };

            if (editando) {
                await updateTratamiento(editando.trata_tratamientos, payload as any);
                toast.success("Tratamiento actualizado");
            } else {
                await createTratamiento(payload as any);
                toast.success("Tratamiento y prescripción generada");
            }

            setModal(false);
            await cargarTratamientos();
        } catch (err: any) {
            console.error("ERROR GUARDAR:", err);
            const msg = err?.response?.data?.message || err?.message || "Error al guardar";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = (t: Tratamiento) => {
        toast.warning("¿Eliminar tratamiento?", {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        await deleteTratamiento(t.trata_tratamientos);
                        await cargarTratamientos();
                        toast.success("Tratamiento eliminado");
                    } catch (err: any) {
                        toast.error("Error al eliminar");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} },
        });
    };

    return {
        tratamientos,
        tratamientosFiltrados,
        loading,
        error,
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        filtroProducto, setFiltroProducto,
        filtroFechaDesde, setFiltroFechaDesde,
        filtroFechaHasta, setFiltroFechaHasta,
        filtroFincaTabla, setFiltroFincaTabla,
        filtroFincaForm, setFiltroFincaForm,
        modal,
        editando,
        form,
        setForm,
        guardando,
        formError,
        abrirCrear,
        abrirEditar,
        cerrarModal,
        handleGuardar,
        handleEliminar,
        opcionesAlertas,
        opcionesProductos,
        opcionesSecciones,
        opcionesFincas
    };
};