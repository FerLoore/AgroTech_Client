import React from 'react';
import { Grid } from 'lucide-react'; 
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroSeccion } from './useAgroSeccion';
import type { AgroSeccion } from './AgroSeccion.types';

const columnas: ColumnaConfig[] = [
    { header: 'ID', key: 'secc_seccion' },
    { header: 'Nombre de Sección', key: 'secc_nombre' },
    { header: 'Tipo de Suelo', key: 'secc_tipo_suelo' },
    { header: 'ID Finca', key: 'fin_finca' }
];

const campos: CampoFormulario[] = [
    { key: 'secc_nombre', label: 'Nombre de la Sección', tipo: 'text', placeholder: 'Ej. Sección Norte' },
    { key: 'secc_tipo_suelo', label: 'Tipo de Suelo', tipo: 'text', placeholder: 'Ej. Franco Arcilloso' },
    { key: 'fin_finca', label: 'ID de la Finca', tipo: 'number', placeholder: 'Ej. 1' }
];

const AgroSeccionPage: React.FC = () => {
    const hookData = useAgroSeccion();

    return (
        <CrudTabla<AgroSeccion>
            titulo="Gestión de Secciones"
            subtitulo="AGRO_SECCION"
            icono={Grid as any} 
            
            columnas={columnas}
            campos={campos}
            idKey="secc_seccion"
            
            datos={hookData.secciones}
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

export default AgroSeccionPage;