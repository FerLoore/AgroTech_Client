import { useEffect, useState } from "react";
import { getProductos, createProducto, updateProducto, deleteProducto } from "../../api/AgroProducto.api";
import type { Producto, ProductoFormData } from "./AgroProducto.types";
import { PRODUCTO_FORM_INICIAL } from "./AgroProducto.types";
import { toast } from "sonner";

export const useAgroProducto = () => {

    const [productos, setProductos]   = useState<Producto[]>([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState("");
    const [busqueda, setBusqueda]     = useState("");
    const [modal, setModal]           = useState(false);
    const [editando, setEditando]     = useState<Producto | null>(null);
    const [form, setForm]             = useState<ProductoFormData>(PRODUCTO_FORM_INICIAL);
    const [guardando, setGuardando]   = useState(false);
    const [formError, setFormError]   = useState("");

    const cargarProductos = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getProductos();
            setProductos(data);
        } catch {
            setError("Error al cargar los productos. Verifica la conexión con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { cargarProductos(); }, []);

    const productosFiltrados = productos.filter(p =>
        p.produ_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.produ_tipo.toLowerCase().includes(busqueda.toLowerCase()) ||
        p.produ_concentracion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const abrirCrear = () => {
        setEditando(null);
        setForm(PRODUCTO_FORM_INICIAL);
        setFormError("");
        setModal(true);
    };

    const abrirEditar = (producto: Producto) => {
        setEditando(producto);
        setForm({
            produ_nombre:        producto.produ_nombre,
            produ_tipo:          producto.produ_tipo,
            produ_concentracion: producto.produ_concentracion || "",
            produ_unidad:        producto.produ_unidad || "",
            produ_stock_actual:  producto.produ_stock_actual || 0,
            produ_stock_minimo:  producto.produ_stock_minimo || 0,
        });
        setFormError("");
        setModal(true);
    };

    const cerrarModal = () => setModal(false);

    const handleGuardar = async () => {
        if (!form.produ_nombre.trim()) {
            setFormError("El nombre del producto es requerido");
            return;
        }
        if (!form.produ_tipo) {
            setFormError("El tipo de producto es requerido");
            return;
        }

        try {
            setGuardando(true);
            setFormError("");

            const payload = {
                produ_nombre:        form.produ_nombre,
                produ_tipo:          form.produ_tipo,
                produ_concentracion: form.produ_concentracion || undefined,
                produ_unidad:        form.produ_unidad || undefined,
                produ_stock_actual:  Number(form.produ_stock_actual),
                produ_stock_minimo:  Number(form.produ_stock_minimo),
            };

            if (editando) {
                await updateProducto(editando.produ_producto, payload);
                toast.success("Producto actualizado correctamente");
            } else {
                await createProducto(payload);
                toast.success("Producto creado exitosamente");
            }

            setModal(false);
            cargarProductos();

        } catch (err: unknown) {
            const mensaje = err instanceof Error ? err.message : "Error al guardar el producto";
            setFormError(mensaje);
            toast.error(mensaje);
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = (producto: Producto) => {
        toast.warning(`¿Desactivar "${producto.produ_nombre}"?`, {
            description: "Esta acción desactivará el producto del sistema.",
            action: {
                label: "Desactivar",
                onClick: async () => {
                    try {
                        await deleteProducto(producto.produ_producto);
                        cargarProductos();
                        toast.success("Producto desactivado correctamente");
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
        productos, productosFiltrados, loading, error,
        busqueda, setBusqueda,
        modal, editando, form, setForm, guardando, formError,
        abrirCrear, abrirEditar, cerrarModal, handleGuardar, handleEliminar,
    };
};