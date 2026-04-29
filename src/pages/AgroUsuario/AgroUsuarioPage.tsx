import React, { useMemo } from 'react';
import { Users } from 'lucide-react'; 
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroUsuario } from './useAgroUsuario';
import type { AgroUsuario } from './AgroUsuario.types';

const AgroUsuarioPage: React.FC = () => {
    const hookData = useAgroUsuario();

    // ── Columnas ──────────────────────────────────────────────
    // Se definen con useMemo para recalcular si los roles cambian
    // ─────────────────────────────────────────────────────────
    const columnas = useMemo<ColumnaConfig[]>(() => [
        { header: 'ID Usuario', key: 'usu_usuario' },
        { header: 'Nombre Completo', key: 'usu_nombre' },
        { 
            header: 'Rol', 
            key: 'rol_rol',
            render: (val) => {
                const rol = hookData.roles.find(r => r.rol_rol === Number(val));
                return rol ? rol.rol_nombre : val;
            }
        },
        { header: 'Especialidad', key: 'usu_especialidad' }
    ], [hookData.roles]);

    // ── Campos del Formulario ────────────────────────────────
    // El campo rol_rol ahora es un 'select' poblado con hookData.roles
    // ─────────────────────────────────────────────────────────
    const campos = useMemo<CampoFormulario[]>(() => [
        { key: 'usu_nombre', label: 'Nombre Completo', tipo: 'text', placeholder: 'Ej. Juan Pérez' },
        { 
            key: 'rol_rol', 
            label: 'Rol', 
            tipo: 'select', 
            opciones: hookData.roles.map(r => ({ 
                valor: String(r.rol_rol), 
                label: r.rol_nombre 
            }))
        },
        { key: 'usu_especialidad', label: 'Especialidad', tipo: 'text', placeholder: 'Ej. Agrónomo' }
    ], [hookData.roles]);

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