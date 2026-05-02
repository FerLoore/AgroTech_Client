import React, { useMemo } from 'react';
import { CloudRain } from 'lucide-react'; 
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroClima } from './useAgroClima';
import type { AgroClima } from './AgroClima.types';

const columnas: ColumnaConfig[] = [
    { header: 'ID', key: 'clim_clima' },
    { header: 'Fecha', key: 'clim_fecha' },
    { header: 'Temperatura (°C)', key: 'clim_temperatura' },
    { header: 'Humedad (%)', key: 'clim_humedad_relativa' },
    { header: 'Precipitación (mm)', key: 'clim_precipitacion' },
    { header: 'Sección', key: 'secc_nombre' },
];

const AgroClimaPage: React.FC = () => {
    const hookData = useAgroClima();

    // Campos dinámicos: el select de sección usa las secciones reales de la BD
    const campos = useMemo<CampoFormulario[]>(() => [
        { key: 'clim_temperatura', label: 'Temperatura (°C)', tipo: 'number', placeholder: 'Ej. 24.5' },
        { key: 'clim_humedad_relativa', label: 'Humedad Relativa (%)', tipo: 'number', placeholder: 'Ej. 65.2' },
        { key: 'clim_precipitacion', label: 'Precipitación (mm)', tipo: 'number', placeholder: 'Ej. 12.0' },
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
        <CrudTabla<AgroClima>
            titulo="Registro Climático"
            subtitulo="AGRO_CLIMA"
            icono={CloudRain as any} 
            
            columnas={columnas}
            campos={campos}
            idKey="clim_clima"
            
            datos={hookData.climas}
            loading={hookData.loading}
            error={hookData.error}
            
            busqueda={hookData.busqueda}
            setBusqueda={hookData.setBusqueda}
            
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
    );
};

export default AgroClimaPage;