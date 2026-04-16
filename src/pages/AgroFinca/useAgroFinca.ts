import { useState, useEffect, useMemo } from 'react';
import { getAgroFincas, createAgroFinca, updateAgroFinca, deleteAgroFinca } from '../../api/AgroFinca.api';
import { getAgroUsuarios } from '../../api/AgroUsuario.api';
import type { AgroFinca } from './AgroFinca.types';
import type { AgroUsuario } from '../AgroUsuario/AgroUsuario.types';
import { toast } from 'sonner';

export const useAgroFinca = () => {
    const [fincas, setFincas] = useState<AgroFinca[]>([]);
    const [usuarios, setUsuarios] = useState<AgroUsuario[]>([]);
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
            const [fincasRes, usersRes] = await Promise.all([
                getAgroFincas(),
                getAgroUsuarios()
            ]);
            setFincas(fincasRes.data.fincas || []);
            setUsuarios(usersRes.data.usuarios || []);
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
            String(f.fin_ubicacion || "").toLowerCase().includes(busqueda.toLowerCase()) ||
            String(f.usu_nombre || "").toLowerCase().includes(busqueda.toLowerCase())
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
                toast.success("Finca actualizada correctamente");
            } else {
                await createAgroFinca(form);
                toast.success("Finca creada exitosamente");
            }
            await fetchFincas();
            setModal(false);
        } catch (err: any) {
            const msg = err.response?.data?.message || "Error al guardar la finca";
            setFormError(msg);
            toast.error(msg);
        } finally {
            setGuardando(false);
        }
    };

    const onEliminar = (item: AgroFinca) => {
        toast.warning(`¿Estás seguro de desactivar la finca: ${item.fin_nombre}?`, {
            action: {
                label: "Desactivar",
                onClick: async () => {
                    try {
                        await deleteAgroFinca(item.fin_finca);
                        await fetchFincas();
                        toast.success("Finca desactivada correctamente");
                    } catch (err: any) {
                        toast.error("Error al eliminar la finca");
                    }
                }
            },
            cancel: { label: "Cancelar", onClick: () => {} }
        });
    };

    return {
        fincas: fincasFiltradas, usuarios, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        onNuevo, onEditar, onEliminar, onGuardar, onCerrar
    };
};