import { useState, useEffect, useMemo } from 'react';
import { getAgroSecciones, createAgroSeccion, updateAgroSeccion, deleteAgroSeccion } from '../../api/AgroSeccion.api';
import { getAgroFincas } from '../../api/AgroFinca.api';
import type { AgroSeccion } from './AgroSeccion.types';
import type { AgroFinca } from '../AgroFinca/AgroFinca.types';
import { toast } from 'sonner';

export const useAgroSeccion = () => {
    const [secciones, setSecciones] = useState<AgroSeccion[]>([]);
    const [fincas, setFincas] = useState<AgroFinca[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [busqueda, setBusqueda] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);
    const [editando, setEditando] = useState<AgroSeccion | null>(null);
    const [form, setForm] = useState<Record<string, any>>({}); 
    const [guardando, setGuardando] = useState<boolean>(false);
    const [formError, setFormError] = useState<string>("");

    const fetchSecciones = async () => {
        setLoading(true);
        try {
            const [seccionesRes, fincasRes] = await Promise.all([
                getAgroSecciones(),
                getAgroFincas()
            ]);
            setSecciones(seccionesRes.data.secciones || []);
            setFincas(fincasRes.data.fincas || []);
        } catch (err: any) {
            setError(err.message || "Error al obtener las secciones");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSecciones();
    }, []);

    const seccionesFiltradas = useMemo(() => {
        return secciones.filter(s => 
            String(s.secc_nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(s.secc_tipo_suelo || "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(s.fin_nombre || "").toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [secciones, busqueda]);

    const onNuevo = () => {
        setEditando(null);
        setForm({ secc_nombre: "", secc_tipo_suelo: "", fin_finca: "" }); 
        setFormError("");
        setModal(true);
    };

    const onEditar = (item: AgroSeccion) => {
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
                await updateAgroSeccion(editando.secc_seccion, form);
                toast.success("Sección actualizada correctamente");
            } else {
                await createAgroSeccion(form);
                toast.success("Sección creada exitosamente");
            }
            await fetchSecciones();
            setModal(false);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Error al guardar la sección";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setGuardando(false);
        }
    };

    const onEliminar = (item: AgroSeccion) => {
        toast.warning(`¿Estás seguro de desactivar la sección: ${item.secc_nombre}?`, {
            action: {
                label: "Desactivar",
                onClick: async () => {
                    try {
                        await deleteAgroSeccion(item.secc_seccion);
                        await fetchSecciones();
                        toast.success("Sección desactivada correctamente");
                    } catch (err: any) {
                        toast.error("Error al eliminar la sección");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} }
        });
    };

    return {
        secciones: seccionesFiltradas, fincas, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        onNuevo, onEditar, onEliminar, onGuardar, onCerrar
    };
};