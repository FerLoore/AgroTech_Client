import { useState, useEffect, useMemo } from 'react';
import { getAgroClimas, createAgroClima, updateAgroClima, deleteAgroClima } from '../../api/AgroClima.api';
import { getAgroSecciones } from '../../api/AgroSeccion.api';
import type { AgroClima } from './AgroClima.types';
import { toast } from 'sonner';

export interface SeccionOption {
    secc_seccion: number;
    secc_nombre: string;
    fin_nombre?: string;
}

export const useAgroClima = () => {
    const [climas, setClimas] = useState<AgroClima[]>([]);
    const [secciones, setSecciones] = useState<SeccionOption[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const [busqueda, setBusqueda] = useState<string>("");

    const [modal, setModal] = useState<boolean>(false);
    const [editando, setEditando] = useState<AgroClima | null>(null);
    const [form, setForm] = useState<Record<string, any>>({}); 
    const [guardando, setGuardando] = useState<boolean>(false);
    const [formError, setFormError] = useState<string>("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [climaRes, seccionRes] = await Promise.all([
                getAgroClimas(),
                getAgroSecciones(),
            ]);
            setClimas(climaRes.data.climas || []);
            setSecciones(seccionRes.data.secciones || []);
        } catch (err: any) {
            setError(err.message || "Error al obtener los registros climáticos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const climasFiltrados = useMemo(() => {
        return climas.filter(c => 
            String(c.clim_fecha || "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(c.clim_temperatura || "").includes(busqueda) ||
            String((c as any).secc_nombre || "").toLowerCase().includes(busqueda.toLowerCase())
        );
    }, [climas, busqueda]);

    const onNuevo = () => {
        setEditando(null);
        setForm({ clim_temperatura: "", clim_humedad_relativa: "", clim_precipitacion: "", seccionId: "" }); 
        setFormError("");
        setModal(true);
    };

    const onEditar = (item: AgroClima) => {
        setEditando(item);
        // Mapear secc_seccion → seccionId para que el form lo maneje
        setForm({ 
            clim_temperatura: item.clim_temperatura,
            clim_humedad_relativa: item.clim_humedad_relativa,
            clim_precipitacion: item.clim_precipitacion,
            seccionId: (item as any).secc_seccion ?? item.seccionId ?? "",
        });
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
                await updateAgroClima(editando.clim_clima, form);
                toast.success("Registro climático actualizado correctamente");
            } else {
                await createAgroClima(form);
                toast.success("Registro climático creado exitosamente");
            }
            await fetchData();
            setModal(false);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Error al guardar el clima";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setGuardando(false);
        }
    };

    const onEliminar = (item: AgroClima) => {
        toast.warning(`¿Estás seguro de ELIMINAR permanentemente este registro climático?`, {
            action: {
                label: "Eliminar",
                onClick: async () => {
                    try {
                        await deleteAgroClima(item.clim_clima);
                        await fetchData();
                        toast.success("Registro climático eliminado correctamente");
                    } catch (err: any) {
                        toast.error("Error al eliminar el registro");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} }
        });
    };

    return {
        climas: climasFiltrados, secciones, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        onNuevo, onEditar, onEliminar, onGuardar, onCerrar
    };
};