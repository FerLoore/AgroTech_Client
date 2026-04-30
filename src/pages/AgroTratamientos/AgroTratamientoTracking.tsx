import { useState, useEffect, useMemo } from "react";
import { 
    Calendar, CheckCircle2, ChevronLeft, ChevronRight, ClipboardEdit, 
    TreePalm, AlertTriangle, Info
} from "lucide-react";
import { getAgroFincas } from "../../api/AgroFinca.api";
import { getArboles, updateArbol } from "../../api/AgroArbol.api";
import { getTratamientosByArbol, createTratamiento, updateTratamiento } from "../../api/AgroTratamientos.api";
import { getAlertas, getAlertasByArbol } from "../../api/AgroAlertaSalud.api";
import { getAnalisisLaboratorio, updateAnalisisLaboratorio } from "../../api/agroAnalisisLaboratorio.api";
import { getProductos } from "../../api/AgroProducto.api";
import { getSurcos } from "../../api/AgroSurco.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";
import { toast } from "sonner";
import "./TrackingCalendar.css";

const WEEKDAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

// Helpers para manejo seguro de fechas (evita desfase de zona horaria)
const stringToLocalDate = (dateStr: string) => {
    if (!dateStr) return null;
    // Si la fecha ya incluye una T (ISO), tomamos solo la parte de la fecha
    const baseDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const [year, month, day] = baseDate.split("-").map(Number);
    // Usamos el mediodía (12:00) para evitar que cambios de horario (DST) muevan la fecha
    return new Date(year, month - 1, day, 12, 0, 0);
};

const localDateToString = (date: Date | string) => {
    if (!date) return "";
    
    // Si es un string, simplemente extraemos la parte de la fecha (YYYY-MM-DD)
    if (typeof date === "string") {
        return date.split("T")[0];
    }

    // Si es un objeto Date y representa exactamente la medianoche UTC (00:00:00.000Z),
    // es casi seguro que proviene de un campo "solo fecha" del servidor.
    try {
        const iso = date.toISOString();
        if (iso.endsWith("T00:00:00.000Z")) {
            return iso.split("T")[0];
        }
    } catch (e) {
        // Ignorar si isOString falla (date inválida)
    }

    // Para cualquier otro caso (como 'new Date()'), usamos los componentes locales
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const AgroTratamientoTracking = () => {
    // Selección
    const [fincas, setFincas] = useState<any[]>([]);
    const [arboles, setArboles] = useState<any[]>([]);
    const [selectedFinca, setSelectedFinca] = useState("");
    const [selectedArbol, setSelectedArbol] = useState("");

    // Datos del árbol
    const [tratamientos, setTratamientos] = useState<any[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [analisis, setAnalisis] = useState<any[]>([]);
    const [, setLoadingData] = useState(false);

    // Calendario
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);

    // Dictamen
    const [dictamenForm, setDictamenForm] = useState({
        estado: "",
        notas: ""
    });
    const [isSavingDictamen, setIsSavingDictamen] = useState(false);
    const [dictamenGuardado, setDictamenGuardado] = useState<any>(null);
    
    // Nuevo Flujo: Registro de Resultado y Receta
    const [productos, setProductos] = useState<any[]>([]);
    const [recipeStep, setRecipeStep] = useState<0 | 1 | 2>(0);
    const [selectedAnas, setSelectedAnas] = useState<any>(null);


    const [recipeForm, setRecipeForm] = useState({
        resultado: "", // Positivo | Negativo
        producto: "",
        tipo_aplicacion: "",
        frecuencia: "cada 7 días",
        dosis: "",
        unidad: "",
        num_aplicaciones: 1,
        fecha_inicio: localDateToString(new Date()),
        fecha_fin: "",
        notas: ""
    });
    const [isSavingRecipe, setIsSavingRecipe] = useState(false);
    const [showCustomFreqInput, setShowCustomFreqInput] = useState(false);

    // Selección automática de unidad según producto
    useEffect(() => {
        if (!recipeForm.producto) return;
        const prod = productos.find(p => String(p.produ_producto) === String(recipeForm.producto));
        if (prod && prod.produ_unidad) {
            setRecipeForm(prev => ({ ...prev, unidad: prod.produ_unidad }));
        }
    }, [recipeForm.producto, productos]);

    const INITIAL_RECIPE_FORM = {
        resultado: "",
        producto: "",
        tipo_aplicacion: "",
        frecuencia: "cada 7 días",
        dosis: "",
        unidad: "",
        num_aplicaciones: 1,
        fecha_inicio: localDateToString(new Date()),
        fecha_fin: "",
        notas: ""
    };

    const resetRecipeFlow = () => {
        setRecipeStep(0);
        setSelectedAnas(null);
        setRecipeForm(INITIAL_RECIPE_FORM);
    };

    // Cargar fincas al inicio
    useEffect(() => {
        const fetchFincas = async () => {
            try {
                const res = await getAgroFincas();
                setFincas(res?.data?.fincas || []);
            } catch (err) {
                console.error("Error al cargar fincas:", err);
            }
        };

        const fetchProductos = async () => {
            try {
                const res = await getProductos();
                setProductos(res || []);
            } catch (err) {
                console.error("Error al cargar productos:", err);
            }
        };

        fetchFincas();
        fetchProductos();
    }, []);

    // Lógica para auto-seleccionar Arbol desde Laboratorio (Handoff)
    useEffect(() => {
        const checkPending = async () => {
            const pendingStr = localStorage.getItem("agro_pending_recipe");
            if (!pendingStr) return;

            try {
                const pending = JSON.parse(pendingStr);
                // Si pasaron más de 1 minuto, ignorar (evitar bucles infinitos por error)
                if (Date.now() - pending.timestamp > 60000) {
                    localStorage.removeItem("agro_pending_recipe");
                    return;
                }

                // 1. Encontrar la finca de este árbol para poder cargarlo
                const [resArboles, resSurcos, resSecciones] = await Promise.all([
                    getArboles(1, 4000), // Usar un rango amplio
                    getSurcos(),
                    getAgroSecciones()
                ]);

                const arbolesTodos = resArboles?.arboles || [];
                const arbol = arbolesTodos.find((a: any) => Number(a.arb_arbol) === Number(pending.arbolId));
                
                if (arbol) {
                    const surcosTodos = resSurcos?.surcos || (Array.isArray(resSurcos) ? resSurcos : []);
                    const surco = surcosTodos.find((s: any) => Number(s.sur_surco) === Number(arbol.sur_surcos));
                    
                    const seccionesTodas = (resSecciones as any)?.data?.secciones || [];
                    const seccion = surco ? seccionesTodas.find((s: any) => Number(s.secc_seccion) === Number(surco.secc_secciones)) : null;

                    if (seccion) {
                        setSelectedFinca(String(seccion.fin_finca));
                        setTimeout(() => setSelectedArbol(String(pending.arbolId)), 500);
                    }
                }
            } catch (err) {
                console.error("Error en handoff desde laboratorio:", err);
            }
        };
        checkPending();
    }, []);

    // Cargar árboles cuando cambia la finca
    useEffect(() => {
        if (!selectedFinca) {
            setArboles([]);
            setSelectedArbol("");
            return;
        }

        const fetchArboles = async () => {
            try {
                // 1. Obtener datos maestros necesarios para el filtro
                const [resArboles, resAlertas, resAnalisis, resSurcos, resSecciones] = await Promise.all([
                    getArboles(1, 2000),
                    getAlertas(),
                    getAnalisisLaboratorio(),
                    getSurcos(),
                    getAgroSecciones()
                ]);

                const todosLosArboles = resArboles?.arboles || [];
                const todasLasAlertas = Array.isArray(resAlertas) ? resAlertas : [];
                const todosLosAnalisis = Array.isArray(resAnalisis) ? resAnalisis : [];
                const todosLosSurcos = resSurcos?.surcos || (Array.isArray(resSurcos) ? resSurcos : []);
                const todasLasSecciones = (resSecciones as any)?.data?.secciones || [];

                // 2. Filtrar árboles que tienen al menos un análisis de laboratorio Y pertenecen a la finca
                const arbolesConDictamen = todosLosArboles.filter((arbol: any) => {
                    // a. Verificar Finca
                    const surco = todosLosSurcos.find((s: any) => Number(s.sur_surco) === Number(arbol.sur_surcos));
                    const seccion = surco ? todasLasSecciones.find((s: any) => Number(s.secc_seccion) === Number(surco.secc_secciones)) : null;
                    const esDeFinca = seccion && String(seccion.fin_finca) === String(selectedFinca);

                    if (!esDeFinca) return false;

                    // b. Verificar si alguna alerta tiene análisis
                    const alertasDelArbol = todasLasAlertas.filter((al: any) => Number(al.arb_arbol) === Number(arbol.arb_arbol));
                    return alertasDelArbol.some((al: any) =>
                        todosLosAnalisis.some((an: any) => Number(an.alert_alerta_salud) === Number(al.alertsalud_id))
                    );
                });

                setArboles(arbolesConDictamen);
            } catch (err) {
                console.error("Error al cargar árboles filtrados:", err);
            }
        };
        fetchArboles();
    }, [selectedFinca]);

    // Cargar datos cuando cambia el árbol
    useEffect(() => {
        if (!selectedArbol) {
            setTratamientos([]);
            setAlertas([]);
            setAnalisis([]);
            return;
        }

        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [trataRes, alertRes, analRes] = await Promise.all([
                    getTratamientosByArbol(Number(selectedArbol)),
                    getAlertasByArbol(Number(selectedArbol)),
                    getAnalisisLaboratorio()
                ]);

                setTratamientos(Array.isArray(trataRes) ? trataRes : []);
                setAlertas(Array.isArray(alertRes) ? alertRes : []);
                setAnalisis(Array.isArray(analRes) ? analRes : []);

                // Buscar si ya hay un dictamen para el tratamiento actual
                // (Simulado: si el tratamiento de este árbol ya está finalizado, mostramos el card)
                const trataFinalizado = trataRes.find((t: any) => t.trata_estado === "Finalizado");
                if (trataFinalizado) {
                    setDictamenGuardado({
                        estado: "Finalizado", // O el estado del árbol
                        notas: trataFinalizado.trata_observaciones
                    });
                } else {
                    setDictamenGuardado(null);
                }

                // --- Lógica de Auto-apertura de Receta (Handoff) ---
                const pendingStr = localStorage.getItem("agro_pending_recipe");
                if (pendingStr) {
                    try {
                        const pending = JSON.parse(pendingStr);
                        if (Number(pending.arbolId) === Number(selectedArbol)) {
                            const analisisTodos = Array.isArray(analRes) ? analRes : [];
                            const anas = analisisTodos.find((an: any) => 
                                Number(an.alert_alerta_salud) === Number(pending.alertaId)
                            );
                            
                            if (anas) {
                                // Seleccionar el día para que los detalles se vean
                                const fecha = anas.analab_fecha_resultado || anas.analab_fecha_envio;
                                if (fecha) {
                                    const dateObj = stringToLocalDate(fecha);
                                    if (dateObj) setSelectedDay(dateObj);
                                }
                                
                                // Iniciar flujo de receta (Paso 2 si ya es positivo)
                                handleOpenResultFlow(anas);
                                toast.info("Generando receta para árbol seleccionado...");
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing pending recipe:", e);
                    } finally {
                        localStorage.removeItem("agro_pending_recipe");
                    }
                }

            } catch (err) {
                console.error("Error al cargar datos del árbol:", err);
                toast.error("Error al cargar datos del seguimiento");
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [selectedArbol]);

    // Lógica de Calendario
    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const aplicacionesProyectadas = useMemo(() => {
        if (!recipeForm.fecha_inicio || recipeStep !== 2) return [];

        const start = stringToLocalDate(recipeForm.fecha_inicio);
        if (!start) return [];
        const dates = [localDateToString(start)];
        
        if (recipeForm.frecuencia === "una vez") return dates;

        const end = recipeForm.fecha_fin ? stringToLocalDate(recipeForm.fecha_fin) : null;
        if (!end) return dates;

        let interval = 0;
        if (recipeForm.frecuencia === "cada 7 días") interval = 7;
        else if (recipeForm.frecuencia === "cada 14 días") interval = 14;
        else if (recipeForm.frecuencia === "cada 21 días") interval = 21;
        else if (recipeForm.frecuencia === "mensual") interval = 30;
        else {
            const match = recipeForm.frecuencia.match(/(\d+)/);
            if (match) interval = parseInt(match[0]);
        }

        if (interval <= 0) return dates;

        let current = new Date(start);
        while (true) {
            current.setDate(current.getDate() + interval);
            if (current > end) break;
            dates.push(localDateToString(current));
            if (dates.length > 100) break; // Límite
        }

        return dates;
    }, [recipeForm.fecha_inicio, recipeForm.fecha_fin, recipeForm.frecuencia, recipeStep]);

    // Reporte de Stock Proyectado
    const stockReport = useMemo(() => {
        if (!recipeForm.producto || !recipeForm.dosis || recipeStep !== 2) return null;
        
        const prod = productos.find(p => String(p.produ_producto) === String(recipeForm.producto));
        if (!prod) return null;

        const totalDose = Number(recipeForm.dosis) * aplicacionesProyectadas.length;
        const stockActual = Number(prod.produ_stock_actual || 0);
        const esSuficiente = stockActual >= totalDose;
        const faltante = totalDose - stockActual;

        return {
            totalDose,
            stockActual,
            esSuficiente,
            faltante,
            unidad: recipeForm.unidad
        };
    }, [recipeForm.producto, recipeForm.dosis, recipeForm.unidad, aplicacionesProyectadas, recipeStep, productos]);

    // Auxiliar para parsear frecuencia de observaciones guardadas
    const parseIntervalFromObs = (obs: string): number | null => {
        if (!obs) return null;
        // Buscar patrón ", cada X días," o ", mensual," o ", una vez,"
        const match = obs.match(/, ([^,]+), por un total de/);
        if (!match) return null;

        const freqStr = match[1].toLowerCase();
        if (freqStr.includes("una vez")) return 9999; // Representa que solo ocurre en fecha_inicio
        if (freqStr.includes("mensual")) return 30;
        
        const numMatch = freqStr.match(/(\d+)/);
        if (numMatch) return parseInt(numMatch[0]);

        return null;
    };

    const monthData = useMemo(() => {
        const totalDays = daysInMonth(currentDate);
        const startOffset = firstDayOfMonth(currentDate);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const hoyStr = localDateToString(new Date());

        const cells = [];
        // Celdas vacías al inicio
        for (let i = 0; i < startOffset; i++) {
            cells.push({ day: null });
        }
        // Días del mes
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const isToday = dateStr === hoyStr;
            const cellDate = new Date(year, month, d, 12, 0, 0);

            // Buscar eventos
            const dayEvents = [];

            // 1. Tratamientos (Amber)
            const activeTrata = tratamientos.find(t => {
                const inicioStr = localDateToString(t.trata_fecha_inicio);
                const finStr = t.trata_fecha_fin ? localDateToString(t.trata_fecha_fin) : null;
                
                // Rango básico
                const inRange = finStr ? (dateStr >= inicioStr && dateStr <= finStr) : (dateStr === inicioStr);
                if (!inRange) return false;

                // Filtrar por frecuencia si existe en observaciones
                const interval = parseIntervalFromObs(t.trata_observaciones || "");
                if (interval === null) return true; // Si no hay freq, mostrar bloque sólido por defecto (retrocompatibilidad)
                if (interval === 9999) return dateStr === inicioStr;

                // Calcular diferencia de días desde el inicio para ver si "cae" en este intervalo
                const startD = stringToLocalDate(inicioStr);
                const currentD = stringToLocalDate(dateStr);
                if (!startD || !currentD) return false;

                const diffTime = Math.abs(currentD.getTime() - startD.getTime());
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                return diffDays % interval === 0;
            });
            if (activeTrata) {
                dayEvents.push({ type: "pending", label: "Tratamiento", data: activeTrata });
            }

            // 2. Alertas (Red)
            const dayAlerts = alertas.filter(a => localDateToString(a.fecha_deteccion) === dateStr);
            dayAlerts.forEach(a => {
                dayEvents.push({ type: "critical", label: "Alerta", data: a });
            });

            // 3. Revisiones/Análisis (Green)
            const dayAnalisis = analisis.filter(an => {
                const alerta = alertas.find(a => Number(a.alertsalud_id) === Number(an.alert_alerta_salud));
                return alerta && localDateToString(an.analab_fecha_resultado || an.analab_fecha_envio) === dateStr;
            });
            dayAnalisis.forEach(an => {
                dayEvents.push({ type: "revision", label: "Análisis Lab", data: an });
            });

            // 4. Proyecciones de Receta (Dashed style)
            if (aplicacionesProyectadas.includes(dateStr)) {
                dayEvents.push({ type: "projection", label: "Aplicación", data: null });
            }

            // Día de cierre (Amber background)
            const isClosingDay = tratamientos.some(t => t.trata_fecha_fin && localDateToString(t.trata_fecha_fin) === dateStr);

            cells.push({
                day: d,
                date: cellDate,
                events: dayEvents,
                isClosingDay,
                isToday
            });
        }
        return cells;
    }, [currentDate, tratamientos, alertas, analisis, aplicacionesProyectadas, recipeForm.fecha_inicio, recipeForm.fecha_fin]);

    const activeTreatment = useMemo(() => {
        return tratamientos.find((t: any) => t.trata_estado === "En curso");
    }, [tratamientos]);

    const daysRemaining = useMemo(() => {
        if (!activeTreatment || !activeTreatment.trata_fecha_fin) return null;
        const fin = stringToLocalDate(activeTreatment.trata_fecha_fin);
        const hoy = new Date();
        if (!fin) return null;
        
        hoy.setHours(0, 0, 0, 0);
        fin.setHours(0, 0, 0, 0);

        const diff = fin.getTime() - hoy.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [activeTreatment]);

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
        setSelectedDay(null);
    };

    const handleSaveDictamen = async () => {
        if (!dictamenForm.estado) {
            toast.error("Seleccione un estado");
            return;
        }

        setIsSavingDictamen(true);
        try {
            // 1. Actualizar el árbol
            await updateArbol(Number(selectedArbol), {
                arb_estado: dictamenForm.estado
            });

            // 2. Finalizar el tratamiento si existe
            if (activeTreatment) {
                await updateTratamiento(activeTreatment.trata_tratamientos, {
                    trata_estado: "Finalizado",
                    trata_observaciones: dictamenForm.notas
                });
            }

            setDictamenGuardado({ ...dictamenForm });
            toast.success("Dictamen guardado correctamente");

            // Recargar datos
            const trataRes = await getTratamientosByArbol(Number(selectedArbol));
            setTratamientos(Array.isArray(trataRes) ? trataRes : []);
        } catch (err) {
            toast.error("Error al guardar el dictamen");
        } finally {
            setIsSavingDictamen(false);
        }
    };

    const handleEditDictamen = () => {
        setDictamenGuardado(null);
        setDictamenForm({
            estado: dictamenGuardado.estado,
            notas: dictamenGuardado.notas
        });
    };

    // Lógica de Receta
    const recipeSummary = useMemo(() => {
        if (!recipeForm.resultado || recipeForm.resultado === "Negativo") return "";
        const prod = productos.find(p => String(p.produ_producto) === String(recipeForm.producto));
        const prodNombre = prod ? prod.produ_nombre : "[Producto]";
        
        return `Se aplicará ${prodNombre} mediante ${recipeForm.tipo_aplicacion} a una dosis de ${recipeForm.dosis}${recipeForm.unidad}, ${recipeForm.frecuencia}, por un total de ${recipeForm.num_aplicaciones} aplicaciones. Inicia el ${recipeForm.fecha_inicio} y finaliza estimado el ${recipeForm.fecha_fin || "---"}.`;
    }, [recipeForm, productos]);

    const handleOpenResultFlow = (anas: any) => {
        setSelectedAnas(anas);
        setShowCustomFreqInput(false);
        if (anas.analab_resultado_tipo === "Positivo") {
            setRecipeForm({ ...INITIAL_RECIPE_FORM, resultado: "Positivo" });
            setRecipeStep(2);
        } else {
            setRecipeStep(1);
        }
    };

    const handleSaveRecipe = async () => {
        if (recipeForm.resultado === "Positivo") {
            if (!recipeForm.producto || !recipeForm.dosis || !recipeForm.num_aplicaciones) {
                toast.error("Complete los campos de la receta");
                return;
            }
        }

        setIsSavingRecipe(true);
        try {
            // 1. Actualizar Análisis
            await updateAnalisisLaboratorio(selectedAnas.analab_analisis_laboratorio, {
                analab_resultado_tipo: recipeForm.resultado,
                analab_fecha_resultado: localDateToString(new Date())
            });

            // 2. Si es positivo, crear tratamiento
            if (recipeForm.resultado === "Positivo") {
                const fullObs = `RECETA GENERADA: ${recipeSummary}\nNotas: ${recipeForm.notas}`;
                await createTratamiento({
                    trata_fecha_inicio: recipeForm.fecha_inicio,
                    trata_fecha_fin: recipeForm.fecha_fin || undefined,
                    trata_estado: "En curso",
                    trata_dosis: `${recipeForm.dosis} ${recipeForm.unidad}`,
                    trata_observaciones: fullObs,
                    alertsalu_alerta_salud: selectedAnas.alert_alerta_salud,
                    produ_producto: Number(recipeForm.producto)
                });
            }
            
            toast.success("Información guardada correctamente");
            resetRecipeFlow();
            
            // Recargar datos
            const [trataRes, alertRes, analRes] = await Promise.all([
                getTratamientosByArbol(Number(selectedArbol)),
                getAlertasByArbol(Number(selectedArbol)),
                getAnalisisLaboratorio()
            ]);
            setTratamientos(Array.isArray(trataRes) ? trataRes : []);
            setAlertas(Array.isArray(alertRes) ? alertRes : []);
            setAnalisis(Array.isArray(analRes) ? analRes : []);

        } catch (err) {
            console.error("Error al guardar receta:", err);
            toast.error("Error al procesar la solicitud");
        } finally {
            setIsSavingRecipe(false);
        }
    };

    const renderBanner = () => {
        if (!activeTreatment) return null;

        let message = "";
        const remaining = daysRemaining;

        if (remaining === null) {
            message = "Tratamiento en curso (sin fecha de cierre definida)";
        } else if (remaining > 0) {
            message = `Faltan ${remaining} día${remaining === 1 ? "" : "s"} para que termine el tratamiento`;
        } else if (remaining === 0) {
            message = "El tratamiento vence HOY";
        } else {
            message = `El tratamiento venció hace ${Math.abs(remaining)} día${Math.abs(remaining) === 1 ? "" : "s"}`;
        }

        return (
            <div className="status-banner">
                <AlertTriangle size={20} />
                <span>{message}</span>
            </div>
        );
    };

    const renderDetailSidebar = () => {
        if (!selectedDay) {
            return (
                <div className="details-sidebar">
                    <div className="empty-state">
                        <Calendar size={48} />
                        <p>Selecciona un día del calendario para ver los detalles</p>
                    </div>
                </div>
            );
        }

        const dateStr = localDateToString(selectedDay);
        const dayCell = monthData.find(c => c.day && c.date && localDateToString(c.date) === dateStr);
        const events = dayCell?.events || [];
        const isClosingDate = dayCell?.isClosingDay;

        return (
            <div className="details-sidebar">
                <h3 className="sidebar-title">Detalles del Día</h3>
                <p className="sidebar-date">{selectedDay.toLocaleDateString("es-ES", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {events.length === 0 ? (
                        <p style={{ fontSize: "14px", color: "#9ca3af" }}>No hay eventos registrados para este día.</p>
                    ) : (
                        events.map((ev, idx) => (
                            <div key={idx} className={`confirm-card`} style={{
                                background: ev.type === "revision" ? "#f0fdf4" : ev.type === "critical" ? "#fef2f2" : "#fffbeb",
                                borderColor: ev.type === "revision" ? "#bbf7d0" : ev.type === "critical" ? "#fecaca" : "#fef3c7"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    {ev.type === "revision" ? <CheckCircle2 size={16} color="#16a34a" /> :
                                        ev.type === "critical" ? <AlertTriangle size={16} color="#dc2626" /> :
                                            <Info size={16} color="#d97706" />}
                                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{ev.label}</span>
                                </div>
                                <div style={{ fontSize: "13px", color: "#4b5563", marginTop: "4px" }}>
                                    {ev.type === "pending" && (
                                        <>
                                            <div style={{ fontWeight: 600, color: "#92400e", marginBottom: "4px" }}>
                                                ID: {ev.data.trata_tratamientos} - {ev.data.trata_estado}
                                            </div>
                                            {(() => {
                                                const prod = productos.find(p => String(p.produ_producto) === String(ev.data.produ_producto));
                                                return (
                                                    <div style={{ background: "rgba(255,255,255,0.5)", padding: "6px", borderRadius: "4px", border: "1px solid #fef3c7" }}>
                                                        <p style={{ margin: "2px 0" }}><strong>Producto:</strong> {prod?.produ_nombre || "---"}</p>
                                                        <p style={{ margin: "2px 0" }}><strong>Dosis:</strong> {ev.data.trata_dosis}</p>
                                                        {ev.data.trata_observaciones && (
                                                            <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#6b7280", fontStyle: "italic", lineHeight: "1.3" }}>
                                                                {ev.data.trata_observaciones.replace("RECETA GENERADA: ", "")}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                    {ev.type === "critical" && `ID: ${ev.data.alertsalud_id} - ${ev.data.descripcion_sintoma || "Alerta detectada"}`}
                                    {ev.type === "revision" && `${ev.data.analab_laboratorio_nombre} - ${ev.data.analab_resultado_tipo || "Pendiente"}`}
                                </div>
                                {ev.type === "revision" && (
                                    (() => {
                                        // Verificar si ya existe un tratamiento para esta alerta
                                        const tieneTratamiento = tratamientos.some(t => Number(t.alertsalu_alerta_salud) === Number(ev.data.alert_alerta_salud));
                                        const sinResultado = !ev.data.analab_resultado_tipo;
                                        const positivoSinTrata = ev.data.analab_resultado_tipo === "Positivo" && !tieneTratamiento;

                                        if (sinResultado) {
                                            return (
                                                <button 
                                                    className="btn-action-small" 
                                                    style={{ marginTop: "8px", width: "100%", padding: "6px", fontSize: "12px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer" }}
                                                    onClick={() => handleOpenResultFlow(ev.data)}
                                                >
                                                    Registrar Resultado
                                                </button>
                                            );
                                        }
                                        
                                        if (positivoSinTrata) {
                                            return (
                                                <button 
                                                    className="btn-action-small" 
                                                    style={{ marginTop: "8px", width: "100%", padding: "6px", fontSize: "12px", background: "#dcfce7", border: "1px solid #86efac", color: "#166534", borderRadius: "6px", cursor: "pointer" }}
                                                    onClick={() => handleOpenResultFlow(ev.data)}
                                                >
                                                    Crear Receta
                                                </button>
                                            );
                                        }

                                        return null;
                                    })()
                                )}
                            </div>
                        ))
                    )}
                </div>

                {isClosingDate && (
                    <div style={{ marginTop: "24px", borderTop: "1px solid #e5e7eb", paddingTop: "24px" }}>
                        <h4 className="sidebar-title" style={{ fontSize: "15px", marginBottom: "12px" }}>Dictamen de Cierre</h4>

                        {dictamenGuardado ? (
                            <div className="confirm-card">
                                <CheckCircle2 size={24} color="#16a34a" />
                                <div style={{ fontWeight: 600 }}>Cierre Registrado</div>
                                <p style={{ fontSize: "13px" }}><strong>Estado:</strong> {dictamenGuardado.estado}</p>
                                {dictamenGuardado.notas && <p style={{ fontSize: "13px" }}><strong>Notas:</strong> {dictamenGuardado.notas}</p>}
                                <button className="btn-edit" onClick={handleEditDictamen}>Editar dictamen</button>
                            </div>
                        ) : (
                            <div className="dictamen-form">
                                <div className="form-group">
                                    <label className="form-label">Estado Final del Árbol</label>
                                    <select
                                        className="form-select"
                                        value={dictamenForm.estado}
                                        onChange={e => setDictamenForm({ ...dictamenForm, estado: e.target.value })}
                                    >
                                        <option value="">Seleccione...</option>
                                        <option value="Crecimiento">Crecimiento</option>
                                        <option value="Produccion">Producción</option>
                                        <option value="Enfermo">Enfermo</option>
                                        <option value="Muerto">Muerto</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notas Adicionales</label>
                                    <textarea
                                        className="form-textarea"
                                        placeholder="Describa el resultado del tratamiento..."
                                        value={dictamenForm.notas}
                                        onChange={e => setDictamenForm({ ...dictamenForm, notas: e.target.value })}
                                    />
                                </div>
                                <button
                                    className="btn-save"
                                    onClick={handleSaveDictamen}
                                    disabled={isSavingDictamen}
                                >
                                    {isSavingDictamen ? "Guardando..." : "Guardar Dictamen"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {recipeStep > 0 && (
                    <div style={{ marginTop: "24px", borderTop: "2px solid #e5e7eb", paddingTop: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h4 className="sidebar-title" style={{ margin: 0 }}>Registro de Análisis</h4>
                            <span style={{ fontSize: "12px", color: "#6b7280" }}>Paso {recipeStep} de 2</span>
                        </div>

                        {recipeStep === 1 ? (
                            <div className="flow-step">
                                <p style={{ fontSize: "14px", marginBottom: "12px", fontWeight: 500 }}>¿Cuál fue el resultado del análisis?</p>
                                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                                    <button 
                                        onClick={() => {
                                            setRecipeForm({ ...recipeForm, resultado: "Positivo" });
                                            setRecipeStep(2);
                                        }}
                                        style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1.5px solid", cursor: "pointer", background: "#fff", borderColor: "#e5e7eb", color: "#374151" }}
                                    >
                                        Positivo
                                    </button>
                                    <button 
                                        onClick={() => setRecipeForm({ ...recipeForm, resultado: "Negativo" })}
                                        style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1.5px solid", cursor: "pointer", background: recipeForm.resultado === "Negativo" ? "#f0fdf4" : "#fff", borderColor: recipeForm.resultado === "Negativo" ? "#22c55e" : "#e5e7eb", color: recipeForm.resultado === "Negativo" ? "#15803d" : "#374151" }}
                                    >
                                        Negativo
                                    </button>
                                </div>
                                {recipeForm.resultado === "Negativo" && (
                                    <button className="btn-save" style={{ width: "100%", marginBottom: "8px" }} onClick={handleSaveRecipe}>
                                        Confirmar Resultado Negativo
                                    </button>
                                )}
                                <button className="btn-edit" style={{ width: "100%", textAlign: "center", marginTop: 0 }} onClick={resetRecipeFlow}>Cancelar</button>
                            </div>
                        ) : (
                            <div className="flow-step">
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                                    <div className="form-group">
                                        <label className="form-label">Fecha Inicio</label>
                                        <input type="date" className="form-select" value={recipeForm.fecha_inicio} onChange={e => setRecipeForm({ ...recipeForm, fecha_inicio: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Fecha Fin (Est.)</label>
                                        <input type="date" className="form-select" value={recipeForm.fecha_fin} onChange={e => setRecipeForm({ ...recipeForm, fecha_fin: e.target.value })} />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: "12px" }}>
                                    <label className="form-label">Producto Recomendado</label>
                                    <select className="form-select" value={recipeForm.producto} onChange={e => setRecipeForm({ ...recipeForm, producto: e.target.value })}>
                                        <option value="">Seleccione...</option>
                                        {productos.map(p => (
                                            <option key={p.produ_producto} value={p.produ_producto}>{p.produ_nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                                    <div className="form-group">
                                        <label className="form-label">Aplicación</label>
                                        <input 
                                            type="text" 
                                            className="form-select" 
                                            placeholder="Ej. Aspersión, Riego, Foliar..."
                                            value={recipeForm.tipo_aplicacion} 
                                            onChange={e => setRecipeForm({ ...recipeForm, tipo_aplicacion: e.target.value })} 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Dosis y Unidad</label>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                            <input type="text" className="form-select" placeholder="Can." style={{ width: "60px" }} value={recipeForm.dosis} onChange={e => setRecipeForm({ ...recipeForm, dosis: e.target.value })} />
                                            {recipeForm.producto && (
                                                <div style={{ display: "flex", alignItems: "center", padding: "0 10px", background: "#f3f4f6", borderRadius: "4px", fontSize: "14px", border: "1px solid #d1d5db", color: "#4b5563", fontWeight: 600 }}>
                                                    {recipeForm.unidad}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: "12px" }}>
                                    <label className="form-label">Frecuencia</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: showCustomFreqInput ? "8px" : "0" }}>
                                        {["cada 7 días", "cada 14 días", "cada 21 días", "mensual", "una vez"].map(f => (
                                            <button 
                                                key={f}
                                                onClick={() => {
                                                    setRecipeForm({ ...recipeForm, frecuencia: f });
                                                    setShowCustomFreqInput(false);
                                                }}
                                                style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "100px", border: "1px solid", cursor: "pointer", background: recipeForm.frecuencia === f ? "#2d6a4f" : "#fff", color: recipeForm.frecuencia === f ? "#fff" : "#4b5563", borderColor: recipeForm.frecuencia === f ? "#2d6a4f" : "#d1d5db" }}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => setShowCustomFreqInput(!showCustomFreqInput)}
                                            style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "100px", border: showCustomFreqInput ? "1px solid #2d6a4f" : "1px dashed #d1d5db", cursor: "pointer", color: showCustomFreqInput ? "#2d6a4f" : "#6b7280", background: "#fff" }}
                                        >
                                            {showCustomFreqInput ? "Cerrar" : "Personalizado..."}
                                        </button>
                                    </div>
                                    {showCustomFreqInput && (
                                        <input 
                                            type="text" 
                                            className="form-select" 
                                            placeholder="Especifique frecuencia (ej: cada 3 días)"
                                            style={{ marginTop: "4px" }}
                                            value={recipeForm.frecuencia}
                                            onChange={e => setRecipeForm({ ...recipeForm, frecuencia: e.target.value })}
                                            autoFocus
                                        />
                                    )}
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                                    <div className="form-group">
                                        <label className="form-label">Num. Aplicaciones</label>
                                        <input type="number" className="form-select" value={recipeForm.num_aplicaciones} onChange={e => setRecipeForm({ ...recipeForm, num_aplicaciones: Number(e.target.value) })} />
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: "16px" }}>
                                    <label className="form-label">Notas de Receta</label>
                                    <textarea className="form-textarea" style={{ minHeight: "60px" }} value={recipeForm.notas} onChange={e => setRecipeForm({ ...recipeForm, notas: e.target.value })} />
                                </div>

                                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
                                    <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>Resumen de Receta</p>
                                    <p style={{ fontSize: "13px", color: "#334155", fontStyle: "italic", lineHeight: "1.4" }}>{recipeSummary}</p>
                                </div>

                                {stockReport && (
                                    <div style={{ 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "10px", 
                                        padding: "10px 12px", 
                                        borderRadius: "8px", 
                                        marginBottom: "20px",
                                        fontSize: "13px",
                                        background: stockReport.esSuficiente ? "#f0fdf4" : "#fef2f2",
                                        border: `1px solid ${stockReport.esSuficiente ? "#bbf7d0" : "#fecaca"}`,
                                        color: stockReport.esSuficiente ? "#15803d" : "#b91c1c"
                                    }}>
                                        {stockReport.esSuficiente ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontWeight: 700 }}>{stockReport.esSuficiente ? "Stock Disponible" : "Stock Insuficiente"}</span>
                                            <p style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>
                                                {stockReport.esSuficiente 
                                                    ? `Hay suficiente para las ${aplicacionesProyectadas.length} aplicaciones (${stockReport.stockActual} ${stockReport.unidad} en bodega).`
                                                    : `Faltan ${stockReport.faltante.toFixed(1)} ${stockReport.unidad} para completar el ciclo (Stock: ${stockReport.stockActual}).`
                                                }
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button className="btn-save" style={{ flex: 2 }} onClick={handleSaveRecipe} disabled={isSavingRecipe}>
                                        {isSavingRecipe ? "Guardando..." : "Guardar y Crear Tratamiento"}
                                    </button>
                                    <button className="btn-edit" style={{ flex: 1, marginTop: 0 }} onClick={() => setRecipeStep(1)}>Atrás</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="tracking-container">
            <div className="tracking-header">
                <div className="selector-group">
                    <select
                        className="tracking-select"
                        value={selectedFinca}
                        onChange={e => setSelectedFinca(e.target.value)}
                    >
                        <option value="">Seleccionar Finca...</option>
                        {fincas.map(f => (
                            <option key={f.fin_finca} value={f.fin_finca}>{f.fin_nombre}</option>
                        ))}
                    </select>

                    <select
                        className="tracking-select"
                        value={selectedArbol}
                        onChange={e => setSelectedArbol(e.target.value)}
                        disabled={!selectedFinca}
                    >
                        <option value="">Seleccionar Árbol...</option>
                        {arboles.map(a => (
                            <option key={a.arb_arbol} value={a.arb_arbol}>Árbol #{a.arb_arbol}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4b5563" }}>
                    <ClipboardEdit size={18} />
                    <span style={{ fontWeight: 600, fontSize: "15px" }}>Seguimiento Fitociclo</span>
                </div>
            </div>

            {!selectedArbol ? (
                <div className="empty-state" style={{ marginTop: "40px" }}>
                    <div style={{ background: "#f3f4f6", padding: "20px", borderRadius: "50%", marginBottom: "16px" }}>
                        <TreePalm size={64} color="#9ca3af" />
                    </div>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#374151" }}>Sin selección</h2>
                    <p style={{ maxWidth: "400px" }}>Selecciona una finca y un árbol para visualizar el calendario de tratamientos y eventos fitosanitarios.</p>
                </div>
            ) : (
                <>
                    {renderBanner()}

                    <div className="calendar-wrapper">
                        <div className="calendar-main">
                            <div className="calendar-nav">
                                <button className="nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                                <h3 className="calendar-month-title">
                                    {currentDate.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
                                </h3>
                                <button className="nav-btn" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                            </div>

                            <div className="calendar-grid">
                                {WEEKDAYS.map(w => (
                                    <div key={w} className="calendar-weekday">{w}</div>
                                ))}
                                {monthData.map((cell, idx) => (
                                    <div
                                        key={idx}
                                        className={`calendar-day ${!cell.day ? "empty" : ""} ${cell.isClosingDay ? "closing-day" : ""} ${selectedDay && cell.date && localDateToString(selectedDay) === localDateToString(cell.date) ? "selected" : ""} ${cell.date && recipeForm.fecha_inicio && recipeForm.fecha_fin && localDateToString(cell.date) >= recipeForm.fecha_inicio && localDateToString(cell.date) <= recipeForm.fecha_fin ? "projected" : ""} ${cell.date && aplicacionesProyectadas.includes(localDateToString(cell.date)) ? "is-application" : ""} ${cell.isToday ? "today" : ""}`}
                                        onClick={() => cell.date && setSelectedDay(cell.date)}
                                    >
                                        {cell.day && (
                                            <>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <span className="day-number">{cell.day}</span>
                                                    {cell.isToday && (
                                                        <span className="today-badge">HOY</span>
                                                    )}
                                                </div>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px" }}>
                                                    {cell.events.map((ev, i) => (
                                                        <div key={i} className={`pill pill-${ev.type}`} title={ev.label}>
                                                            {ev.label}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {renderDetailSidebar()}
                    </div>
                </>
            )}
        </div>
    );
};

export default AgroTratamientoTracking;
