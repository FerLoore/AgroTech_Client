import { useEffect, useState } from "react";
import { getArboles, createArbol, updateArbol, deleteArbol } from "../../api/AgroArbol.api";
import { ARBOL_FORM_INICIAL } from "./agroArbol.types";
import type { Arbol, ArbolFormData } from "./agroArbol.types";
import { toast } from "sonner";

export const useAgroArbol = () => {

    const [arboles, setArboles] = useState<Arbol[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Arbol | null>(null);
    const [form, setForm] = useState<ArbolFormData>(ARBOL_FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    // FORMATEADOR DE FECHA (CLAVE)
    const formatFecha = (fecha: string) => {
        try {
            return new Date(fecha).toISOString().split("T")[0];
        } catch {
            return "";
        }
    };

   const cargar = async () => {
    try {
        setLoading(true);
        const data = await getArboles();
        // normalizamos arb_estado a mayúsculas para que coincida con TipoArbol
        const normalizados = data.map((a: Arbol) => ({
            ...a,
            arb_estado: String(a.arb_estado).toUpperCase()
        }));
        setArboles(normalizados);
    } catch {
        setError("Error al cargar árboles");
    } finally {
        setLoading(false);
    }
};

    useEffect(() => { cargar(); }, []);

    const arbolesFiltrados = arboles.filter(a =>
        a.arb_estado.toLowerCase().includes(busqueda.toLowerCase())
    );

    const abrirCrear = () => {
        setEditando(null);
        setForm(ARBOL_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (a: Arbol) => {
        setEditando(a);
        setForm({
            arb_posicion_surco: String(a.arb_posicion_surco),
           
            arb_fecha_siembra: formatFecha(a.arb_fecha_siembra),
            tipar_tipo_arbol: String(a.tipar_tipo_arbol),
            arb_estado: a.arb_estado,
            sur_surcos: String(a.sur_surcos)
        });
        setFormError("");
        setModal(true);
    };

    const handleGuardar = async () => {
        if (!form.arb_posicion_surco || !form.arb_fecha_siembra) {
            setFormError("Campos requeridos");
            return;
        }

        try {
            setGuardando(true);

            if (editando) {
                await updateArbol(editando.arb_arbol, {
                    arb_posicion_surco: Number(form.arb_posicion_surco),
                    arb_estado: form.arb_estado
                });
                toast.success("Actualizado");
            } else {
                await createArbol({
                    arb_posicion_surco: Number(form.arb_posicion_surco),
                    arb_fecha_siembra: form.arb_fecha_siembra, 
                    tipar_tipo_arbol: Number(form.tipar_tipo_arbol),
                    arb_estado: form.arb_estado,
                    sur_surcos: Number(form.sur_surcos)
                });
                toast.success("Creado");
            }

            setModal(false);
            cargar();

        } catch {
            toast.error("Error al guardar");
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (a: Arbol) => {
        await deleteArbol(a.arb_arbol);
        cargar();
        toast.success("Eliminado");
    };

    return {
        arbolesFiltrados,
        loading,
        error,
        busqueda,
        setBusqueda,
        modal,
        editando,
        form,
        setForm,
        guardando,
        formError,
        abrirCrear,
        abrirEditar,
        cerrarModal: () => setModal(false),
        handleGuardar,
        handleEliminar
    };
};