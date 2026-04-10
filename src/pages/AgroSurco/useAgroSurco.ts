import { useEffect, useState } from "react";
import { getSurcos, createSurco, updateSurco, deleteSurco } from "../../api/AgroSurco.api";
import { getAgroSecciones } from "../../api/AgroSeccion.api";
import type { Surco, SurcoFormData } from "./agroSurco.types";
import { SURCO_FORM_INICIAL } from "./agroSurco.types";
import { toast } from "sonner";

type Seccion = {
    secc_seccion: number;
    secc_nombre: string;
};

export const useAgroSurco = () => {

    const [surcos, setSurcos] = useState<Surco[]>([]);
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [modal, setModal] = useState(false);
    const [editando, setEditando] = useState<Surco | null>(null);
    const [form, setForm] = useState<SurcoFormData>(SURCO_FORM_INICIAL);
    const [guardando, setGuardando] = useState(false);
    const [formError, setFormError] = useState("");

    // =============================
    // CARGA DE DATOS
    // =============================

    const cargar = async (currentPage = page) => {
        try {
            setLoading(true);
            setError("");
            const data = await getSurcos(currentPage, 100);

            setSurcos(Array.isArray(data) ? data : (data?.surcos || []));
            setTotalPages(data?.totalPages || 1);
        } catch {
            setError("Error al cargar surcos");
        } finally {
            setLoading(false);
        }
    };

    const cargarSecciones = async () => {
        try {
            const res = await getAgroSecciones();
            setSecciones(res.data?.secciones ?? res.data ?? res);
        } catch {
            toast.error("Error al cargar secciones");
        }
    };

    useEffect(() => {
        cargar(page);
        cargarSecciones();
    }, [page]);

    // =============================
    // FILTRO + JOIN CON SECCIONES
    // =============================

    const surcosFiltrados = surcos
        .filter(s =>
            String(s.sur_numero_surco ?? "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(s.sur_orientacion ?? "").toLowerCase().includes(busqueda.toLowerCase())
        )
        .map(s => ({
            ...s,
            secc_nombre:
                secciones.find(sec => sec.secc_seccion === s.secc_secciones)?.secc_nombre
                ?? `ID: ${s.secc_secciones}`
        }));

    // =============================
    // OPCIONES PARA SELECT
    // =============================

    const opcionesSecciones = secciones.map(s => ({
        valor: String(s.secc_seccion),
        label: s.secc_nombre
    }));

    // =============================
    // MODAL
    // =============================

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

    // =============================
    // GUARDAR
    // =============================

    const handleGuardar = async () => {

        if (!form.sur_numero_surco || !form.secc_secciones || !form.sur_espaciamiento) {
            setFormError("Campos obligatorios faltantes");
            return;
        }

        try {
            setGuardando(true);

            const payload = {
                sur_numero_surco: Number(form.sur_numero_surco),
                sur_orientacion: form.sur_orientacion,
                sur_espaciamiento: Number(form.sur_espaciamiento),
                secc_secciones: Number(form.secc_secciones)
            };

            if (editando) {
                await updateSurco(editando.sur_surco, payload);
                toast.success("Surco actualizado");
            } else {
                await createSurco(payload);
                toast.success("Surco creado");
            }

            setModal(false);
            cargar(page);

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Error al guardar";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setGuardando(false);
        }
    };

    // =============================
    // ELIMINAR
    // =============================

    const handleEliminar = (s: Surco) => {
        toast.warning(`¿Desactivar surco ${s.sur_numero_surco}?`, {
            action: {
                label: "Desactivar",
                onClick: async () => {
                    await deleteSurco(s.sur_surco);
                    cargar(page);
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
        handleEliminar,
        opcionesSecciones,
        page,
        setPage,
        totalPages
    };
};