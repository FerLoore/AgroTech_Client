// ============================================================
// useAgroRol.ts — Custom Hook
// Contiene TODA la lógica de la feature AgroRol:
//   - Estado de la tabla (lista, búsqueda, loading, error)
//   - Estado del modal (abierto, editando, form, errores)
//   - Operaciones CRUD (crear, editar, desactivar)
//   - Comunicación con la API
//   - Notificaciones con toast
//
// La página (AgroRolPage) y el componente visual (CrudTabla)
// no saben NADA de cómo funciona esto — solo consumen
// lo que este hook expone en su return.
// ============================================================

import { useEffect, useState } from "react";
import { getRoles, createRol, updateRol, deleteRol } from "../../api/Agrorol.api";
import type { Rol, RolFormData } from "./agroRol.types";
import { ROL_FORM_INICIAL } from "./agroRol.types";
import { toast } from "sonner";

export const useAgroRol = () => {

    // ----------------------------------------------------------
    // ESTADO — tabla
    // ----------------------------------------------------------

    // Lista completa de roles que viene de la API
    const [roles, setRoles] = useState<Rol[]>([]);

    // true mientras se espera respuesta de la API al cargar
    const [loading, setLoading] = useState(true);

    // Mensaje de error si falla la carga inicial
    const [error, setError] = useState("");

    // Texto del buscador — filtra roles en tiempo real
    const [busqueda, setBusqueda] = useState("");

    // ----------------------------------------------------------
    // ESTADO — modal
    // ----------------------------------------------------------

    // Controla si el modal está abierto o cerrado
    const [modal, setModal] = useState(false);

    // null = modo CREAR / Rol = modo EDITAR (guarda el registro original)
    const [editando, setEditando] = useState<Rol | null>(null);

    // Valores actuales de los inputs del formulario
    const [form, setForm] = useState<RolFormData>(ROL_FORM_INICIAL);

    // true mientras se espera respuesta al guardar (deshabilita el botón)
    const [guardando, setGuardando] = useState(false);

    // Error de validación o de API que se muestra dentro del modal
    const [formError, setFormError] = useState("");

    // ----------------------------------------------------------
    // CARGA INICIAL — se ejecuta al montar el componente
    // ----------------------------------------------------------

    const cargarRoles = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getRoles(); // llama a GET /agro-roles
            setRoles(data);               // guarda la lista en el estado
        } catch {
            // Si la API falla, muestra mensaje en la página (no toast)
            // porque es un error de carga, no de acción del usuario
            setError("Error al cargar los roles. Verifica la conexión con el servidor.");
        } finally {
            setLoading(false); // siempre se quita el loading, haya error o no
        }
    };

    // useEffect con [] = ejecuta cargarRoles solo una vez al montar
    useEffect(() => { cargarRoles(); }, []);

    // ----------------------------------------------------------
    // BÚSQUEDA — filtrado en memoria (sin llamada a API)
    // Se recalcula automáticamente cada vez que cambia
    // `roles` o `busqueda`.
    // ----------------------------------------------------------
    const rolesFiltrados = roles.filter(r =>
        r.rol_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        r.rol_descripcion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    // ----------------------------------------------------------
    // MODAL — abrir en modo CREAR
    // Resetea el formulario y limpia el registro en edición
    // ----------------------------------------------------------
    const abrirCrear = () => {
        setEditando(null);           // sin registro previo = modo crear
        setForm(ROL_FORM_INICIAL);   // limpia todos los inputs
        setFormError("");            // limpia errores anteriores
        setModal(true);
    };

    // ----------------------------------------------------------
    // MODAL — abrir en modo EDITAR
    // Pre-carga el formulario con los datos del rol seleccionado
    // ----------------------------------------------------------
    const abrirEditar = (rol: Rol) => {
        setEditando(rol);            // guarda el rol original para el PUT
        setForm({
            rol_nombre:      rol.rol_nombre,
            rol_descripcion: rol.rol_descripcion || "",
            rol_permiso:     String(rol.rol_permiso), // number → string para el input
        });
        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    // ----------------------------------------------------------
    // GUARDAR — crear o editar según el estado de `editando`
    //
    // Flujo:
    //   1. Validar campos requeridos (sin llamar a la API)
    //   2. Llamar a createRol o updateRol según corresponda
    //   3. Si OK → cerrar modal, recargar lista, toast success
    //   4. Si error → mostrar en el modal y toast error
    // ----------------------------------------------------------
    const handleGuardar = async () => {

        // Validaciones frontend — evitan llamadas innecesarias a la API
        if (!form.rol_nombre.trim()) {
            setFormError("El nombre es requerido");
            return;
        }
        if (!form.rol_permiso) {
            setFormError("El nivel de permiso es requerido");
            return;
        }

        try {
            setGuardando(true);  // deshabilita el botón "Guardar"
            setFormError("");

            if (editando) {
                // ── EDITAR ── PUT /agro-roles/:id
                await updateRol(editando.rol_rol, {
                    rol_nombre:      form.rol_nombre,
                    rol_descripcion: form.rol_descripcion,
                    rol_permiso:     Number(form.rol_permiso), // string → number para la API
                });
                toast.success("Rol actualizado correctamente");
            } else {
                // ── CREAR ── POST /agro-roles
                // No se envía rol_rol — el trigger Oracle lo asigna
                await createRol({
                    rol_nombre:      form.rol_nombre,
                    rol_descripcion: form.rol_descripcion,
                    rol_permiso:     Number(form.rol_permiso),
                });
                toast.success("Rol creado exitosamente");
            }

            setModal(false);  // cierra el modal
            cargarRoles();    // recarga la lista para mostrar el cambio

        } catch (err: unknown) {
            // Extrae el mensaje de error de forma segura
            const mensaje = err instanceof Error ? err.message : "Error al guardar el rol";
            setFormError(mensaje);   // muestra el error dentro del modal
            toast.error(mensaje);    // también como toast
        } finally {
            setGuardando(false); // siempre reactiva el botón
        }
    };

    // ----------------------------------------------------------
    // ELIMINAR — borrado lógico con confirmación via toast
    //
    // Flujo:
    //   1. Muestra toast.warning con botones Desactivar/Cancelar
    //   2. Si el usuario confirma → DELETE /agro-roles/:id
    //      (el backend pone rol_activo = 0, no borra el registro)
    //   3. Recarga la lista y muestra toast.success
    //   4. Si cancela → no hace nada
    // ----------------------------------------------------------
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
                onClick: () => {} // no hace nada — el toast se cierra solo
            },
        });
    };

    // ----------------------------------------------------------
    // RETURN — todo lo que expone el hook
    // La página desestructura solo lo que necesita.
    // ----------------------------------------------------------
    return {
        roles,            // lista completa (usada para conteo)
        rolesFiltrados,   // lista filtrada por búsqueda (usada en la tabla)
        loading,          // para mostrar spinner
        error,            // para mostrar mensaje de error de carga
        busqueda,         // valor actual del buscador
        setBusqueda,      // actualiza el buscador (conectado al input)
        modal,            // si el modal está abierto
        editando,         // rol en edición (null = modo crear)
        form,             // valores actuales del formulario
        setForm,          // actualiza el formulario (conectado a los inputs)
        guardando,        // deshabilita el botón guardar mientras espera
        formError,        // error que se muestra dentro del modal
        abrirCrear,       // abre el modal en modo crear
        abrirEditar,      // abre el modal en modo editar con datos pre-cargados
        cerrarModal,      // cierra el modal
        handleGuardar,    // ejecuta crear o editar según contexto
        handleEliminar,   // muestra confirmación y ejecuta desactivar
    };
};