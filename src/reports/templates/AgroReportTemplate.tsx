import React, { forwardRef } from 'react';
import { AgroReportData } from '../types/report.types';
import logo from '../../assets/AGROTECHLOGOsinfondo.png';

interface Props {
    data: AgroReportData;
}

const AgroReportTemplate = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
    return (
        <div 
            ref={ref}
            style={{
                width: '800px', // Ancho fijo para consistencia en el PDF
                padding: '40px',
                background: '#fff',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#2d4a2d',
                lineHeight: 1.5
            }}
        >
            {/* ── ENCABEZADO ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e8f0e0', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img src={logo} alt="AgroTech Logo" style={{ height: '60px', width: 'auto' }} />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#4a7c59', letterSpacing: '-0.5px' }}>AGROTECH</h1>
                        <p style={{ margin: 0, fontSize: '12px', color: '#7a9a7a', fontWeight: 600, textTransform: 'uppercase' }}>Sistema de Gestión Agrícola Inteligente</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>INFORME FITOSANITARIO</h2>
                    <p style={{ margin: 0, fontSize: '11px', color: '#7a9a7a' }}>Fecha: {data.fecha}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#7a9a7a' }}>ID Reporte: #AT-{data.finca.id}-{Date.now().toString().slice(-4)}</p>
                </div>
            </div>

            {/* ── INFO FINCA ── */}
            <div style={{ background: '#f9fbf9', borderRadius: '12px', padding: '20px', marginBottom: '30px', border: '1px solid #eef2ee' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#4a7c59', textTransform: 'uppercase', letterSpacing: '1px' }}>Datos de la Finca</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#7a9a7a', textTransform: 'uppercase' }}>Finca</label>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{data.finca.nombre}</span>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#7a9a7a', textTransform: 'uppercase' }}>Ubicación</label>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{data.finca.ubicacion}</span>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#7a9a7a', textTransform: 'uppercase' }}>Generado por</label>
                        <span style={{ fontSize: '14px', fontWeight: 600 }}>{data.autor}</span>
                    </div>
                </div>
            </div>

            {/* ── MÓDULO ESPACIAL (MAPA) ── */}
            <div style={{ marginBottom: '40px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 700, marginBottom: '15px' }}>
                    <span style={{ width: '4px', height: '18px', background: '#4a7c59', borderRadius: '2px' }} />
                    Análisis Espacial de Incidencia ({data.mapa.modo})
                </h3>
                
                {/* Imagen del Mapa */}
                <div style={{ width: '100%', height: '350px', background: '#f0f0f0', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ddd', marginBottom: '20px' }}>
                    {data.mapa.snapshot ? (
                        <img src={data.mapa.snapshot} alt="Snapshot Mapa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa' }}>Captura de mapa no disponible</div>
                    )}
                </div>

                {/* Tabla de Secciones */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#e8f0e0', color: '#2d4a2d' }}>
                            <th style={{ padding: '10px', textAlign: 'left', borderRadius: '8px 0 0 0' }}>SECCIÓN</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>TOTAL ÁRBOLES</th>
                            <th style={{ padding: '10px', textAlign: 'center' }}>ENFERMOS</th>
                            <th style={{ padding: '10px', textAlign: 'center', borderRadius: '0 8px 0 0' }}>INCIDENCIA (%)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.mapa.stats.map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '10px', fontWeight: 600 }}>{s.nombre}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{s.total}</td>
                                <td style={{ padding: '10px', textAlign: 'center', color: s.enfermos > 0 ? '#c0392b' : 'inherit' }}>{s.enfermos}</td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <span style={{ 
                                        padding: '2px 8px', borderRadius: '10px', fontWeight: 700,
                                        background: s.incidencia > 25 ? '#fde8e8' : s.incidencia > 10 ? '#fff8e6' : '#f0fdf4',
                                        color: s.incidencia > 25 ? '#c0392b' : s.incidencia > 10 ? '#b45309' : '#166534'
                                    }}>
                                        {s.incidencia}%
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── PIE DE PÁGINA ── */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '10px', color: '#aaa' }}>
                Este reporte fue generado automáticamente por AgroTech®. La información contenida es confidencial y para uso exclusivo de la finca {data.finca.nombre}.
            </div>
        </div>
    );
});

export default AgroReportTemplate;
