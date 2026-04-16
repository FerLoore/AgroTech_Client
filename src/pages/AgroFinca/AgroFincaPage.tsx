import React, { useMemo } from 'react';
import { Map } from 'lucide-react'; 
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroFinca } from './useAgroFinca';
import type { AgroFinca } from './AgroFinca.types';

const columnas: ColumnaConfig[] = [
    { header: 'ID', key: 'fin_finca' },
    { header: 'Nombre Finca', key: 'fin_nombre' },
    { header: 'Ubicación', key: 'fin_ubicacion' },
    { header: 'Hectáreas', key: 'fin_hectarea' },
    { header: 'Dueño', key: 'usu_nombre' }
];

const AgroFincaPage: React.FC = () => {
    const hookData = useAgroFinca();

    // ── Campos del Formulario ────────────────────────────────
    // El campo usu_usuario ahora es un 'select' poblado dinámicamente
    // ─────────────────────────────────────────────────────────
    const campos = useMemo<CampoFormulario[]>(() => [
        { key: 'fin_nombre', label: 'Nombre de la Finca', tipo: 'text', placeholder: 'Ej. Finca La Esperanza' },
        { key: 'fin_ubicacion', label: 'Ubicación', tipo: 'text', placeholder: 'Ej. Zona Norte' },
        { key: 'fin_hectarea', label: 'Hectáreas', tipo: 'number', placeholder: 'Ej. 50.5' },
        { 
            key: 'usu_usuario', 
            label: 'Dueño', 
            tipo: 'select', 
            opciones: hookData.usuarios
                .filter(u => u.rol_rol === 1) // Solo Administradores (o ID 1 como solicitó el usuario)
                .map(u => ({ 
                    valor: String(u.usu_usuario), 
                    label: u.usu_nombre 
                }))
        }
    ], [hookData.usuarios]);

    return (
        <CrudTabla<AgroFinca>
            titulo="Gestión de Fincas"
            subtitulo="AGRO_FINCA"
            icono={Map as any} 
            
            columnas={columnas}
            campos={campos}
            idKey="fin_finca"
            
            datos={hookData.fincas}
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
        />
    );
};

export default AgroFincaPage;