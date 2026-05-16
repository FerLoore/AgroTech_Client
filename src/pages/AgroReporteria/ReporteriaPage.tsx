import { useState, useEffect, useMemo, useRef } from "react";
import { getAgroFincas } from "../../api/AgroFinca.api";
import { getAlertas } from "../../api/AgroAlertaSalud.api";
import { getMapaFinca } from "../../api/agroFincaMapa.api";
import { getAgroClimas } from "../../api/AgroClima.api";
import { getReportes, deleteReporte, downloadReportePdf } from "../../api/AgroReportes.api";
import { toast } from "sonner";
import NuevoReporteModal from "./NuevoReporteModal";


import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { Button } from "primereact/button";

import "primereact/resources/themes/lara-light-green/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

export default function ReporteriaPage() {
    const [fincas, setFincas] = useState<any[]>([]);
    const [filtroFinca, setFiltroFinca] = useState<string>("all");
    const [filtroSeccion, setFiltroSeccion] = useState<string>("all");
    const [filtroEstado, setFiltroEstado] = useState<string>("all");
    const [filtroTopN, setFiltroTopN] = useState<number>(5);

    const [arboles, setArboles] = useState<any[]>([]);
    const [alertas, setAlertas] = useState<any[]>([]);
    const [, setClimas] = useState<any[]>([]);
    const [reportes, setReportes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    const [showModal, setShowModal] = useState(false);
    const [paginaReportes, setPaginaReportes] = useState(0);
    const REPORTES_POR_PAGINA = 5;
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getAgroFincas().then(res => setFincas(res.data?.fincas || []));
        getReportes().then(res => setReportes(res.reportes || []));
    }, []);

    useEffect(() => {
        if (filtroFinca !== "all") {
            setLoading(true);
            Promise.all([
                getMapaFinca(Number(filtroFinca)).catch(() => ({ arboles: [] } as { arboles: any[] })),
                getAlertas().catch(() => ({ data: { alertas: [] } } as { data: { alertas: any[]; [k: string]: any } })),
                getAgroClimas().catch(() => ({ data: { climas: [] } } as { data: { climas: any[]; [k: string]: any } }))
            ]).then(([mapRes, alRes, cliRes]) => {
                setArboles(mapRes?.arboles || []);
                const alData = Array.isArray(alRes) ? alRes : (alRes?.data?.alertas || alRes?.data || []);
                setAlertas(alData);
                const cliData = Array.isArray(cliRes) ? cliRes : (cliRes?.data?.climas || cliRes?.data || []);
                setClimas(cliData);
                setLoading(false);
            });
            getReportes(Number(filtroFinca)).then(res => { setReportes(res.reportes || []); setPaginaReportes(0); });
        } else {
            setArboles([]);
            setAlertas([]);
            setClimas([]);
            getReportes().then(res => { setReportes(res.reportes || []); setPaginaReportes(0); });
        }
    }, [filtroFinca]);

    const arbolesFiltrados = useMemo(() => {
        return arboles.filter(a => {
            if (filtroSeccion !== "all" && String(a.seccion_id) !== filtroSeccion) return false;
            if (filtroEstado !== "all" && a.estado !== filtroEstado) return false;
            return true;
        });
    }, [arboles, filtroSeccion, filtroEstado]);

    const kpis = useMemo(() => {
        const total = arbolesFiltrados.length;
        const enfermos = arbolesFiltrados.filter(a => a.estado === "Enfermo").length;
        const alertasArboles = new Set(alertas.map(al => al.arb_arbol));
        const activas = arbolesFiltrados.filter(a => alertasArboles.has(a.id)).length;
        const incidencia = total > 0 ? ((enfermos / total) * 100).toFixed(1) : "0.0";
        return { total, enfermos, activas, incidencia };
    }, [arbolesFiltrados, alertas]);

    const alertasFiltradas = useMemo(() => alertas.filter(al => arbolesFiltrados.some(a => a.id === al.arb_arbol)), [alertas, arbolesFiltrados]);
    
    const sintomasData = useMemo(() => {
        const conteo = alertasFiltradas.reduce((acc: any, al) => {
            const s = al.descripcion_sintoma || "Desconocido";
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});
        
        const labels = Object.keys(conteo);
        const data = Object.values(conteo);

        
        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6', '#F97316'],
                    hoverBackgroundColor: ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0D9488', '#EA580C']
                }
            ]
        };
    }, [alertasFiltradas]);

    const arbolesCriticos = useMemo(() => {
        return arbolesFiltrados.map(a => {
            const totalAlertas = alertasFiltradas.filter(al => al.arb_arbol === a.id).length;
            return { ...a, totalAlertas };
        }).filter(a => a.totalAlertas > 0 || a.estado === 'Enfermo')
          .sort((a, b) => b.totalAlertas - a.totalAlertas)
          .slice(0, filtroTopN === 9999 ? undefined : filtroTopN)
          .map((a, i) => ({ ...a, rank: i + 1 }));
    }, [arbolesFiltrados, alertasFiltradas, filtroTopN]);

    const statsGenerales = useMemo(() => {
        return {
            totalArboles: arbolesFiltrados.length,
            totalSurcos: new Set(arbolesFiltrados.map(a => a.numero_surco)).size,
            totalSecciones: new Set(arbolesFiltrados.map(a => a.seccion_id)).size,
            totalEnfermos: arbolesFiltrados.filter(a => a.estado === 'Enfermo').length,
            totalSospechosos: arbolesFiltrados.filter(a => a.estado_sospechoso).length
        };
    }, [arbolesFiltrados]);

    const distribucionEstado = useMemo(() => [
        { name: 'Crecimiento', value: arbolesFiltrados.filter(a => a.estado === 'Crecimiento').length, color: '#3498db' },
        { name: 'Producción', value: arbolesFiltrados.filter(a => a.estado === 'Produccion').length, color: '#2ecc71' },
        { name: 'Enfermo', value: statsGenerales.totalEnfermos, color: '#e67e22' },
        { name: 'Muerto', value: arbolesFiltrados.filter(a => a.estado === 'Muerto').length, color: '#95a5a6' }
    ], [arbolesFiltrados, statsGenerales]);

    const seccionesAtencion = useMemo(() => {
        const map = arbolesFiltrados.reduce((acc: any, a) => {
            const name = a.seccion_nombre || `Sección ${a.seccion_id}`;
            if (!acc[name]) acc[name] = { nombre: name, total: 0, enfermos: 0, alertas: 0 };
            acc[name].total += 1;
            if (a.estado === 'Enfermo') acc[name].enfermos += 1;
            acc[name].alertas += alertasFiltradas.filter(al => al.arb_arbol === a.id).length;
            return acc;
        }, {});
        return Object.values(map).filter((s: any) => s.enfermos > 0).sort((a: any, b: any) => b.enfermos - a.enfermos);
    }, [arbolesFiltrados, alertasFiltradas]);

    const handleDelete = async (id: number) => {
        if (!confirm("¿Eliminar este reporte?")) return;
        try {
            await deleteReporte(id);
            setReportes(prev => prev.filter(r => r.repo_reporte !== id));
            toast.success("Reporte eliminado");
        } catch (e) {
            toast.error("Error al eliminar");
        }
    };

    const handleDownload = async (id: number) => {
        try {
            toast.info("Descargando PDF...");
            const blob = await downloadReportePdf(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Reporte_AgroTech_${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success("Descarga completada");
        } catch (e) {
            toast.error("Error al descargar PDF");
        }
    };

    const fincasOptions = [{ label: "Seleccionar Finca...", value: "all" }, ...fincas.map(f => ({ label: f.fin_nombre, value: String(f.fin_finca) }))];
    const seccionesUnicas = Array.from(new Set(arboles.map(a => a.seccion_id))).map(id => {
        const arbol = arboles.find(a => a.seccion_id === id);
        return { value: String(id), label: arbol?.seccion_nombre || `Sección ${id}` };
    });
    const seccionesOptions = [{ label: "Todas las Secciones", value: "all" }, ...seccionesUnicas];
    const estadoOptions = [
        { label: "Todos los Estados", value: "all" },
        { label: "Crecimiento", value: "Crecimiento" },
        { label: "Producción", value: "Produccion" },
        { label: "Enfermo", value: "Enfermo" },
        { label: "Muerto", value: "Muerto" }
    ];
    const topNOptions = [
        { label: "Top 5", value: 5 },
        { label: "Top 10", value: 10 },
        { label: "Top 20", value: 20 },
        { label: "Todos", value: 9999 }
    ];

    const estadoBodyTemplate = (rowData: any) => {
        const severityMap: any = {
            "Crecimiento": "success",
            "Produccion": "info",
            "Enfermo": "warning",
            "Muerto": "danger"
        };
        return <Tag value={rowData.estado} severity={severityMap[rowData.estado] || "info"}></Tag>;
    };

    const accionesBodyTemplate = (rowData: any) => {
        return (
            <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => handleDownload(rowData.repo_reporte)} style={{ background: "none", border: "none", color: "#2980b9", cursor: "pointer", fontSize: 18 }}>
                    <i className="pi pi-download"></i>
                </button>
                <button onClick={() => handleDelete(rowData.repo_reporte)} style={{ background: "none", border: "none", color: "#c0392b", cursor: "pointer", fontSize: 18 }}>
                    <i className="pi pi-trash"></i>
                </button>
            </div>
        );
    };

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "#2d4a2d", margin: 0 }}>Reportería Avanzada</h1>
                    <p style={{ color: "#666", fontSize: 14, margin: "4px 0 0" }}>Analiza, visualiza y genera reportes de tu finca.</p>
                </div>
                <Button label="Nuevo Reporte" icon="pi pi-plus" onClick={() => setShowModal(true)} style={{ background: "#4a7c59", color: "white", padding: "10px 16px", borderRadius: 8, border: "none", fontWeight: 600 }} />
            </div>

            {/* FILTROS */}
            <div style={{ display: "flex", gap: 16, background: "white", padding: 16, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: 24 }}>
                <Dropdown value={filtroFinca} options={fincasOptions} onChange={(e) => setFiltroFinca(e.value)} style={{ flex: 1 }} className="p-dropdown-sm" />
                <Dropdown value={filtroSeccion} options={seccionesOptions} onChange={(e) => setFiltroSeccion(e.value)} disabled={filtroFinca === "all"} style={{ flex: 1 }} className="p-dropdown-sm" />
                <Dropdown value={filtroEstado} options={estadoOptions} onChange={(e) => setFiltroEstado(e.value)} style={{ flex: 1 }} className="p-dropdown-sm" />
                <Dropdown value={filtroTopN} options={topNOptions} onChange={(e) => setFiltroTopN(e.value)} style={{ flex: 1 }} className="p-dropdown-sm" />
            </div>

            {loading ? <div style={{ textAlign: "center", padding: 40, color: "#666" }}><i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i> Cargando datos...</div> : (
                <div ref={contentRef} style={{ background: "#f8faf8", padding: 16, borderRadius: 12 }}>
                    
                    {/* KPIS */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 32 }}>
                        <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0" }}>
                                <div style={{ background: "#f4f7f4", padding: 16, borderRadius: "50%", color: "#4a7c59" }}><i className="pi pi-list" style={{ fontSize: 32 }}></i></div>
                                <div>
                                    <div style={{ fontSize: 14, color: "#666", fontWeight: 700, textTransform: "uppercase" }}>Árboles Filtrados</div>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1a1a" }}>{kpis.total}</div>
                                </div>
                            </div>
                        </Card>
                        <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0" }}>
                                <div style={{ background: "#fdf2f2", padding: 16, borderRadius: "50%", color: "#c0392b" }}><i className="pi pi-exclamation-triangle" style={{ fontSize: 32 }}></i></div>
                                <div>
                                    <div style={{ fontSize: 14, color: "#666", fontWeight: 700, textTransform: "uppercase" }}>Árboles Enfermos</div>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1a1a" }}>{kpis.enfermos}</div>
                                </div>
                            </div>
                        </Card>
                        <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0" }}>
                                <div style={{ background: "#fff9e6", padding: 16, borderRadius: "50%", color: "#f39c12" }}><i className="pi pi-bell" style={{ fontSize: 32 }}></i></div>
                                <div>
                                    <div style={{ fontSize: 14, color: "#666", fontWeight: 700, textTransform: "uppercase" }}>Alertas Activas</div>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1a1a" }}>{kpis.activas}</div>
                                </div>
                            </div>
                        </Card>
                        <Card style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "8px 0" }}>
                                <div style={{ background: "#eaf4fb", padding: 16, borderRadius: "50%", color: "#2980b9" }}><i className="pi pi-chart-line" style={{ fontSize: 32 }}></i></div>
                                <div>
                                    <div style={{ fontSize: 14, color: "#666", fontWeight: 700, textTransform: "uppercase" }}>Incidencia Prom.</div>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: "#1a1a1a" }}>{kpis.incidencia}%</div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* SECCIÓN A: Análisis de Alertas Fitosanitarias */}
                    <div style={{ background: "white", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 24 }}>
                        <h3 style={{ margin: "0 0 20px", color: "#2d4a2d", display: "flex", alignItems: "center", gap: 8 }}><i className="pi pi-exclamation-triangle" style={{ color: "#e67e22", fontSize: 20 }}></i> Análisis de Alertas Fitosanitarias</h3>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
                            {/* Izquierda: Frecuencia de Síntomas */}
                            <div style={{ background: "#f8faf8", padding: 16, borderRadius: 12 }}>
                                <h4 style={{ margin: "0 0 16px", color: "#444", fontSize: 14 }}>Frecuencia de Síntomas</h4>
                                {sintomasData.labels.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <div style={{ position: "relative", width: "100%", maxWidth: 220, margin: "0 auto" }}>
                                            <Chart type="doughnut" data={sintomasData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
                                            <div style={{ position: "absolute", top: "50%", left: "0", right: "0", transform: "translateY(-50%)", textAlign: "center", pointerEvents: "none" }}>
                                                <span style={{ fontSize: 24, fontWeight: "bold", color: "#2d4a2d" }}>{alertasFiltradas.length}</span><br/>
                                                <span style={{ fontSize: 11, color: "#888" }}>Alertas</span>
                                            </div>
                                        </div>
                                        {/* Custom Legend */}
                                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px 12px", marginTop: 16 }}>
                                            {sintomasData.labels.map((label: string, i: number) => (
                                                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
                                                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: sintomasData.datasets[0].backgroundColor[i % sintomasData.datasets[0].backgroundColor.length] }}></span>
                                                    {label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 13 }}>No hay alertas activas en los árboles filtrados.</div>
                                )}
                            </div>

                            {/* Derecha: Top N Críticos */}
                            <div style={{ border: "1px solid #eaeaea", borderRadius: 12, overflow: "hidden" }}>
                                <div style={{ background: "#fdf8f5", padding: "12px 16px", borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <h4 style={{ margin: 0, color: "#444", fontSize: 14 }}>TOP {filtroTopN === 9999 ? "Críticos" : filtroTopN} — Árboles Críticos</h4>
                                    <Tag value="REQUIEREN ATENCIÓN" severity="danger" />
                                </div>
                                <DataTable value={arbolesCriticos} emptyMessage="No hay árboles críticos bajo estos filtros." size="small" rowHover className="custom-agrotech-table">
                                    <Column field="rank" header="#" body={(data) => <span style={{ color: data.rank === 1 ? '#c0392b' : 'inherit', fontWeight: data.rank === 1 ? 'bold' : 'normal' }}>{data.rank}</span>}></Column>
                                    <Column field="referencia" header="Árbol" body={(data) => <strong>{data.referencia || `#${data.id}`}</strong>}></Column>
                                    <Column field="seccion_nombre" header="Sección" body={(data) => data.seccion_nombre || `S-${data.seccion_id}`}></Column>
                                    <Column field="estado" header="Estado" body={estadoBodyTemplate}></Column>
                                    <Column field="totalAlertas" header="Alertas" body={(data) => <span style={{ fontWeight: "bold", color: data.totalAlertas > 0 ? "#e67e22" : "#999" }}>{data.totalAlertas}</span>} align="center"></Column>
                                </DataTable>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN B: Estadísticas Generales del Inventario */}
                    <div style={{ background: "white", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 24 }}>
                        <h3 style={{ margin: "0 0 20px", color: "#2d4a2d", display: "flex", alignItems: "center", gap: 8 }}><i className="pi pi-tree" style={{ color: "#2ecc71", fontSize: 20 }}></i> Estadísticas Generales del Inventario</h3>
                        
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
                            <StatCard label="Árboles" val={statsGenerales.totalArboles} />
                            <StatCard label="Surcos" val={statsGenerales.totalSurcos} />
                            <StatCard label="Secciones" val={statsGenerales.totalSecciones} />
                            <StatCard label="Enfermos" val={statsGenerales.totalEnfermos} bg={statsGenerales.totalEnfermos > 0 ? "#fde8e8" : "#f4f7f4"} color={statsGenerales.totalEnfermos > 0 ? "#c0392b" : "#444"} pct={((statsGenerales.totalEnfermos / (statsGenerales.totalArboles||1))*100).toFixed(1)} />
                            <StatCard label="Sospechosos" val={statsGenerales.totalSospechosos} bg={statsGenerales.totalSospechosos === 0 ? "#eafaf1" : "#fef9e7"} color={statsGenerales.totalSospechosos === 0 ? "#27ae60" : "#d35400"} pct={((statsGenerales.totalSospechosos / (statsGenerales.totalArboles||1))*100).toFixed(1)} />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                            {/* Izquierdo: Distribución por Estado */}
                            <div>
                                <h4 style={{ margin: "0 0 16px", color: "#444", fontSize: 14 }}>Distribución por Estado</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    {distribucionEstado.map(d => (
                                        <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            <div style={{ width: 100, fontSize: 13, color: "#555" }}>{d.name}</div>
                                            <div style={{ flex: 1 }}>
                                                <ProgressBar value={statsGenerales.totalArboles > 0 ? Math.round((d.value / statsGenerales.totalArboles) * 100) : 0} color={d.color} displayValueTemplate={() => ""} style={{ height: "8px" }}></ProgressBar>
                                            </div>
                                            <div style={{ width: 80, textAlign: "right", fontSize: 13, fontWeight: "bold" }}>{d.value} <span style={{ color: "#999", fontWeight: "normal", fontSize: 11 }}>({statsGenerales.totalArboles > 0 ? ((d.value / statsGenerales.totalArboles) * 100).toFixed(1) : 0}%)</span></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Derecho: Secciones que Requieren Atención */}
                            <div style={{ border: "1px solid #eaeaea", borderRadius: 12, overflow: "hidden" }}>
                                <div style={{ background: "#f4f7f4", padding: "10px 16px", borderBottom: "1px solid #eaeaea" }}>
                                    <h4 style={{ margin: 0, color: "#444", fontSize: 14 }}>Secciones que Requieren Atención</h4>
                                </div>
                                <DataTable value={seccionesAtencion as any[]} emptyMessage="No hay secciones con árboles enfermos." size="small" rowHover className="custom-agrotech-table">
                                    <Column field="nombre" header="Sección" body={(data) => <span style={{ fontWeight: 600 }}>{data.nombre}</span>}></Column>
                                    <Column field="total" header="Total" align="center"></Column>
                                    <Column field="enfermos" header="Enf." body={(data) => <span style={{ fontWeight: "bold", color: "#e67e22" }}>{data.enfermos}</span>} align="center"></Column>
                                    <Column field="alertas" header="Alert." align="center"></Column>
                                </DataTable>
                            </div>
                        </div>

                        {/* Franja verde final */}
                        <div style={{ background: statsGenerales.totalSospechosos > 0 ? "#fef9e7" : "#eafaf1", color: statsGenerales.totalSospechosos > 0 ? "#d35400" : "#27ae60", padding: 16, borderRadius: 8, textAlign: "center", fontWeight: 600, fontSize: 14 }}>
                            {statsGenerales.totalSospechosos > 0 
                                ? <><i className="pi pi-exclamation-triangle"></i> {statsGenerales.totalSospechosos} árboles en estado sospechoso requieren revisión.</>
                                : <><i className="pi pi-check-circle"></i> Sin árboles en estado sospechoso. Todos los árboles en Crecimiento están dentro de su período esperado.</>}
                        </div>
                    </div>
                </div>
            )}

            {/* TABLA HISTORIAL */}
            <div style={{ background: "white", padding: 20, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h3 style={{ margin: 0, color: "#2d4a2d", display: "flex", alignItems: "center", gap: 8 }}>
                        <i className="pi pi-list" style={{ fontSize: 20 }}></i>
                        Historial de Reportes Generados
                    </h3>
                    <span style={{
                        background: "#f0f7ec", color: "#2d4a2d",
                        fontSize: 12, fontWeight: 600,
                        padding: "4px 12px", borderRadius: 20,
                        border: "1px solid #c8d8c0"
                    }}>
                        {reportes.length} {reportes.length === 1 ? "reporte" : "reportes"}
                    </span>
                </div>
                <DataTable
                    value={reportes}
                    emptyMessage="No hay reportes generados."
                    size="normal"
                    rowHover
                    className="custom-agrotech-table"
                    paginator
                    rows={REPORTES_POR_PAGINA}
                    first={paginaReportes}
                    onPage={(e) => setPaginaReportes(e.first)}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
                    currentPageReportTemplate="Mostrando {first}–{last} de {totalRecords} reportes"
                    paginatorLeft={
                        <span style={{ fontSize: 12, color: "#7a9a7a", padding: "0 8px" }}>
                            Mostrando {Math.min(paginaReportes + 1, reportes.length)}–{Math.min(paginaReportes + REPORTES_POR_PAGINA, reportes.length)} de {reportes.length}
                        </span>
                    }
                    paginatorRight={<span />}
                >
                    <Column field="repo_fecha" header="Fecha" body={(data) => new Date(data.repo_fecha).toLocaleString()}></Column>
                    <Column field="repo_tipo" header="Tipo"></Column>
                    <Column field="repo_usuario_nombre" header="Usuario"></Column>
                    <Column header="Acciones" body={accionesBodyTemplate}></Column>
                </DataTable>
            </div>

            {showModal && (
                <NuevoReporteModal 
                    onClose={() => setShowModal(false)} 
                    fincas={fincas} 
                    contentRef={contentRef} 
                    onGenerated={() => getReportes(filtroFinca !== "all" ? Number(filtroFinca) : undefined).then(res => setReportes(res.reportes || []))}
                    kpis={kpis}
                    arbolesCriticos={arbolesCriticos}
                    seccionesAtencion={seccionesAtencion}
                    sintomasData={sintomasData}
                />
            )}
        </div>
    );
}

const StatCard = ({ label, val, bg = "#f4f7f4", color = "#333", pct }: any) => (
    <div style={{ background: bg, padding: "16px 12px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(0,0,0,0.05)" }}>
        <div style={{ fontSize: 24, fontWeight: "bold", color }}>{val}</div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 4, fontWeight: 600 }}>{label}</div>
        {pct && <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{pct}% del total</div>}
    </div>
);
