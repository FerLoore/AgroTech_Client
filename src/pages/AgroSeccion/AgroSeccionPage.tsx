import React, { useMemo, useState } from 'react';
import { Grid } from 'lucide-react';
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroSeccion } from './useAgroSeccion';
import type { AgroSeccion } from './AgroSeccion.types';

const POR_PAGINA = 10;

const columnas: ColumnaConfig[] = [
    { header: 'ID', key: 'secc_seccion' },
    { header: 'Nombre de Sección', key: 'secc_nombre' },
    { header: 'Tipo de Suelo', key: 'secc_tipo_suelo' },
    { header: 'Finca', key: 'fin_nombre' },
];

const AgroSeccionPage: React.FC = () => {
    const hookData = useAgroSeccion();
    const [pagina, setPagina] = useState(1);

    const totalPaginas = Math.max(1, Math.ceil(hookData.secciones.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const desde = (paginaActual - 1) * POR_PAGINA;
    const datosPagina = hookData.secciones.slice(desde, desde + POR_PAGINA);
    const mostrando = hookData.secciones.length === 0
        ? '0'
        : `${desde + 1}–${Math.min(desde + POR_PAGINA, hookData.secciones.length)}`;

    const campos = useMemo<CampoFormulario[]>(() => [
        { key: 'secc_nombre', label: 'Nombre de la Sección', tipo: 'text', placeholder: 'Ej. Sección Norte', rule: 'texto_descriptivo' },
        { key: 'secc_tipo_suelo', label: 'Tipo de Suelo', tipo: 'text', placeholder: 'Ej. Franco Arcilloso', rule: 'texto_descriptivo' },
        {
            key: 'fin_finca',
            label: 'Finca',
            tipo: 'select',
            opciones: hookData.fincas.map(f => ({
                valor: String(f.fin_finca),
                label: f.fin_nombre,
            })),
        },
    ], [hookData.fincas]);

    return (
        <>
            <CrudTabla<AgroSeccion>
                titulo="Gestión de Secciones"
                subtitulo={`AGRO_SECCION — Mostrando ${mostrando} de ${hookData.secciones.length}`}
                icono={Grid as any}
                columnas={columnas}
                campos={campos}
                idKey="secc_seccion"
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

export default AgroSeccionPage;