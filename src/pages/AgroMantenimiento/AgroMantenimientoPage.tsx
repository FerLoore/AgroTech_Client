import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Calendar as CalIcon, Plus, ChevronLeft, ChevronRight, 
    Droplets, Sprout, Activity, CheckCircle2, Filter, X, AlertCircle
} from "lucide-react";
import { getMantenimientos, createMantenimiento, updateMantenimiento } from "../../api/AgroMantenimiento.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";
import { getTratamientos } from "../../api/AgroTratamientos.api";
import { getAgroFincas } from "../../api/AgroFinca.api";
import { getAlertas } from "../../api/AgroAlertaSalud.api";
import { toast } from "sonner";
import "../AgroTratamientos/TrackingCalendar.css"; 

const WEEKDAYS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export default function AgroMantenimientoPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
    
    const [mantenimientos, setMantenimientos] = useState<any[]>([]);
    const [tratamientos, setTratamientos] = useState<any[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [secciones, setSecciones] = useState<any[]>([]);
    const [fincas, setFincas] = useState<any[]>([]);
    
    const [filtroFinca, setFiltroFinca] = useState<string>("");
    const [filtroSeccion, setFiltroSeccion] = useState<string>("");
    
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ 
        secc_seccion: "", 
        man_tipo: "Riego", 
        man_frecuencia_dias: 7, 
        man_ultima_fecha: format(new Date(), "yyyy-MM-dd") 
    });

    const loadData = async () => {
        try {
            setLoading(true);
            const [mantRes, seccRes, trataRes, fincasRes, alertRes] = await Promise.all([
                getMantenimientos(), 
                getAgroSecciones(),
                getTratamientos(),
                getAgroFincas(),
                getAlertas()
            ]);
            
            setMantenimientos(mantRes.data?.data || mantRes.data || []);
            if (seccRes.data && seccRes.data.secciones) setSecciones(seccRes.data.secciones);
            setTratamientos(Array.isArray(trataRes) ? trataRes : []);
            if (fincasRes.data && fincasRes.data.fincas) setFincas(fincasRes.data.fincas);
            setAlertas(Array.isArray(alertRes) ? alertRes : []);
            
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Error al sincronizar datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const seccionesFiltradas = useMemo(() => {
        if (!filtroFinca) return secciones;
        return secciones.filter(s => Number(s.fin_finca) === Number(filtroFinca));
    }, [secciones, filtroFinca]);

    const mantenimientosFiltrados = useMemo(() => {
        return mantenimientos.filter(m => {
            const matchesFinca = !filtroFinca || Number(m.seccion?.fin_finca) === Number(filtroFinca);
            const matchesSeccion = !filtroSeccion || Number(m.secc_seccion) === Number(filtroSeccion);
            return matchesFinca && matchesSeccion;
        });
    }, [mantenimientos, filtroFinca, filtroSeccion]);

    const tratamientosFiltrados = useMemo(() => {
        return tratamientos.filter(t => {
            // Un tratamiento puede venir por Seccion (preventivo) o por Alerta (curativo)
            const fincaId = t.seccion?.fin_finca || t.alerta?.arbol?.surco?.seccion?.fin_finca;
            const seccionId = t.secc_seccion || t.alerta?.arbol?.surco?.secc_secciones;
            
            const matchesFinca = !filtroFinca || Number(fincaId) === Number(filtroFinca);
            const matchesSeccion = !filtroSeccion || Number(seccionId) === Number(filtroSeccion);
            return matchesFinca && matchesSeccion;
        });
    }, [tratamientos, filtroFinca, filtroSeccion]);

    const alertasFiltradas = useMemo(() => {
        return alertas.filter(a => {
            const fincaId = a.arbol?.surco?.seccion?.fin_finca;
            const seccionId = a.arbol?.surco?.secc_secciones;
            const matchesFinca = !filtroFinca || Number(fincaId) === Number(filtroFinca);
            const matchesSeccion = !filtroSeccion || Number(seccionId) === Number(filtroSeccion);
            return matchesFinca && matchesSeccion;
        });
    }, [alertas, filtroFinca, filtroSeccion]);

    const handleMarkDone = async (id: number) => {
        try {
            await updateMantenimiento(id, { man_ultima_fecha: new Date().toISOString() });
            loadData();
            toast.success("Tarea ejecutada correctamente");
        } catch (err) {
            console.error(err);
            toast.error("Error al registrar ejecución");
        }
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const monthData = useMemo(() => {
        return days.map(day => {
            const dayEvents: any[] = [];
            
            mantenimientosFiltrados.forEach(m => {
                if (!m.man_ultima_fecha) return;
                let checkDate = new Date(m.man_ultima_fecha);
                for (let i = 0; i < 50; i++) {
                    if (isSameDay(day, checkDate)) {
                        dayEvents.push({ ...m, eventType: 'mantenimiento' });
                        break;
                    }
                    if (checkDate > day) break;
                    checkDate = addDays(checkDate, m.man_frecuencia_dias);
                }
            });

            tratamientosFiltrados.forEach(t => {
                const inicio = new Date(t.trata_fecha_inicio);
                const fin = t.trata_fecha_fin ? new Date(t.trata_fecha_fin) : null;
                // Proyección para tratamientos activos
                if (isSameDay(day, inicio) || (fin && day >= inicio && day <= fin)) {
                    dayEvents.push({ ...t, eventType: 'tratamiento' });
                }
            });

            alertasFiltradas.forEach(a => {
                if (isSameDay(day, new Date(a.fecha_deteccion))) {
                    dayEvents.push({ ...a, eventType: 'alerta' });
                }
            });

            return {
                date: day,
                events: dayEvents,
                isCurrentMonth: isSameMonth(day, monthStart),
                isToday: isToday(day)
            };
        });
    }, [days, mantenimientosFiltrados, tratamientosFiltrados, alertasFiltradas, monthStart]);

    const selectedDayEvents = useMemo(() => {
        if (!selectedDay) return [];
        const data = monthData.find(d => isSameDay(d.date, selectedDay));
        return data ? data.events : [];
    }, [selectedDay, monthData]);

    const changeMonth = (offset: number) => {
        setCurrentDate(addDays(currentDate, offset * 30));
        setSelectedDay(null);
    };

    const clearFilters = () => {
        setFiltroFinca("");
        setFiltroSeccion("");
    };

    return (
        <div className="tracking-container" style={{ background: "#f2ede4" }}>
            <div className="tracking-header">
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>Centro de Control de Tareas</h1>
                    <p style={{ fontSize: 13, color: "#5F5E5A", marginTop: 4 }}>Seguimiento y ejecución de labores agrícolas y alertas de salud.</p>
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "flex", background: "#fff", borderRadius: 10, padding: "4px 8px", border: "1px solid #e4ddd4", gap: 8, alignItems: "center" }}>
                        <Filter size={16} color="#7a9a7a" />
                        <select 
                            value={filtroFinca} 
                            onChange={e => { setFiltroFinca(e.target.value); setFiltroSeccion(""); }}
                            style={{ border: "none", fontSize: 13, color: "#2d4a2d", outline: "none", background: "none" }}
                        >
                            <option value="">Todas las Fincas</option>
                            {fincas.map(f => <option key={f.fin_finca} value={f.fin_finca}>{f.fin_nombre}</option>)}
                        </select>
                        <div style={{ width: 1, height: 20, background: "#e4ddd4" }} />
                        <select 
                            value={filtroSeccion} 
                            onChange={e => setFiltroSeccion(e.target.value)}
                            style={{ border: "none", fontSize: 13, color: "#2d4a2d", outline: "none", background: "none" }}
                        >
                            <option value="">Todas las Secciones</option>
                            {seccionesFiltradas.map(s => <option key={s.secc_seccion} value={s.secc_seccion}>{s.secc_nombre}</option>)}
                        </select>
                        {(filtroFinca || filtroSeccion) && (
                            <button onClick={clearFilters} style={{ background: "none", border: "none", cursor: "pointer", color: "#a03020", display: "flex", alignItems: "center" }}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="calendar-wrapper">
                <div className="calendar-main">
                    <div className="calendar-nav">
                        <button className="nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                        <h2 className="calendar-month-title">{format(currentDate, "MMMM yyyy", { locale: es })}</h2>
                        <button className="nav-btn" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                        <button className="nav-btn" onClick={() => setCurrentDate(new Date())} style={{ fontSize: 12, padding: "6px 12px" }}>Hoy</button>
                    </div>

                    <div className="calendar-grid">
                        {WEEKDAYS.map(d => <div key={d} className="calendar-weekday">{d}</div>)}
                        
                        {monthData.map((d, idx) => (
                            <div 
                                key={idx} 
                                className={`calendar-day ${!d.isCurrentMonth ? 'empty' : ''} ${d.isToday ? 'today' : ''} ${selectedDay && isSameDay(d.date, selectedDay) ? 'selected' : ''}`}
                                onClick={() => setSelectedDay(d.date)}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span className="day-number">{format(d.date, "d")}</span>
                                    {d.isToday && <span className="today-badge">Hoy</span>}
                                </div>
                                
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 2, marginTop: 4 }}>
                                    {d.events.slice(0, 3).map((ev, i) => {
                                        const isRiego = ev.man_tipo?.toLowerCase().includes("riego");
                                        const isTrata = ev.eventType === 'tratamiento';
                                        const isAlerta = ev.eventType === 'alerta';
                                        
                                        return (
                                            <div 
                                                key={i} 
                                                className={`pill ${isAlerta ? 'pill-critical' : isTrata ? 'pill-pending' : isRiego ? 'pill-projection' : 'pill-revision'}`}
                                                style={{ width: "100%", fontSize: "9px", display: "flex", alignItems: "center", gap: 4 }}
                                            >
                                                {isAlerta ? <AlertCircle size={10} /> : isTrata ? <Activity size={10} /> : isRiego ? <Droplets size={10} /> : <Sprout size={10} />}
                                                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {isAlerta ? "Alerta" : (ev.man_tipo || "Tratamiento")}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    {d.events.length > 3 && <div style={{ fontSize: 9, color: "#9aaa9a" }}>+{d.events.length - 3}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="details-sidebar">
                    <h3 className="sidebar-title">Tareas del Día</h3>
                    <p className="sidebar-date">{selectedDay ? format(selectedDay, "eeee d 'de' MMMM", { locale: es }) : "Selecciona un día"}</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {loading ? (
                            <p style={{ fontSize: 13, color: "#888" }}>Sincronizando...</p>
                        ) : selectedDayEvents.length === 0 ? (
                            <div className="empty-state" style={{ padding: "40px 20px" }}>
                                <CalIcon size={40} />
                                <p style={{ fontSize: 13 }}>No hay tareas para este día.</p>
                            </div>
                        ) : (
                            selectedDayEvents.map((ev, idx) => {
                                const isTrata = ev.eventType === 'tratamiento';
                                const isRiego = ev.man_tipo?.toLowerCase().includes("riego");
                                const isAlerta = ev.eventType === 'alerta';

                                return (
                                    <div key={idx} className="confirm-card" style={{ 
                                        background: isAlerta ? "#fcebeb" : isTrata ? "#fffbeb" : isRiego ? "#e6f1fb" : "#f0fdf4",
                                        borderColor: isAlerta ? "#fca5a5" : isTrata ? "#fef3c7" : isRiego ? "#bae6fd" : "#bbf7d0"
                                    }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                {isAlerta ? <AlertCircle size={18} color="#b91c1c" /> : isTrata ? <Activity size={18} color="#b45309" /> : isRiego ? <Droplets size={18} color="#0369a1" /> : <Sprout size={18} color="#16a34a" />}
                                                <span style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>
                                                    {isAlerta ? "Alerta de Salud" : isTrata ? "Tratamiento Médico" : ev.man_tipo}
                                                </span>
                                            </div>
                                            {!isTrata && !isAlerta && (
                                                <button 
                                                    onClick={() => handleMarkDone(ev.man_id)}
                                                    style={{ background: "#4a7c59", border: "none", color: "#fff", cursor: "pointer", padding: "4px 8px", borderRadius: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                                                >
                                                    <CheckCircle2 size={14} /> Ejecutar
                                                </button>
                                            )}
                                        </div>

                                        <div style={{ fontSize: 12, color: "#4b5563", marginTop: 8 }}>
                                            <div style={{ fontWeight: 700, color: "#2d4a2d" }}>
                                                {isAlerta ? `Árbol #${ev.arb_arbol}` : isTrata ? `Prescripción #${ev.trata_tratamientos}` : (ev.seccion?.secc_nombre || `Sección ${ev.secc_seccion}`)} 
                                                <span style={{ fontWeight: 400, color: "#9aaa9a", marginLeft: 6 }}>
                                                    ({isAlerta ? ev.arbol?.surco?.seccion?.secc_nombre : isTrata ? (ev.seccion?.secc_nombre || ev.alerta?.arbol?.surco?.seccion?.secc_nombre) : (ev.seccion?.finca?.fin_nombre || "—")})
                                                </span>
                                            </div>
                                            <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.4, background: "rgba(255,255,255,0.5)", padding: 6, borderRadius: 4 }}>
                                                {isAlerta ? ev.descripcion_sintoma : isTrata ? ev.trata_observaciones : `Frecuencia: cada ${ev.man_frecuencia_dias} días.`}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
