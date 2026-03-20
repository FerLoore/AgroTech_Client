import { useState, useEffect, useMemo } from 'react';
import { getAgroFincas, createAgroFinca, updateAgroFinca, deleteAgroFinca } from '../../api/AgroFinca.api';
import type { AgroFinca } from './AgroFinca.types';

export const useAgroFinca = () => {
    const [fincas, setFincas] = useState<AgroFinca[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [busqueda, setBusqueda] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);
    const [editando, setEditando] = useState<AgroFinca | null>(null);
    const [form, setForm] = useState<Record<string, any>>({}); 
    const [guardando, setGuardando] = useState<boolean>(false);
    const [formError, setFormError] = useState<string>("");

    const fetchFincas = async () => {
        setLoading(true);
        try {
            const response = await getAgroFincas();
            // Asumiendo que tu backend devuelve un objeto con "fincas: [...]"
            setFincas(response.data.fincas || []);
        } catch (err: any) {
            setError(err.message || "Error al obtener las fincas");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFincas();
    }, []);

    const fincasFiltradas = useMemo(() => {
        return fincas.filter(f => 
            String(f.fin_nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(f.fin_ubicacion || "").toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [fincas, busqueda]);

    const onNuevo = () => {
        setEditando(null);
        setForm({ fin_nombre: "", fin_ubicacion: "", fin_hectarea: "", usu_usuario: "" }); 
        setFormError("");
        setModal(true);
    };

    const onEditar = (item: AgroFinca) => {
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
                await updateAgroFinca(editando.fin_finca, form);
            } else {
                await createAgroFinca(form);
            }
            await fetchFincas();
            setModal(false);
        } catch (err: any) {
            setFormError(err.response?.data?.message || "Error al guardar la finca");
        } finally {
            setGuardando(false);
        }
    };

    const onEliminar = async (item: AgroFinca) => {
        if (window.confirm(`¿Estás seguro de desactivar la finca: ${item.fin_nombre}?`)) {
            try {
                await deleteAgroFinca(item.fin_finca);
                await fetchFincas();
            } catch (err: any) {
                alert("Error al eliminar la finca");
            }
        }
    };

    return {
        fincas: fincasFiltradas, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        onNuevo, onEditar, onEliminar, onGuardar, onCerrar
    };
};