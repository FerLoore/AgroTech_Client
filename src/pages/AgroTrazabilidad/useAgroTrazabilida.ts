import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getArbolById } from "../../api/AgroArbol.api";
import { getHistorialByArbol } from "../../api/AgroHistorial.api";
import { getAlertasByArbol } from "../../api/AgroAlertaSalud.api";
import { getTratamientosByArbol } from "../../api/AgroTratamientos.api";
import type { Arbol } from "../AgroArbol/agroArbol.types";
import type { Historial } from "../AgroHistorial/agroHistorial.types";
import type { AlertaSalud } from "../AgroAlertaSalud/AgroAlertaSalud.types";
import type { Tratamiento } from "../AgroTratamientos/AgroTratamientos.types";

// ─── Evento unificado para el timeline ───────────────────────────────────────

export type TipoEvento = "siembra" | "historial" | "alerta" | "tratamiento";

export interface EventoTimeline {
    id: string;
    tipo: TipoEvento;
    fecha: string; // ISO string para ordenar
    titulo: string;
    descripcion?: string;
    estado?: string;
    raw: Historial | AlertaSalud | Tratamiento | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAgroTrazabilidad = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [arbol, setArbol] = useState<Arbol | null>(null);
    const [eventos, setEventos] = useState<EventoTimeline[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;

        const cargar = async () => {
            setLoading(true);
            setError("");
            try {
                // 3 llamadas en paralelo tal como indica el documento
                const [arbolData, historialData, alertasData, tratamientosData] = await Promise.all([
                    getArbolById(Number(id)),
                    getHistorialByArbol(Number(id)),
                    getAlertasByArbol(Number(id)),
                    getTratamientosByArbol(Number(id)),
                ]);

                setArbol(arbolData);

                // Construir lista unificada de eventos
                const lista: EventoTimeline[] = [];

                // Evento de siembra (origen del árbol)
                lista.push({
                    id: "siembra-0",
                    tipo: "siembra",
                    fecha: arbolData.arb_fecha_siembra,
                    titulo: "Árbol sembrado",
                    descripcion: `Posición ${arbolData.arb_posicion_surco} — estado inicial: Crecimiento`,
                    raw: null,
                });

                // Eventos de historial (cambios de estado)
                historialData.forEach((h: Historial) => {
                    lista.push({
                        id: `historial-${h.histo_historial}`,
                        tipo: "historial",
                        fecha: h.histo_fecha_cambio,
                        titulo: `Estado: ${h.histo_estado_anterior ?? "—"} → ${h.histo_estado_nuevo}`,
                        descripcion: h.histo_motivo,
                        estado: h.histo_estado_nuevo,
                        raw: h,
                    });
                });

                // Eventos de alertas de salud
                alertasData.forEach((a: any) => {
                    lista.push({
                        id: `alerta-${a.alertsalud_id}`,
                        tipo: "alerta",
                        fecha: a.fecha_deteccion || a.alertsalud_fecha_deteccion,
                        titulo: "Alerta de salud registrada",
                        descripcion: a.descripcion_sintoma || a.alertsalud_descripcion_sintoma,
                        raw: a,
                    });
                });

                // Eventos de tratamientos
                tratamientosData.forEach((t: Tratamiento) => {
                    lista.push({
                        id: `tratamiento-${t.trata_tratamientos}`,
                        tipo: "tratamiento",
                        fecha: t.trata_fecha_inicio,
                        titulo: `Tratamiento — ${t.trata_estado}`,
                        descripcion: t.trata_dosis
                            ? `Dosis: ${t.trata_dosis}${t.trata_observaciones ? ` · ${t.trata_observaciones}` : ""}`
                            : t.trata_observaciones,
                        estado: t.trata_estado,
                        raw: t,
                    });
                });

                // Ordenar por fecha ascendente
                lista.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

                setEventos(lista);
            } catch {
                setError("Error al cargar la trazabilidad del árbol.");
            } finally {
                setLoading(false);
            }
        };

        cargar();
    }, [id]);

    return {
        arbol,
        eventos,
        loading,
        error,
        volver: () => navigate(-1),
    };
};