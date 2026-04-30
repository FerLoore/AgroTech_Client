import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isToday, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalIcon, Plus, Trash2, CheckCircle } from "lucide-react";
import { getMantenimientos, createMantenimiento, updateMantenimiento, deleteMantenimiento } from "../../api/AgroMantenimiento.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";

export default function AgroMantenimientoPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mantenimientos, setMantenimientos] = useState<any[]>([]);
  const [secciones, setSecciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ secc_seccion: "", man_tipo: "Riego", man_frecuencia_dias: 7, man_ultima_fecha: format(new Date(), "yyyy-MM-dd") });

  const loadData = async () => {
    try {
      setLoading(true);
      const [mantRes, seccRes] = await Promise.all([getMantenimientos(), getAgroSecciones()]);
      setMantenimientos(mantRes.data);
      if (seccRes.data && seccRes.data.secciones) setSecciones(seccRes.data.secciones);
    } catch (error) {
      console.error("Error cargando mantenimientos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: any) => {
    e.preventDefault();
    try {
      await createMantenimiento(formData);
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if(confirm("¿Eliminar este programa de mantenimiento?")) {
      await deleteMantenimiento(id);
      loadData();
    }
  };

  const handleMarkDone = async (id: number) => {
    try {
      await updateMantenimiento(id, { man_ultima_fecha: new Date().toISOString() });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // CALENDARIO LÓGICA
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Generar eventos proyectados en el calendario (hasta 3 repeticiones futuras o límite del mes)
  const renderEventsForDay = (day: Date) => {
    const dayEvents: any[] = [];
    mantenimientos.forEach(m => {
      if (!m.man_ultima_fecha) return;
      let checkDate = new Date(m.man_ultima_fecha);
      // Avanzamos sumando frecuencia hasta pasar el mes actual
      while (checkDate <= endDate) {
        if (isSameDay(day, checkDate)) {
          dayEvents.push(m);
        }
        checkDate = addDays(checkDate, m.man_frecuencia_dias);
      }
    });

    return dayEvents.map((ev, i) => (
      <div key={i} style={{ fontSize: 10, padding: "2px 4px", background: ev.man_tipo.toLowerCase().includes("riego") ? "#e0f2fe" : "#fef3c7", color: ev.man_tipo.toLowerCase().includes("riego") ? "#0369a1" : "#b45309", borderRadius: 4, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {ev.seccion?.secc_nombre || `Sec. ${ev.secc_seccion}`} - {ev.man_tipo}
      </div>
    ));
  };

  return (
    <div style={{ padding: 24, background: "#f2ede4", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#2d4a2d", margin: 0 }}>Calendario de Mantenimiento</h1>
          <p style={{ fontSize: 13, color: "#5F5E5A", marginTop: 4 }}>Organiza y proyecta riegos, fertilizaciones y otros cuidados por sección.</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{ background: "#4a7c59", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Plus size={16} /> Nuevo Programa
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        {/* VISTA CALENDARIO */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "0.5px solid #e4ddd4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, color: "#2d4a2d", textTransform: "capitalize" }}>{format(currentDate, "MMMM yyyy", { locale: es })}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setCurrentDate(addDays(currentDate, -30))} style={{ padding: "4px 10px", background: "#f5f0e8", border: "1px solid #d4c9b0", borderRadius: 6, cursor: "pointer" }}>&lt;</button>
              <button onClick={() => setCurrentDate(new Date())} style={{ padding: "4px 10px", background: "#f5f0e8", border: "1px solid #d4c9b0", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Hoy</button>
              <button onClick={() => setCurrentDate(addDays(currentDate, 30))} style={{ padding: "4px 10px", background: "#f5f0e8", border: "1px solid #d4c9b0", borderRadius: 6, cursor: "pointer" }}>&gt;</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
            {weekDays.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#9aaa9a" }}>{d}</div>
            ))}
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {days.map(day => (
              <div key={day.toString()} style={{ minHeight: 90, padding: 6, border: "1px solid #f0ece4", borderRadius: 6, background: !isSameMonth(day, monthStart) ? "#fcfbfa" : isToday(day) ? "#f0fdf4" : "#fff" }}>
                <div style={{ fontSize: 12, fontWeight: isToday(day) ? 600 : 400, color: isToday(day) ? "#166534" : !isSameMonth(day, monthStart) ? "#ccc" : "#5F5E5A", marginBottom: 4 }}>
                  {format(day, dateFormat)}
                </div>
                <div>{renderEventsForDay(day)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* LISTA DE PROGRAMAS ACTIVOS */}
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "0.5px solid #e4ddd4" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 15, color: "#2d4a2d", display: "flex", alignItems: "center", gap: 6 }}>
            <CalIcon size={16} /> Programas Activos
          </h3>

          {loading ? <p style={{ fontSize: 13, color: "#888" }}>Cargando...</p> : mantenimientos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#aaa", fontSize: 13 }}>No hay programas configurados.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {mantenimientos.map(m => (
                <div key={m.man_id} style={{ padding: 12, border: "1px solid #f0ece4", borderRadius: 8, background: "#faf9f7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#2d4a2d" }}>
                      {m.seccion?.secc_nombre || `Sección ${m.secc_seccion}`}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button title="Marcar completado hoy" onClick={() => handleMarkDone(m.man_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#16a34a", padding: 0 }}><CheckCircle size={15} /></button>
                      <button title="Eliminar programa" onClick={() => handleDelete(m.man_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 0 }}><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#5F5E5A", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ background: m.man_tipo.toLowerCase().includes("riego") ? "#e0f2fe" : "#fef3c7", padding: "2px 6px", borderRadius: 4 }}>{m.man_tipo}</span>
                    <span>cada {m.man_frecuencia_dias} días</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#9aaa9a", marginTop: 8 }}>
                    Próximo: {m.man_proxima_fecha ? format(new Date(m.man_proxima_fecha), "dd MMM, yyyy", { locale: es }) : "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL NUEVO PROGRAMA */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 12, width: 400 }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#2d4a2d" }}>Nuevo Programa</h3>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              <div>
                <label style={{ fontSize: 12, color: "#5F5E5A" }}>Sección</label>
                <select required value={formData.secc_seccion} onChange={e => setFormData({...formData, secc_seccion: e.target.value})} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6, marginTop: 4 }}>
                  <option value="">Seleccione una sección</option>
                  {secciones.map(s => <option key={s.secc_seccion} value={s.secc_seccion}>{s.secc_nombre}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#5F5E5A" }}>Tipo de Mantenimiento</label>
                <input required type="text" value={formData.man_tipo} onChange={e => setFormData({...formData, man_tipo: e.target.value})} placeholder="Ej. Riego, Fertilizante..." style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6, marginTop: 4 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#5F5E5A" }}>Repetir cada (días)</label>
                <input required type="number" min="1" value={formData.man_frecuencia_dias} onChange={e => setFormData({...formData, man_frecuencia_dias: Number(e.target.value)})} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6, marginTop: 4 }} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "#5F5E5A" }}>Fecha del último mantenimiento</label>
                <input required type="date" value={formData.man_ultima_fecha} onChange={e => setFormData({...formData, man_ultima_fecha: e.target.value})} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6, marginTop: 4 }} />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 16px", border: "none", background: "#f0ece4", borderRadius: 6, cursor: "pointer" }}>Cancelar</button>
                <button type="submit" style={{ padding: "8px 16px", border: "none", background: "#4a7c59", color: "#fff", borderRadius: 6, cursor: "pointer" }}>Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
