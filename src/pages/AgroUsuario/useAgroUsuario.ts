import { useState, useEffect, useMemo } from 'react';
import { getAgroUsuarios, createAgroUsuario, updateAgroUsuario, deleteAgroUsuario } from '../../api/AgroUsuario.api';
import { getRoles } from '../../api/Agrorol.api'; // Importamos la API de roles
import type { AgroUsuario } from './AgroUsuario.types';

export const useAgroUsuario = () => {
    const [usuarios, setUsuarios] = useState<AgroUsuario[]>([]);
    const [roles, setRoles] = useState<any[]>([]); // Estado para guardar los roles de la base de datos
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [busqueda, setBusqueda] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);
    const [editando, setEditando] = useState<AgroUsuario | null>(null);
    const [form, setForm] = useState<Record<string, any>>({}); 
    const [guardando, setGuardando] = useState<boolean>(false);
    const [formError, setFormError] = useState<string>("");

    // Función modificada para traer Usuarios y Roles al mismo tiempo
    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [resUsuarios, resRoles] = await Promise.all([
                getAgroUsuarios(),
                getRoles()
            ]);
            
            setUsuarios(resUsuarios.data?.usuarios || []);
            // Ajustamos según si tu API devuelve un arreglo directo o viene dentro de 'data'
            setRoles(Array.isArray(resRoles) ? resRoles : (resRoles.data || [])); 
        } catch (err: any) {
            setError(err.message || "Error al obtener los datos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // Transformamos los roles crudos en las 'opciones' que entiende el select de CrudTabla
    const opcionesRoles = roles.map((rol) => ({
        valor: String(rol.rol_rol),       // ID de la tabla rol
        label: String(rol.rol_nombre)     // Nombre visible en el dropdown
    }));

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
            // Formateamos el payload por si el ID del rol necesita ser numérico
            const payload = {
                ...form,
                rol_rol: Number(form.rol_rol)
            };

            if (editando) {
                await updateAgroUsuario(editando.usu_usuario, payload);
            } else {
                await createAgroUsuario(payload);
            }
            await cargarDatos(); // Recargamos para ver los cambios
            setModal(false);
        } catch (err: any) {
            setFormError(err.response?.data?.message || "Error al guardar el usuario");
        } finally {
            setGuardando(false);
        }
    };

    const onEliminar = async (item: AgroUsuario) => {
        if (window.confirm(`¿Estás seguro de desactivar al usuario: ${item.usu_nombre}?`)) {
            try {
                await deleteAgroUsuario(item.usu_usuario);
                await cargarDatos();
            } catch (err: any) {
                alert("Error al eliminar el usuario");
            }
        }
    };

    return {
        usuarios: usuariosFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        opcionesRoles, // <- CRÍTICO: Exportamos esto para que la vista lo consuma
        onNuevo, onEditar, onEliminar, onGuardar, onCerrar
    };
};