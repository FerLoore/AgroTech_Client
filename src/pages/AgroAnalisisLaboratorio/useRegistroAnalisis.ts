// ============================================================
// useRegistroAnalisis.ts
// Hook para el flujo de proceso "Registro de Análisis".
//
// Lógica:
//   - Carga alertas + análisis existentes + patógenos + árboles
//     en paralelo con Promise.all
//   - Filtra alertas a solo las activas (Pendiente / En análisis)
//     — excluye Dictaminadas (ya tienen análisis con fecha resultado)
//   - Alerta Pendiente   → crea un nuevo análisis (POST)
//   - Alerta En análisis → actualiza el análisis existente (PUT)
//   - Resultado Positivo → llama a updateArbol({ arb_estado: "Enfermo" })
//     El backend crea el AGRO_HISTORIAL automáticamente via trigger.
// ============================================================

import { useEffect, useState } from "react";
import {
    getAnalisisLaboratorio,
    createAnalisisLaboratorio,
    updateAnalisisLaboratorio,
    deleteAnalisisLaboratorio,
} from "../../api/agroAnalisisLaboratorio.api";
import { createCatalogoPatogeno } from "../../api/AgroCatalogoPatogeno.api";
import { getAlertas } from "../../api/AgroAlertaSalud.api";
import { getCatalogoPatogenos } from "../../api/AgroCatalogoPatogeno.api";
import { getArboles, updateArbol } from "../../api/AgroArbol.api";
import { getSurcos } from "../../api/AgroSurco.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";
import { getAgroFincas } from "../../api/AgroFinca.api";
import { toast } from "sonner";

// ── Tipos ────────────────────────────────────────────────────

export type EstadoAlertaActiva = "Pendiente" | "En análisis";

export interface AlertaActiva {
    alertsalud_id:      number;
    arb_arbol:          number;
    fecha_deteccion:    string;
    descripcion_sintoma: string;
    estado:             EstadoAlertaActiva;
    analisisExistente?: any;   // si estado="En análisis", tiene el análisis previo
}

const hoy = () => new Date().toISOString().split("T")[0];

const FORM_INICIAL = {
    analab_laboratorio_nombre:   "",
    catpato_catalogo_patogeno:   "",
    analab_fecha_envio:          hoy(),
    analab_fecha_resultado:      "",
    analab_resultado_tipo:       "",
};

// ── Hook ─────────────────────────────────────────────────────

export const useRegistroAnalisis = () => {

    const [alertas,    setAlertas]    = useState<any[]>([]);
    const [analisis,   setAnalisis]   = useState<any[]>([]);
    const [patogenos,  setPatogenos]  = useState<any[]>([]);
    const [arboles,    setArboles]    = useState<any[]>([]);
    const [surcos,     setSurcos]     = useState<any[]>([]);
    const [secciones,  setSecciones]  = useState<any[]>([]);
    const [fincas,     setFincas]     = useState<any[]>([]);

    const [filtroFinca, setFiltroFinca] = useState<string>("");

    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState("");
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    const [alertaSeleccionada, setAlertaSeleccionada] = useState<AlertaActiva | null>(null);
    const [analisisEditandoId, setAnalisisEditandoId] = useState<number | null>(null);
    const [form, setForm] = useState({ ...FORM_INICIAL });

    // ── Carga paralela ────────────────────────────────────────
    const cargarTodo = async () => {
        try {
            setLoading(true);
            setError("");

            const [alertasData, analisisData, patogenosData, arbolesData, surcosData, seccionesResp, fincasResp] = await Promise.all([
                getAlertas(),
                getAnalisisLaboratorio(),
                getCatalogoPatogenos(),
                getArboles(1, 2000),
                getSurcos(),
                getAgroSecciones(),
                getAgroFincas(),
            ]);

            setAlertas(Array.isArray(alertasData)  ? alertasData  : []);
            setAnalisis(Array.isArray(analisisData) ? analisisData : []);
            setPatogenos(Array.isArray(patogenosData) ? patogenosData : []);
            setArboles(Array.isArray(arbolesData) ? arbolesData : (arbolesData?.arboles || []));
            setSurcos(Array.isArray(surcosData) ? surcosData : (surcosData?.surcos || []));
            setSecciones(seccionesResp.data.secciones || []);
            setFincas(fincasResp.data.fincas || []);

        } catch (err: unknown) {
            setError("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarTodo(); }, []);

    // ── Alertas activas (Pendiente o En análisis) ─────────────
    // Se excluyen las Dictaminadas (analisis con fecha_resultado).
    const alertasActivas: AlertaActiva[] = alertas
        .map(a => {
            const analisisDeEsta = analisis.filter(
                an => Number(an.alert_alerta_salud) === Number(a.alertsalud_id)
            );
            // Si ya tiene resultado → Dictaminada → no mostrar
            if (analisisDeEsta.some(an => an.analab_fecha_resultado)) return null;

            const estado: EstadoAlertaActiva =
                analisisDeEsta.length === 0 ? "Pendiente" : "En análisis";

            return {
                alertsalud_id:       Number(a.alertsalud_id),
                arb_arbol:           Number(a.arb_arbol),
                fecha_deteccion:     String(a.fecha_deteccion ?? ""),
                descripcion_sintoma: String(a.descripcion_sintoma ?? "—"),
                estado,
                analisisExistente:   analisisDeEsta[0] ?? null,
            };
        })
        .filter(Boolean) as AlertaActiva[];

    // ── Helper: finca de un árbol ─────────────────────────────
    const fincaDeArbol = (arbId: number): string => {
        const arbol   = arboles.find(a => Number(a.arb_arbol) === Number(arbId));
        const surco   = arbol   ? surcos.find(s => Number(s.sur_surco) === Number(arbol.sur_surcos)) : null;
        const seccion = surco   ? secciones.find(s => Number(s.secc_seccion) === Number(surco.secc_secciones)) : null;
        const finca   = seccion ? fincas.find(f => Number(f.fin_finca) === Number(seccion.fin_finca)) : null;
        return finca?.fin_nombre ?? "";
    };

    // ── Alertas activas filtradas por finca ───────────────────
    const alertasActivasFiltradas = filtroFinca
        ? alertasActivas.filter(a => fincaDeArbol(a.arb_arbol) === filtroFinca)
        : alertasActivas;

    // ── Análisis filtrados por finca ──────────────────────────
    const analisisFiltrados = filtroFinca
        ? analisis.filter(an => {
            const alerta = alertas.find(a => Number(a.alertsalud_id) === Number(an.alert_alerta_salud));
            return alerta ? fincaDeArbol(Number(alerta.arb_arbol)) === filtroFinca : false;
        })
        : analisis;

    // ── Opciones de fincas ────────────────────────────────────
    const opcionesFincas = fincas.map(f => ({
        valor: f.fin_nombre as string,
        label: f.fin_nombre as string,
    }));

    // ── Info del árbol para la alerta seleccionada ────────────
    const arbolSeleccionado = alertaSeleccionada
        ? arboles.find(a => Number(a.arb_arbol) === Number(alertaSeleccionada.arb_arbol)) ?? null
        : null;

    // ── Opciones de selects ───────────────────────────────────
    const opcionesPatogenos = patogenos.map(p => ({
        valor: String(p.catpato_catalogo_patogeno),
        label: p.catpato_nombre_comun,
    }));

    // ── Seleccionar alerta de la lista ────────────────────────
    const seleccionarAlerta = (alerta: AlertaActiva) => {
        setAlertaSeleccionada(alerta);
        setFormError("");

        if (alerta.analisisExistente) {
            // Pre-cargar datos del análisis existente (modo actualizar)
            const toDate = (d: string) => d ? String(d).split("T")[0] : "";
            setForm({
                analab_laboratorio_nombre: alerta.analisisExistente.analab_laboratorio_nombre || "",
                catpato_catalogo_patogeno: String(alerta.analisisExistente.catpato_catalogo_patogeno || ""),
                analab_fecha_envio:        toDate(alerta.analisisExistente.analab_fecha_envio),
                analab_fecha_resultado:    toDate(alerta.analisisExistente.analab_fecha_resultado),
                analab_resultado_tipo:     alerta.analisisExistente.analab_resultado_tipo || "",
            });
        } else {
            // Formulario limpio con fecha de envío = hoy (modo crear)
            setForm({ ...FORM_INICIAL, analab_fecha_envio: hoy() });
        }
    };

    // ── Editar análisis desde la tabla ────────────────────────
    const editarAnalisis = (an: any) => {
        const toDate = (d: string) => d ? String(d).split("T")[0] : "";

        // Buscar la alerta activa primero; si es dictaminada, construirla desde alertas crudas
        let alerta = alertasActivas.find(
            a => Number(a.alertsalud_id) === Number(an.alert_alerta_salud)
        );
        if (!alerta) {
            const alertaRaw = alertas.find(
                a => Number(a.alertsalud_id) === Number(an.alert_alerta_salud)
            );
            if (alertaRaw) {
                alerta = {
                    alertsalud_id:       Number(alertaRaw.alertsalud_id),
                    arb_arbol:           Number(alertaRaw.arb_arbol),
                    fecha_deteccion:     String(alertaRaw.fecha_deteccion ?? ""),
                    descripcion_sintoma: String(alertaRaw.descripcion_sintoma ?? "—"),
                    estado:              "En análisis",
                    analisisExistente:   an,
                };
            }
        }

        if (alerta) setAlertaSeleccionada(alerta);
        setAnalisisEditandoId(Number(an.analab_analisis_laboratorio));
        setFormError("");
        setForm({
            analab_laboratorio_nombre: an.analab_laboratorio_nombre || "",
            catpato_catalogo_patogeno: String(an.catpato_catalogo_patogeno || ""),
            analab_fecha_envio:        toDate(an.analab_fecha_envio),
            analab_fecha_resultado:    toDate(an.analab_fecha_resultado),
            analab_resultado_tipo:     an.analab_resultado_tipo || "",
        });
    };

    // ── Guardar análisis ──────────────────────────────────────
    const handleGuardar = async (patogenoNombre?: string, patogenoTipo?: string) => {
        if (!alertaSeleccionada) {
            setFormError("Selecciona una alerta de la lista");
            return;
        }
        if (!form.analab_laboratorio_nombre.trim()) {
            setFormError("El nombre del laboratorio es requerido");
            return;
        }
        if (!form.analab_fecha_envio) {
            setFormError("La fecha de envío es requerida");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            // ── Crear patógeno nuevo si se proporcionó nombre ─
            let patogenoVal: number | null = form.catpato_catalogo_patogeno
                ? Number(form.catpato_catalogo_patogeno)
                : null;

            if (patogenoNombre?.trim()) {
                const nuevo = await createCatalogoPatogeno({
                    catpato_nombre_comun: patogenoNombre.trim(),
                    catpato_tipo:         patogenoTipo || "Hongo",
                    catpato_gravedad:     1,
                });
                if (!nuevo?.catpato_catalogo_patogeno) {
                    throw new Error("No se pudo crear el patógeno. Intenta de nuevo.");
                }
                patogenoVal = Number(nuevo.catpato_catalogo_patogeno);
                toast.success(`Patógeno "${patogenoNombre.trim()}" agregado al catálogo`);
            }

            if (analisisEditandoId) {
                // ── EDITAR desde tabla → siempre PUT ──────────
                await updateAnalisisLaboratorio(analisisEditandoId, {
                    analab_laboratorio_nombre:  form.analab_laboratorio_nombre,
                    analab_fecha_resultado:     form.analab_fecha_resultado || null,
                    analab_resultado_tipo:      form.analab_resultado_tipo  || null,
                    catpato_catalogo_patogeno:  patogenoVal,
                });
                toast.success("Análisis actualizado correctamente");

            } else if (alertaSeleccionada.estado === "Pendiente") {
                // ── CREAR análisis ────────────────────────────
                await createAnalisisLaboratorio({
                    analab_laboratorio_nombre:   form.analab_laboratorio_nombre,
                    analab_fecha_envio:          form.analab_fecha_envio,
                    analab_fecha_resultado:      form.analab_fecha_resultado || null,
                    analab_resultado_tipo:       form.analab_resultado_tipo  || null,
                    alert_alerta_salud:          alertaSeleccionada.alertsalud_id,
                    catpato_catalogo_patogeno:   patogenoVal,
                    usu_usuario: null,
                });
                toast.success("Análisis registrado correctamente");

            } else {
                // ── ACTUALIZAR análisis existente (vía alerta) ─
                await updateAnalisisLaboratorio(
                    alertaSeleccionada.analisisExistente.analab_analisis_laboratorio,
                    {
                        analab_laboratorio_nombre:  form.analab_laboratorio_nombre,
                        analab_fecha_resultado:     form.analab_fecha_resultado || null,
                        analab_resultado_tipo:      form.analab_resultado_tipo  || null,
                        catpato_catalogo_patogeno:  patogenoVal,
                    }
                );
                toast.success("Resultado registrado correctamente");
            }

            // ── Resultado Positivo → marcar árbol como Enfermo ─
            if (form.analab_resultado_tipo === "Positivo") {
                await updateArbol(alertaSeleccionada.arb_arbol, { arb_estado: "Enfermo" });
                toast.success(
                    `Árbol #${alertaSeleccionada.arb_arbol} marcado como Enfermo.`
                );
            }

            // Recargar datos y limpiar selección
            await cargarTodo();
            
            // Retornar datos para navegación si es necesario
            const result = {
                arbolId: alertaSeleccionada.arb_arbol,
                alertaId: alertaSeleccionada.alertsalud_id,
                resultado: form.analab_resultado_tipo
            };

            setAlertaSeleccionada(null);
            setAnalisisEditandoId(null);
            setForm({ ...FORM_INICIAL, analab_fecha_envio: hoy() });

            return result;

        } catch (err: any) {
            const mensaje = err?.message || "Error al guardar el análisis";
            setFormError(mensaje);
            toast.error(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    // ── Eliminar Análisis ─────────────────────────────────────
    const handleEliminar = (an: any) => {
        toast.warning(`¿Eliminar análisis #${an.analab_analisis_laboratorio}?`, {
            description: "Esta acción es irreversible y eliminará el registro de la base de datos.",
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        await deleteAnalisisLaboratorio(an.analab_analisis_laboratorio);
                        toast.success("Análisis eliminado correctamente");
                        await cargarTodo();
                    } catch (err: any) {
                        toast.error("Error al eliminar el análisis");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} }
        });
    };

    return {
        alertasActivas: alertasActivasFiltradas,
        analisis: analisisFiltrados,
        alertas,
        arboles,
        filtroFinca,
        setFiltroFinca,
        opcionesFincas,
        alertaSeleccionada,
        analisisEditandoId,
        seleccionarAlerta,
        editarAnalisis,
        arbolSeleccionado,
        opcionesPatogenos,
        form,
        setForm,
        guardando,
        formError,
        handleGuardar,
        handleEliminar,
        loading,
        error,
    };
};
