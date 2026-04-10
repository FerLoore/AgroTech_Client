// ============================================================
// useArbolTimeline.ts
// Hook para la vista "Timeline del Árbol".
//
// Lógica:
//   - Carga todos los árboles al montar (para el select)
//   - Al seleccionar un árbol, carga en paralelo:
//       · getAlertas()              → filtra por arb_arbol
//       · getAnalisisLaboratorio()  → filtra por alertas del árbol
//       · getHistorialByArbol(id)   → directo por árbol
//   - Construye EventoTimeline[] ordenado por fecha ascendente
// ============================================================

import { useEffect, useState } from "react";
import { getArboles } from "../../api/AgroArbol.api";
import { getAlertas } from "../../api/AgroAlertaSalud.api";
import { getAnalisisLaboratorio } from "../../api/agroAnalisisLaboratorio.api";
import { getHistorialByArbol } from "../../api/AgroHistorial.api";

// ── Tipos ────────────────────────────────────────────────────

export type TipoEvento = "siembra" | "estado" | "alerta" | "analisis";

export interface EventoTimeline {
    id:           string;
    tipo:         TipoEvento;
    fecha:        string;       // ISO date o datetime
    titulo:       string;
    detalle?:     string;
}

// ── Helpers ──────────────────────────────────────────────────

const toDate = (d: unknown): string =>
    d ? String(d).split("T")[0] : "";

const PRIORIDAD: Record<string, number> = {
    siembra:           1,
    alerta:            2,
    "analisis-envio":  3,
    "analisis-result": 4,
    estado:            5,
};

const prioridadEvento = (e: EventoTimeline): number => {
    if (e.tipo === "analisis") {
        return e.id.startsWith("analisis-resultado") ? 4 : 3;
    }
    return PRIORIDAD[e.tipo] ?? 99;
};

const sortByFecha = (a: EventoTimeline, b: EventoTimeline) => {
    const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    if (diff !== 0) return diff;
    return prioridadEvento(a) - prioridadEvento(b);
};

// ── Hook ─────────────────────────────────────────────────────

export const useArbolTimeline = () => {

    const [arboles,      setArboles]      = useState<any[]>([]);
    const [arbolId,      setArbolId]      = useState<string>("");
    const [eventos,      setEventos]      = useState<EventoTimeline[]>([]);
    const [loadingInit,  setLoadingInit]  = useState(true);
    const [loadingData,  setLoadingData]  = useState(false);
    const [error,        setError]        = useState("");

    // ── Cargar lista de árboles al montar ─────────────────────
    useEffect(() => {
        getArboles()
            .then(data => setArboles(Array.isArray(data) ? data : (data?.arboles || [])))
            .catch(() => setError("Error al cargar los árboles"))
            .finally(() => setLoadingInit(false));
    }, []);

    // ── Cargar timeline cuando cambia el árbol seleccionado ───
    useEffect(() => {
        if (!arbolId) {
            setEventos([]);
            return;
        }

        const id = Number(arbolId);

        const cargar = async () => {
            try {
                setLoadingData(true);
                setError("");

                const [alertasData, analisisData, historialData] = await Promise.all([
                    getAlertas(),
                    getAnalisisLaboratorio(),
                    getHistorialByArbol(id),
                ]);

                const arbol = arboles.find(a => Number(a.arb_arbol) === id);

                const timeline: EventoTimeline[] = [];

                // ── 1. Siembra ────────────────────────────────
                if (arbol?.arb_fecha_siembra) {
                    timeline.push({
                        id:     `siembra-${id}`,
                        tipo:   "siembra",
                        fecha:  toDate(arbol.arb_fecha_siembra),
                        titulo: "Siembra del árbol",
                        detalle: `Estado inicial: ${arbol.arb_estado ?? "—"}`,
                    });
                }

                // ── 2. Cambios de estado (historial) ──────────
                const historial = Array.isArray(historialData) ? historialData : [];
                historial.forEach((h: any) => {
                    timeline.push({
                        id:     `estado-${h.histo_historial}`,
                        tipo:   "estado",
                        fecha:  h.histo_fecha_cambio ?? "",
                        titulo: `Estado: ${h.histo_estado_anterior ?? "—"} → ${h.histo_estado_nuevo}`,
                        detalle: h.histo_motivo || undefined,
                    });
                });

                // ── 3. Alertas de salud ───────────────────────
                const alertas = (Array.isArray(alertasData) ? alertasData : [])
                    .filter((a: any) => Number(a.arb_arbol) === id);

                alertas.forEach((a: any) => {
                    timeline.push({
                        id:     `alerta-${a.alertsalud_id}`,
                        tipo:   "alerta",
                        fecha:  toDate(a.fecha_deteccion),
                        titulo: `Alerta #${a.alertsalud_id} detectada`,
                        detalle: a.descripcion_sintoma || undefined,
                    });
                });

                // ── 4. Análisis de laboratorio ────────────────
                const alertaIds = new Set(alertas.map((a: any) => Number(a.alertsalud_id)));
                const analisis  = (Array.isArray(analisisData) ? analisisData : [])
                    .filter((an: any) => alertaIds.has(Number(an.alert_alerta_salud)));

                analisis.forEach((an: any) => {
                    // Evento: envío a laboratorio
                    if (an.analab_fecha_envio) {
                        timeline.push({
                            id:     `analisis-envio-${an.analab_analisis_laboratorio}`,
                            tipo:   "analisis",
                            fecha:  toDate(an.analab_fecha_envio),
                            titulo: `Muestra enviada a ${an.analab_laboratorio_nombre || "laboratorio"}`,
                            detalle: `Alerta #${an.alert_alerta_salud}`,
                        });
                    }
                    // Evento: resultado disponible
                    if (an.analab_fecha_resultado) {
                        timeline.push({
                            id:     `analisis-resultado-${an.analab_analisis_laboratorio}`,
                            tipo:   "analisis",
                            fecha:  toDate(an.analab_fecha_resultado),
                            titulo: `Resultado: ${an.analab_resultado_tipo ?? "—"}`,
                            detalle: an.analab_laboratorio_nombre || undefined,
                        });
                    }
                });

                timeline.sort(sortByFecha);
                setEventos(timeline);

            } catch {
                setError("Error al cargar el timeline");
            } finally {
                setLoadingData(false);
            }
        };

        cargar();
    }, [arbolId, arboles]);

    // ── Opciones del select ───────────────────────────────────
    const opcionesArboles = arboles.map(a => ({
        valor: String(a.arb_arbol),
        label: `Árbol #${a.arb_arbol}  —  ${a.arb_estado ?? "Sin estado"}`,
    }));

    const arbolSeleccionado = arboles.find(a => Number(a.arb_arbol) === Number(arbolId)) ?? null;

    return {
        arbolId,
        setArbolId,
        arbolSeleccionado,
        opcionesArboles,
        eventos,
        loadingInit,
        loadingData,
        error,
    };
};
