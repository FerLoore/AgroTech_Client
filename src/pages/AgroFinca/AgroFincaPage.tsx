import React, { useMemo, useState } from 'react';
import { Map } from 'lucide-react';
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroFinca } from './useAgroFinca';
import type { AgroFinca } from './AgroFinca.types';

const POR_PAGINA = 10;

const columnas: ColumnaConfig[] = [
    { header: 'ID', key: 'fin_finca' },
    { header: 'Nombre Finca', key: 'fin_nombre' },
    { header: 'Ubicación', key: 'fin_ubicacion' },
    { header: 'Hectáreas', key: 'fin_hectarea' },
    { header: 'Dueño', key: 'usu_nombre' },
];

const AgroFincaPage: React.FC = () => {
    const hookData = useAgroFinca();
    const [pagina, setPagina] = useState(1);

    const totalPaginas = Math.max(1, Math.ceil(hookData.fincas.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const desde = (paginaActual - 1) * POR_PAGINA;
    const datosPagina = hookData.fincas.slice(desde, desde + POR_PAGINA);
    const mostrando = hookData.fincas.length === 0
        ? '0'
        : `${desde + 1}–${Math.min(desde + POR_PAGINA, hookData.fincas.length)}`;

    const campos = useMemo<CampoFormulario[]>(() => [
        { key: 'fin_nombre', label: 'Nombre de la Finca', tipo: 'text', placeholder: 'Ej. Finca La Esperanza', rule: 'texto_descriptivo' },
        { key: 'fin_ubicacion', label: 'Ubicación', tipo: 'text', placeholder: 'Ej. Zona Norte', rule: 'direccion' },
        { key: 'fin_hectarea', label: 'Hectáreas', tipo: 'number', placeholder: 'Ej. 50.5', rule: 'numero' },
        {
            key: 'usu_usuario',
            label: 'Dueño',
            tipo: 'select',
            opciones: hookData.usuarios
                .filter(u => u.rol_rol === 1)
                .map(u => ({ valor: String(u.usu_usuario), label: u.usu_nombre })),
        },
    ], [hookData.usuarios]);

    return (
        <>
            <CrudTabla<AgroFinca>
                titulo="Gestión de Fincas"
                subtitulo={`AGRO_FINCA — Mostrando ${mostrando} de ${hookData.fincas.length}`}
                icono={Map as any}
                columnas={columnas}
                campos={campos}
                idKey="fin_finca"
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

export default AgroFincaPage;