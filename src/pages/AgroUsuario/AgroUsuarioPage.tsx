import React, { useMemo, useState } from 'react';
import { Users } from 'lucide-react';
import CrudTabla, { type ColumnaConfig, type CampoFormulario } from '../../components/CrudTabla';
import { useAgroUsuario } from './useAgroUsuario';
import type { AgroUsuario } from './AgroUsuario.types';

const POR_PAGINA = 10;

const AgroUsuarioPage: React.FC = () => {
    const hookData = useAgroUsuario();
    const [pagina, setPagina] = useState(1);

    const totalPaginas = Math.max(1, Math.ceil(hookData.usuarios.length / POR_PAGINA));
    const paginaActual = Math.min(pagina, totalPaginas);
    const desde = (paginaActual - 1) * POR_PAGINA;
    const datosPagina = hookData.usuarios.slice(desde, desde + POR_PAGINA);
    const mostrando = hookData.usuarios.length === 0
        ? '0'
        : `${desde + 1}–${Math.min(desde + POR_PAGINA, hookData.usuarios.length)}`;

    const columnas = useMemo<ColumnaConfig[]>(() => [
        { header: 'ID Usuario', key: 'usu_usuario' },
        { header: 'Nombre Completo', key: 'usu_nombre' },
        {
            header: 'Rol',
            key: 'rol_rol',
            render: (val) => {
                const rol = hookData.roles.find(r => r.rol_rol === Number(val));
                return rol ? rol.rol_nombre : val;
            },
        },
        { header: 'Especialidad', key: 'usu_especialidad' },
    ], [hookData.roles]);

    const campos = useMemo<CampoFormulario[]>(() => [
        { key: 'usu_nombre', label: 'Nombre Completo', tipo: 'text', placeholder: 'Ej. Juan Pérez' },
        {
            key: 'rol_rol',
            label: 'Rol',
            tipo: 'select',
            opciones: hookData.roles.map(r => ({ valor: String(r.rol_rol), label: r.rol_nombre })),
        },
        { key: 'usu_especialidad', label: 'Especialidad', tipo: 'text', placeholder: 'Ej. Agrónomo' },
    ], [hookData.roles]);

    return (
        <>
            <CrudTabla<AgroUsuario>
                titulo="Gestión de Usuarios"
                subtitulo={`AGRO_USUARIO — Mostrando ${mostrando} de ${hookData.usuarios.length}`}
                icono={Users as any}
                columnas={columnas}
                campos={campos}
                idKey="usu_usuario"
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

export default AgroUsuarioPage;