import { useState, useEffect, useMemo } from 'react';
import { getAgroSecciones, createAgroSeccion, updateAgroSeccion, deleteAgroSeccion } from '../../api/AgroSeccion.api';
import type { AgroSeccion } from './AgroSeccion.types';

export const useAgroSeccion = () => {
    const [secciones, setSecciones] = useState<AgroSeccion[]>([]);
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
            const response = await getAgroSecciones();
            setSecciones(Array.isArray(response) ? response : (response?.secciones || []));
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
            String(s.secc_tipo_suelo || "").toLowerCase().includes(busqueda.toLowerCase())
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
            } else {
                await createAgroSeccion(form);
            }
            await fetchSecciones();
            setModal(false);
        } catch (err: any) {
            setFormError(err.response?.data?.message || "Error al guardar la sección");
        } finally {
            setGuardando(false);
        }
    };

    const onEliminar = async (item: AgroSeccion) => {
        if (window.confirm(`¿Estás seguro de desactivar la sección: ${item.secc_nombre}?`)) {
            try {
                await deleteAgroSeccion(item.secc_seccion);
                await fetchSecciones();
            } catch (err: any) {
                alert("Error al eliminar la sección");
            }
        }
    };

    return {
        secciones: seccionesFiltradas, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        onNuevo, onEditar, onEliminar, onGuardar, onCerrar
    };
};