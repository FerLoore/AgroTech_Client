import { useEffect, useState } from "react";
import { getCatalogoPatogenos, createCatalogoPatogeno, updateCatalogoPatogeno, deleteCatalogoPatogeno } from "../../api/AgroCatalogoPatogeno.api";
import type { CatalogoPatogeno, CatalogoPatogenoFormData } from "./AgroCatalogoPatogeno.types";
import { CATALOGO_PATOGENO_FORM_INICIAL } from "./AgroCatalogoPatogeno.types";
import { toast } from "sonner";

export const useAgroCatalogoPatogeno = () => {

    const [patogenos, setPatogenos]     = useState<CatalogoPatogeno[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");
    const [busqueda, setBusqueda]       = useState("");
    const [modal, setModal]             = useState(false);
    const [editando, setEditando]       = useState<CatalogoPatogeno | null>(null);
    const [form, setForm]               = useState<CatalogoPatogenoFormData>(CATALOGO_PATOGENO_FORM_INICIAL);
    const [guardando, setGuardando]     = useState(false);
    const [formError, setFormError]     = useState("");

    const cargarPatogenos = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getCatalogoPatogenos();
            setPatogenos(data);
        } catch {
            setError("Error al cargar el catálogo de patógenos. Verifica la conexión.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarPatogenos(); }, []);

    const patogenosFiltrados = patogenos.filter(p =>
        p.catpato_nombre_comun.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.catpato_nombre_cientifico?.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.catpato_tipo.toLowerCase().includes(busqueda.toLowerCase())
    );

    const abrirCrear = () => {
        setEditando(null);
        setForm(CATALOGO_PATOGENO_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (patogeno: CatalogoPatogeno) => {
        setEditando(patogeno);
        setForm({
            catpato_nombre_comun:      patogeno.catpato_nombre_comun,
            catpato_nombre_cientifico: patogeno.catpato_nombre_cientifico || "",
            catpato_tipo:              patogeno.catpato_tipo,
            catpato_gravedad:          String(patogeno.catpato_gravedad),
        });
        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    const handleGuardar = async () => {
        if (!form.catpato_nombre_comun.trim()) {
            setFormError("El nombre común es requerido");
            return;
        }
        if (!form.catpato_tipo) {
            setFormError("El tipo de patógeno es requerido");
            return;
        }
        if (!form.catpato_gravedad) {
            setFormError("La gravedad es requerida");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            const payload = {
                catpato_nombre_comun:      form.catpato_nombre_comun,
                catpato_nombre_cientifico: form.catpato_nombre_cientifico || undefined,
                catpato_tipo:              form.catpato_tipo,
                catpato_gravedad:          Number(form.catpato_gravedad),
            };

            if (editando) {
                await updateCatalogoPatogeno(editando.catpato_catalogo_patogeno, payload);
                toast.success("Patógeno actualizado correctamente");
            } else {
                await createCatalogoPatogeno(payload);
                toast.success("Patógeno creado exitosamente");
            }

            setModal(false);
            cargarPatogenos();

        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al guardar el patógeno";
            setFormError(mensaje);
            toast.error(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = (patogeno: CatalogoPatogeno) => {
        toast.warning(`¿Desactivar "${patogeno.catpato_nombre_comun}"?`, {
            description: "Esta acción desactivará el patógeno del catálogo.",
            action: {
                label: "Desactivar",
                onClick: async () => {
                    try {
                        await deleteCatalogoPatogeno(patogeno.catpato_catalogo_patogeno);
                        cargarPatogenos();
                        toast.success("Patógeno desactivado correctamente");
                    } catch (err: unknown) {
                        const mensaje = err instanceof Error ? err.message : "Error al desactivar";
                        toast.error(mensaje);
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} },
        });
    };

    return {
        patogenos, patogenosFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    };
};