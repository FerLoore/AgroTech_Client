import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    getAlertas,
    createAlerta,
    updateAlerta,
    deleteAlerta
} from "../../api/AgroAlertaSalud.api";
import { getArboles, getArbolById } from "../../api/AgroArbol.api";
import { getSurcos } from "../../api/AgroSurco.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";
import { getAgroFincas } from "../../api/AgroFinca.api";
import { getAgroUsuarios } from "../../api/AgroUsuario.api";
import { getRoles } from "../../api/Agrorol.api";
import { getAnalisisLaboratorio } from "../../api/agroAnalisisLaboratorio.api";

import type { AlertaSalud, AlertaSaludFormData } from "./AgroAlertaSalud.types";
import { ALERTA_SALUD_FORM_INICIAL } from "./AgroAlertaSalud.types";
import { toast } from "sonner";

export type EstadoAlerta = "Pendiente" | "En análisis" | "Dictaminado";

export interface AlertaEnriquecida extends AlertaSalud {
    estado: EstadoAlerta;
    fin_nombre: string;
}

export const useAgroAlertaSalud = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    // ── Datos crudos ──────────────────────────────────────────
    const [alertas, setAlertas] = useState<AlertaSalud[]>([]);
    const [analisis, setAnalisis] = useState<any[]>([]);
    const [arboles, setArboles] = useState<any[]>([]);
    const [surcos, setSurcos] = useState<any[]>([]);
    const [secciones, setSecciones] = useState<any[]>([]);
    const [fincas, setFincas] = useState<any[]>([]);
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [roles,    setRoles]    = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // ── Filtros ───────────────────────────────────────────────
    const [filtroEstado, setFiltroEstado] = useState<EstadoAlerta | "">("");
    const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
    const [filtroFechaHasta, setFiltroFechaHasta] = useState("");
    const [filtroFinca, setFiltroFinca] = useState<string>("");

    // ── Estado del modal ──────────────────────────────────────
    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<AlertaSalud | null>(null);
    const [form, setForm] = useState<AlertaSaludFormData>(ALERTA_SALUD_FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    // ── Carga paralela con Promise.all ────────────────────────
    const cargarTodo = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                alertasData,
                analisisData,
                arbolesData,
                surcosData,
                seccionesResp,
                fincasResp,
                usuariosResp,
                rolesData,
            ] = await Promise.all([
                getAlertas(),
                getAnalisisLaboratorio(),
                getArboles(1, 2000),
                getSurcos(),
                getAgroSecciones(),
                getAgroFincas(),
                getAgroUsuarios(),
                getRoles(),
            ]);

            setAlertas(Array.isArray(alertasData) ? alertasData : []);
            setAnalisis(Array.isArray(analisisData) ? analisisData : []);
            const arrParam = searchParams.get("nuevoArbol");
            if (arrParam) {
                setSurcos(Array.isArray(surcosData) ? surcosData : (surcosData?.surcos || []));
                setSecciones(seccionesResp.data.secciones || []);
                setFincas(fincasResp.data.fincas || []);
                setUsuarios(usuariosResp.data.usuarios || []);
                setRoles(Array.isArray(rolesData) ? rolesData : []);

                const treeId = Number(arrParam);
                
                // 1. Verificar si el árbol ya está en la lista (generalmente solo vienen 100)
                let listaArboles = Array.isArray(arbolesData) ? arbolesData : (arbolesData?.arboles || []);
                const existe = listaArboles.some((a: any) => Number(a.arb_arbol) === treeId);

                // 2. Si no existe, traerlo individualmente
                if (!existe) {
                    try {
                        const arbolIndividual = await getArbolById(treeId);
                        if (arbolIndividual) {
                            listaArboles = [...listaArboles, arbolIndividual];
                        }
                    } catch (e) {
                        console.error("Error cargando árbol individual para pre-llenado", e);
                    }
                }

                setArboles(listaArboles);
                setEditando(null);
                setFormError("");
                setForm({
                    ...ALERTA_SALUD_FORM_INICIAL,
                    arb_arbol: treeId,
                });
                setModal(true);
                setSearchParams({});
            } else {
                setArboles(Array.isArray(arbolesData) ? arbolesData : (arbolesData?.arboles || []));
                setSurcos(Array.isArray(surcosData) ? surcosData : (surcosData?.surcos || []));
                setSecciones(seccionesResp.data.secciones || []);
                setFincas(fincasResp.data.fincas || []);
                setUsuarios(usuariosResp.data.usuarios || []);
                setRoles(Array.isArray(rolesData) ? rolesData : []);
            }

        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al cargar los datos";
            setError(mensaje);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarTodo();
    }, []);

    // ── Opciones para selects del formulario ──────────────────
    const opcionesArboles = arboles
        .filter(a => {
            // El árbol actual del formulario SIEMPRE debe estar disponible (para edición)
            if (form.arb_arbol && Number(a.arb_arbol) === Number(form.arb_arbol)) return true;
            
            if (!filtroFinca) return true;
            
            const surco   = surcos.find(s => Number(s.sur_surco) === Number(a.sur_surcos));
            const seccion = surco ? secciones.find(s => Number(s.secc_seccion) === Number(surco.secc_secciones)) : null;
            const finca   = seccion ? fincas.find(f => Number(f.fin_finca) === Number(seccion.fin_finca)) : null;
            
            return finca?.fin_nombre === filtroFinca;
        })
        .map(a => ({
            valor: String(a.arb_arbol),
            label: `Árbol #${a.arb_arbol} - Surco ${a.sur_surcos}`
        }));

    const ROLES_PERMITIDOS = new Set(["Supervisor de Campo", "Supervisor Seguimiento", "Laboratorista"]);

    const opcionesUsuarios = usuarios
        .filter(u => {
            const rol = roles.find((r: any) => Number(r.rol_rol) === Number(u.rol_rol));
            return rol && ROLES_PERMITIDOS.has(rol.rol_nombre);
        })
        .map(u => {
            const rol = roles.find((r: any) => Number(r.rol_rol) === Number(u.rol_rol));
            return {
                valor: String(u.usu_usuario),
                label: `${u.usu_nombre} — ${rol.rol_nombre}`,
            };
        });

    // ── Alertas enriquecidas: estado + nombre de finca ────────
    //
    // Estado inferido:
    //   Sin análisis              → 'Pendiente'
    //   Análisis sin fecha result → 'En análisis'
    //   Análisis con fecha result → 'Dictaminado'
    //
    // Finca resuelta por cadena:
    //   alerta.arb_arbol → arbol.sur_surcos → surco.secc_secciones
    //   → seccion.fin_finca → finca.fin_nombre
    const alertasEnriquecidas: AlertaEnriquecida[] = alertas.map(alerta => {
        const analisisDeEsta = analisis.filter(
            a => Number(a.alert_alerta_salud) === Number(alerta.alertsalud_id)
        );

        let estado: EstadoAlerta;
        if (analisisDeEsta.length === 0) {
            estado = "Pendiente";
        } else if (analisisDeEsta.some(a => a.analab_fecha_resultado)) {
            estado = "Dictaminado";
        } else {
            estado = "En análisis";
        }

        const arbol    = arboles.find(a => Number(a.arb_arbol) === Number(alerta.arb_arbol));
        const surco    = arbol   ? surcos.find(s => Number(s.sur_surco) === Number(arbol.sur_surcos)) : null;
        const seccion  = surco   ? secciones.find(s => Number(s.secc_seccion) === Number(surco.secc_secciones)) : null;
        const finca    = seccion ? fincas.find(f => Number(f.fin_finca) === Number(seccion.fin_finca)) : null;
        const fin_nombre = finca?.fin_nombre ?? "—";

        return { ...alerta, estado, fin_nombre } as AlertaEnriquecida;
    });

    // ── Filtrado ──────────────────────────────────────────────
    const alertasFiltradas = alertasEnriquecidas
        .filter(a => {
            if (filtroEstado && a.estado !== filtroEstado) return false;
            const fechaAlerta = String((a as any).fecha_deteccion ?? "").split("T")[0];
            if (filtroFechaDesde && fechaAlerta < filtroFechaDesde) return false;
            if (filtroFechaHasta && fechaAlerta > filtroFechaHasta) return false;
            if (filtroFinca && a.fin_nombre !== filtroFinca) return false;
            return true;
        })
        .sort((a, b) => b.alertsalud_id - a.alertsalud_id);

    // ── Modal ─────────────────────────────────────────────────
    const abrirCrear = () => {
        setEditando(null);
        setForm(ALERTA_SALUD_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (alerta: AlertaSalud) => {
        setEditando(alerta);
        const fecha = String((alerta as any).fecha_deteccion ?? "");
        setForm({
            alertsalud_fecha_deteccion:    fecha ? fecha.split("T")[0] : "",
            alertsalud_descripcion_sintoma: String((alerta as any).descripcion_sintoma ?? ""),
            alertsalud_foto:               String((alerta as any).foto ?? ""),
            arb_arbol:                     Number(alerta.arb_arbol ?? 0),
            usu_usuario:                   Number(alerta.usu_usuario ?? 0),
        });
        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    // ── Guardar ───────────────────────────────────────────────
    const handleGuardar = async () => {
        if (!form.alertsalud_fecha_deteccion) {
            setFormError("La fecha es requerida");
            return;
        }
        if (!form.arb_arbol) {
            setFormError("El árbol es requerido");
            return;
        }
        if (!form.usu_usuario) {
            setFormError("El usuario es requerido");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            const payload = {
                fecha_deteccion:    form.alertsalud_fecha_deteccion,
                descripcion_sintoma: form.alertsalud_descripcion_sintoma || undefined,
                foto:               form.alertsalud_foto || undefined,
                arb_arbol:          Number(form.arb_arbol),
                usu_usuario:        Number(form.usu_usuario),
            };

            if (editando) {
                await updateAlerta(editando.alertsalud_id, payload);
                toast.success("Alerta actualizada correctamente");
            } else {
                await createAlerta(payload);
                toast.success("Alerta creada exitosamente");
            }

            setModal(false);
            await cargarTodo();

        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al guardar alerta";
            setFormError(mensaje);
            toast.error(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    // ── Eliminar ──────────────────────────────────────────────
    const handleEliminar = (alerta: AlertaSalud) => {
        toast.warning(`¿Desactivar alerta #${alerta.alertsalud_id}?`, {
            description: "Esta acción desactivará la alerta del sistema.",
            action: {
                label: "Desactivar",
                onClick: async () => {
                    try {
                        await deleteAlerta(alerta.alertsalud_id);
                        await cargarTodo();
                        toast.success("Alerta desactivada correctamente");
                    } catch {
                        toast.error("Error al desactivar");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} }
        });
    };

    // ── Opciones de fincas para el filtro ────────────────────
    const opcionesFincas = fincas.map(f => f.fin_nombre as string).sort();

    return {
        alertasFiltradas,
        loading,
        error,
        filtroEstado,       setFiltroEstado,
        filtroFechaDesde,   setFiltroFechaDesde,
        filtroFechaHasta,   setFiltroFechaHasta,
        filtroFinca,        setFiltroFinca,
        opcionesFincas,
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
        opcionesArboles,
        opcionesUsuarios,
        recargar: cargarTodo,
    };
};
