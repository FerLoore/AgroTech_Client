import { useState } from "react";
import { createReporte, downloadReportePdf } from "../../api/AgroReportes.api";
import { toast } from "sonner";

export default function NuevoReporteModal({ onClose, fincas, onGenerated, kpis, arbolesCriticos, seccionesAtencion, sintomasData }: any) {
    const [fincaId, setFincaId] = useState<string>("");
    const [tipo, setTipo] = useState<string>("Fitosanitario");
    const [generating, setGenerating] = useState(false);

    const handleGenerar = async () => {
        if (!fincaId) {
            toast.error("Selecciona una finca primero");
            return;
        }
        setGenerating(true);
        toast.info("Capturando datos y generando PDF...");

        try {
            const res = await createReporte({
                fin_finca: Number(fincaId),
                usu_usuario: 1, // Usuario quemado temporal o usar AuthContext
                repo_tipo: tipo,
                repo_secciones: "Todas",
                report_data: { kpis, arbolesCriticos, seccionesAtencion, sintomasData }
            });

            if (res.ok) {
                toast.success("Reporte generado exitosamente");
                onGenerated();
                onClose();
                
                // Forzar descarga del PDF
                try {
                    const blob = await downloadReportePdf(res.reporte.repo_reporte);
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Reporte_AgroTech_${res.reporte.repo_reporte}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                } catch (err) {
                    toast.error("Error descargando el PDF, por favor intente desde el historial.");
                }
            } else {
                toast.error("Error al generar el reporte");
            }
        } catch (e) {
            console.error(e);
            toast.error("Ocurrió un error inesperado.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <div style={{ background: "white", width: 500, borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}>
                <div style={{ padding: 20, background: "#2d4a2d", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}><i className="pi pi-file-pdf" style={{ fontSize: 20 }}></i> Nuevo Reporte</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><i className="pi pi-times" style={{ fontSize: 20 }}></i></button>
                </div>
                
                <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#444" }}>Tipo de Reporte</label>
                        <select value={tipo} onChange={e => setTipo(e.target.value)} style={selectStyle}>
                            <option value="Fitosanitario">Fitosanitario Completo</option>
                            <option value="Climatico">Resumen Climático</option>
                            <option value="Inventario">Inventario de Árboles</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#444" }}>Seleccionar Finca</label>
                        <select value={fincaId} onChange={e => setFincaId(e.target.value)} style={selectStyle}>
                            <option value="">Seleccione...</option>
                            {fincas.map((f: any) => <option key={f.fin_finca} value={f.fin_finca}>{f.fin_nombre}</option>)}
                        </select>
                    </div>

                    <div style={{ background: "#f4f7f4", padding: 16, borderRadius: 8, fontSize: 13, color: "#555" }}>
                        <p style={{ margin: "0 0 8px", fontWeight: 600 }}>El PDF incluirá:</p>
                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                            <li>Gráficos y KPIs actuales de la pantalla</li>
                            <li>Información general de la finca</li>
                            <li>Firma del usuario actual</li>
                        </ul>
                    </div>
                </div>

                <div style={{ padding: 20, borderTop: "1px solid #eee", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                    <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #ddd", background: "white", cursor: "pointer", fontWeight: 600, color: "#555" }}>Cancelar</button>
                    <button onClick={handleGenerar} disabled={generating} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#4a7c59", color: "white", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: 8, opacity: generating ? 0.7 : 1 }}>
                        {generating ? "Generando..." : <><i className="pi pi-check-circle" style={{ fontSize: 18 }}></i> Generar PDF</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

const selectStyle = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #ccc", outline: "none", boxSizing: "border-box" as const };
