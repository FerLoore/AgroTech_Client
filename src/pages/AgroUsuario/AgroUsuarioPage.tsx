import React from 'react';
import { Users } from 'lucide-react'; 
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroUsuario } from './useAgroUsuario';
import type { AgroUsuario } from './AgroUsuario.types';

const columnas: ColumnaConfig[] = [
    { header: 'ID Usuario', key: 'usu_usuario' },
    { header: 'Nombre Completo', key: 'usu_nombre' },
    { header: 'ID Rol', key: 'rol_rol' },
    { header: 'Especialidad', key: 'usu_especialidad' }
];

const campos: CampoFormulario[] = [
    { key: 'usu_nombre', label: 'Nombre Completo', tipo: 'text', placeholder: 'Ej. Juan Pérez' },
    { key: 'rol_rol', label: 'ID del Rol', tipo: 'number', placeholder: 'Ej. 1' },
    { key: 'usu_especialidad', label: 'Especialidad', tipo: 'text', placeholder: 'Ej. Agrónomo' }
];

const AgroUsuarioPage: React.FC = () => {
    const hookData = useAgroUsuario();

    return (
        <CrudTabla<AgroUsuario>
            titulo="Gestión de Usuarios"
            subtitulo="AGRO_USUARIO"
            icono={Users as any} // 🛡️ Evita peleas de versiones de lucide-react
            
            columnas={columnas}
            campos={campos}
            idKey="usu_usuario"
            
            datos={hookData.usuarios}
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

export default AgroUsuarioPage;