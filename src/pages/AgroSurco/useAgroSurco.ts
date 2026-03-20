import { useEffect, useState } from "react";
import { getSurcos, createSurco, updateSurco, deleteSurco } from "../../api/AgroSurco.api";
import type { Surco, SurcoFormData } from "./agroSurco.types";
import { SURCO_FORM_INICIAL } from "./agroSurco.types";
import { toast } from "sonner";

export const useAgroSurco = () => {

    const [surcos, setSurcos] = useState<Surco[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Surco | null>(null);
    const [form, setForm] = useState<SurcoFormData>(SURCO_FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    const cargar = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getSurcos();
            setSurcos(data);
        } catch {
            setError("Error al cargar surcos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargar();
    }, []);

    const surcosFiltrados = surcos.filter(s =>
        String(s.sur_numero_surco ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(s.sur_orientacion ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
        String(s.secc_secciones ?? "").toLowerCase().includes(busqueda.toLowerCase())
    );

    const abrirCrear = () => {
        setEditando(null);
        setForm(SURCO_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (s: Surco) => {
        setEditando(s);
        setForm({
            sur_numero_surco: String(s.sur_numero_surco),
            sur_orientacion: s.sur_orientacion || "",
            sur_espaciamiento: String(s.sur_espaciamiento),
            secc_secciones: String(s.secc_secciones)
        });
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    const handleGuardar = async () => {

        if (!form.sur_numero_surco || !form.secc_secciones || !form.sur_espaciamiento) {
            setFormError("Campos obligatorios faltantes");
            return;
        }

        try {
            setGuardando(true);

            if (editando) {
                await updateSurco(editando.sur_surco, {
                    sur_numero_surco: Number(form.sur_numero_surco),
                    sur_orientacion: form.sur_orientacion,
                    sur_espaciamiento: Number(form.sur_espaciamiento)
                });

                toast.success("Surco actualizado");
            } else {
                await createSurco({
                    sur_numero_surco: Number(form.sur_numero_surco),
                    sur_orientacion: form.sur_orientacion,
                    sur_espaciamiento: Number(form.sur_espaciamiento),
                    secc_secciones: Number(form.secc_secciones)
                });

                toast.success("Surco creado");
            }

            setModal(false);
            cargar();

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al guardar";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = (s: Surco) => {
        toast.warning(`¿Desactivar surco ${s.sur_numero_surco}?`, {
            action: {
                label: "Desactivar",
                onClick: async () => {
                    await deleteSurco(s.sur_surco);
                    cargar();
                    toast.success("Surco desactivado");
                }
            }
        });
    };

    return {
        surcosFiltrados,
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
        cerrarModal,
        handleGuardar,
        handleEliminar
    };
};