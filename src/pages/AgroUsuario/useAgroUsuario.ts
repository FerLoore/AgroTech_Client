import { useState, useEffect, useMemo } from 'react';
import { getAgroUsuarios, createAgroUsuario, updateAgroUsuario, deleteAgroUsuario } from '../../api/AgroUsuario.api';
import { getRoles } from '../../api/Agrorol.api';
import type { AgroUsuario } from './AgroUsuario.types';
import type { Rol } from '../AgroRol/AgroRol.types';
import { toast } from 'sonner';

export const useAgroUsuario = () => {
    const [usuarios, setUsuarios] = useState<AgroUsuario[]>([]);
    const [roles, setRoles] = useState<Rol[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [busqueda, setBusqueda] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);
    const [editando, setEditando] = useState<AgroUsuario | null>(null);
    const [form, setForm] = useState<Record<string, any>>({}); // 🛡️ 'any' para evitar conflictos
    const [guardando, setGuardando] = useState<boolean>(false);
    const [formError, setFormError] = useState<string>("");

    const fetchUsuarios = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                getAgroUsuarios(),
                getRoles()
            ]);
            setUsuarios(usersRes.data.usuarios || []);
            setRoles(rolesRes || []);
        } catch (err: any) {
            setError(err.message || "Error al obtener los usuarios");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter(u => 
            String(u.usu_nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(u.usu_especialidad || "").toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [usuarios, busqueda]);

    const onNuevo = () => {
        setEditando(null);
        setForm({ usu_nombre: "", rol_rol: "", usu_especialidad: "" }); 
        setFormError("");
        setModal(true);
    };

    const onEditar = (item: AgroUsuario) => {
        setEditando(item);
        setForm({ ...item });
        setFormError("");
        setModal(true);
    };

    const onCerrar = () => {
        setModal(false);
    };

    const onGuardar = async () => {
        setGuardando(true);
        setFormError("");
        try {
            if (editando) {
                await updateAgroUsuario(editando.usu_usuario, form);
                toast.success("Usuario actualizado correctamente");
            } else {
                await createAgroUsuario(form);
                toast.success("Usuario creado exitosamente");
            }
            await fetchUsuarios();
            setModal(false);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Error al guardar el usuario";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setGuardando(false);
        }
    };

    const onEliminar = (item: AgroUsuario) => {
        toast.warning(`¿Estás seguro de desactivar al usuario: ${item.usu_nombre}?`, {
            action: {
                label: "Desactivar",
                onClick: async () => {
                    try {
                        await deleteAgroUsuario(item.usu_usuario);
                        await fetchUsuarios();
                        toast.success("Usuario desactivado correctamente");
                    } catch (err: any) {
                        toast.error("Error al eliminar el usuario");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} }
        });
    };

    return {
        usuarios: usuariosFiltrados, roles, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        onNuevo, onEditar, onEliminar, onGuardar, onCerrar
    };
};