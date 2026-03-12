import { useEffect, useState } from "react";
import { getRoles, createRol, updateRol, deleteRol } from "../../api/Agrorol.api";
import type { Rol, RolFormData } from "./agroRol.types";
import { ROL_FORM_INICIAL } from "./agroRol.types";
import { toast } from "sonner";

export const useAgroRol = () => {

    const [roles, setRoles]         = useState<Rol[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState("");
    const [modal, setModal]         = useState(false);
    const [editando, setEditando]   = useState<Rol | null>(null);
    const [form, setForm]           = useState<RolFormData>(ROL_FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");
    const [busqueda, setBusqueda]   = useState("");

    const cargarRoles = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getRoles();
            setRoles(data);
        } catch {
            setError("Error al cargar los roles. Verifica la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarRoles(); }, []);

    const rolesFiltrados = roles.filter(r =>
        r.rol_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.rol_descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const abrirCrear = () => {
        setEditando(null);
        setForm(ROL_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (rol: Rol) => {
        setEditando(rol);
        setForm({
            rol_nombre:      rol.rol_nombre,
            rol_descripcion: rol.rol_descripcion || "",
            rol_permiso:     String(rol.rol_permiso),
        });
        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    // ── Guardar — crear o editar ──────────────────────────────
    const handleGuardar = async () => {
        if (!form.rol_nombre.trim()) {
            setFormError("El nombre es requerido");
            return;
        }
        if (!form.rol_permiso) {
            setFormError("El nivel de permiso es requerido");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            if (editando) {
                await updateRol(editando.rol_rol, {
                    rol_nombre:      form.rol_nombre,
                    rol_descripcion: form.rol_descripcion,
                    rol_permiso:     Number(form.rol_permiso),
                });
                toast.success("Rol actualizado correctamente");
            } else {
                await createRol({
                    rol_nombre:      form.rol_nombre,
                    rol_descripcion: form.rol_descripcion,
                    rol_permiso:     Number(form.rol_permiso),
                });
                toast.success("Rol creado exitosamente");
            }

            setModal(false);
            cargarRoles();

        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al guardar el rol";
            setFormError(mensaje);
            toast.error(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    // ── Eliminar — confirmación con toast.warning ─────────────
    const handleEliminar = (rol: Rol) => {
        toast.warning(`¿Desactivar el rol "${rol.rol_nombre}"?`, {
            description: "Esta acción desactivará el rol del sistema.",
            action: {
                label: "Desactivar",
                onClick: async () => {
                    try {
                        await deleteRol(rol.rol_rol);
                        cargarRoles();
                        toast.success("Rol desactivado correctamente");
                    } catch (err: unknown) {
                        const mensaje = err instanceof Error ? err.message : "Error al desactivar el rol";
                        toast.error(mensaje);
                    }
                }
            },
            cancel: {
                label: "Cancelar",
                onClick: () => {}
            },
        });
    };

    return {
        roles, rolesFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    };
};