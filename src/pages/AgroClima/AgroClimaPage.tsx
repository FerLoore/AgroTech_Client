import React, { useMemo, useState } from 'react';
import { CloudRain } from 'lucide-react';
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroClima } from './useAgroClima';
import type { AgroClima } from './AgroClima.types';

const POR_PAGINA = 10;

const columnas: ColumnaConfig[] = [
    { header: 'ID', key: 'clim_clima' },
    {
        header: 'Fecha',
        key: 'clim_fecha',
        render: (valor) => {
            if (!valor) return '—';
            const fecha = new Date(valor);
            if (isNaN(fecha.getTime())) return String(valor);
            return fecha.toLocaleDateString('es-GT', {
                day: '2-digit', month: '2-digit', year: 'numeric',
            });
        }
    },
    { header: 'Temperatura (°C)', key: 'clim_temperatura' },
    { header: 'Humedad (%)', key: 'clim_humedad_relativa' },
    { header: 'Precipitación (mm)', key: 'clim_precipitacion' },
    { header: 'Sección', key: 'secc_nombre' },
];

const AgroClimaPage: React.FC = () => {
    const hookData = useAgroClima();
    const [pagina, setPagina] = useState(1);

    const totalPaginas = Math.max(1, Math.ceil(hookData.climas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const desde = (paginaActual - 1) * POR_PAGINA;
    const datosPagina = hookData.climas.slice(desde, desde + POR_PAGINA);
    const mostrando = hookData.climas.length === 0
        ? '0'
        : `${desde + 1}–${Math.min(desde + POR_PAGINA, hookData.climas.length)}`;

    const campos = useMemo<CampoFormulario[]>(() => [
        { key: 'clim_temperatura', label: 'Temperatura (°C)', tipo: 'number', placeholder: 'Ej. 24.5', rule: 'numero_no_cero' },
        { key: 'clim_humedad_relativa', label: 'Humedad Relativa (%)', tipo: 'number', placeholder: 'Ej. 65.2', rule: 'numero_no_cero' },
        { key: 'clim_precipitacion', label: 'Precipitación (mm)', tipo: 'number', placeholder: 'Ej. 12.0', rule: 'numero_no_cero' },
        {
            key: 'seccionId',
            label: 'Sección',
            tipo: 'select',
            opciones: hookData.secciones.map(s => ({
                valor: String(s.secc_seccion),
                label: s.fin_nombre ? `${s.secc_nombre} — ${s.fin_nombre}` : s.secc_nombre,
            })),
        },
    ], [hookData.secciones]);

    return (
        <>
            <CrudTabla<AgroClima>
                titulo="Registro Climático"
                subtitulo={`AGRO_CLIMA — Mostrando ${mostrando} de ${hookData.climas.length}`}
                icono={CloudRain as any}
                columnas={columnas}
                campos={campos}
                idKey="clim_clima"
                datos={datosPagina}
                loading={hookData.loading}
                error={hookData.error}
                busqueda={hookData.busqueda}
                setBusqueda={(v) => { hookData.setBusqueda(v); setPagina(1); }}
                modal={hookData.modal}
                editando={hookData.editando}
                form={hookData.form as Record<string, unknown>}
                setForm={hookData.setForm as (f: Record<string, unknown>) => void}
                guardando={hookData.guardando}
                formError={hookData.formError}
                onNuevo={hookData.onNuevo}
                onEditar={hookData.onEditar}
                onEliminar={hookData.onEliminar}
                onGuardar={hookData.onGuardar}
                onCerrar={hookData.onCerrar}
                labelEliminar="Eliminar"
            />

            {totalPaginas > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, paddingBottom: 32 }}>
                    <button
                        onClick={() => setPagina(p => Math.max(1, p - 1))}
                        disabled={paginaActual === 1}
                        style={{
                            padding: '6px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                            border: 'none', cursor: paginaActual === 1 ? 'default' : 'pointer',
                            background: '#e8f0e0', color: '#4a7c59',
                            opacity: paginaActual === 1 ? 0.4 : 1,
                        }}
                    >Anterior</button>
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                        <button key={n} onClick={() => setPagina(n)} style={{
                            padding: '6px 12px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                            border: 'none', cursor: 'pointer',
                            background: n === paginaActual ? '#4a7c59' : '#e8f0e0',
                            color: n === paginaActual ? '#fff' : '#4a7c59',
                        }}>{n}</button>
                    ))}
                    <button
                        onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                        disabled={paginaActual === totalPaginas}
                        style={{
                            padding: '6px 14px', fontSize: 13, fontWeight: 600, borderRadius: 8,
                            border: 'none', cursor: paginaActual === totalPaginas ? 'default' : 'pointer',
                            background: '#e8f0e0', color: '#4a7c59',
                            opacity: paginaActual === totalPaginas ? 0.4 : 1,
                        }}
                    >Siguiente</button>
                </div>
            )}
        </>
    );
};

export default AgroClimaPage;