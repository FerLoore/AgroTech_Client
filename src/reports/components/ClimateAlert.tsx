import React from 'react';
import type { PrediccionData } from '../types/report.types';

interface Props {
    prediccion: PrediccionData;
}

const RIESGO_STYLE: Record<string, { bg: string; text: string; label: string }> = {
    alto: { bg: '#fde8e8', text: '#c0392b', label: 'ALTO' },
    medio: { bg: '#fff8e6', text: '#b45309', label: 'MEDIO' },
    bajo: { bg: '#f0fdf4', text: '#166534', label: 'BAJO' },
};

const getRiesgoStyle = (riesgo: string) =>
    RIESGO_STYLE[riesgo.toLowerCase()] ?? RIESGO_STYLE.bajo;

const ClimateAlert: React.FC<Props> = ({ prediccion }) => {
    const { alertas_clima, correlaciones } = prediccion;

    return (
        <div style={{ marginBottom: '40px' }}>
            {/* ── Título de sección ── */}
            <h3 style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '16px', fontWeight: 700, marginBottom: '15px', color: '#2d4a2d',
            }}>
                <span style={{ width: '4px', height: '18px', background: '#4a7c59', borderRadius: '2px', flexShrink: 0 }} />
                Clima
            </h3>

            {/* ── Tabla de condiciones climáticas ── */}
            {alertas_clima.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#7a9a7a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>
                        Condiciones Climáticas Recientes por Sección
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead>
                            <tr style={{ background: '#e8f0e0', color: '#2d4a2d' }}>
                                <th style={{ padding: '10px', textAlign: 'left', borderRadius: '8px 0 0 0' }}>SECCIÓN</th>
                                <th style={{ padding: '10px', textAlign: 'left' }}>FECHA</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>HUMEDAD (%)</th>
                                <th style={{ padding: '10px', textAlign: 'center' }}>TEMPERATURA (°C)</th>
                                <th style={{ padding: '10px', textAlign: 'center', borderRadius: '0 8px 0 0' }}>PRECIPITACIÓN (mm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alertas_clima.map((c, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #eee', background: idx % 2 === 0 ? '#fff' : '#fafaf8' }}>
                                    <td style={{ padding: '10px', fontWeight: 600 }}>
                                        {c.seccion_nombre ?? `Sección ${c.seccion_id}`}
                                    </td>
                                    <td style={{ padding: '10px', color: '#7a9a7a' }}>{c.fecha}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>{c.humedad}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>{c.temperatura}</td>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>{c.precipitacion}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── Tarjetas de correlaciones ── */}
            {correlaciones.length > 0 && (
                <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#7a9a7a', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>
                        Correlaciones Detectadas
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {correlaciones.map((corr, idx) => {
                            const estilo = getRiesgoStyle(corr.riesgo);
                            return (
                                <div key={idx} style={{
                                    display: 'flex', alignItems: 'flex-start', gap: '14px',
                                    padding: '14px 16px', borderRadius: '10px',
                                    border: `1px solid ${estilo.bg}`,
                                    background: estilo.bg + '66',
                                }}>
                                    <span style={{
                                        flexShrink: 0, padding: '3px 10px', borderRadius: '20px',
                                        fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px',
                                        background: estilo.bg, color: estilo.text,
                                        border: `1px solid ${estilo.text}33`,
                                        marginTop: '1px',
                                    }}>
                                        {estilo.label}
                                    </span>
                                    <div>
                                        <p style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: '13px', color: '#2d4a2d' }}>
                                            {corr.condicion}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#7a9a7a' }}>
                                            {corr.descripcion}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {alertas_clima.length === 0 && correlaciones.length === 0 && (
                <p style={{ fontSize: '13px', color: '#7a9a7a', fontStyle: 'italic' }}>
                    No hay datos climáticos disponibles para este período.
                </p>
            )}
        </div>
    );
};

export default ClimateAlert;
