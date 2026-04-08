import { useEffect, useState } from "react";
import {
  getAnalisisLaboratorio,
  createAnalisisLaboratorio,
  updateAnalisisLaboratorio,
  deleteAnalisisLaboratorio,
} from "../../api/agroAnalisisLaboratorio.api";
import { getAlertas } from "../../api/AgroAlertaSalud.api";
import { getCatalogoPatogenos } from "../../api/AgroCatalogoPatogeno.api";
import { getAgroUsuarios } from "../../api/AgroUsuario.api";
import { toast } from "sonner";

export const useAgroAnalisisLaboratorio = () => {
  const [analisis, setAnalisis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertas, setAlertas] = useState<any[]>([]);
  const [patogenos, setPatogenos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<any | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    analab_laboratorio_nombre: "",
    analab_fecha_envio: "",
    analab_fecha_resultado: "",
    analab_resultado_tipo: "",
    alert_alerta_salud: "",
    catpato_catalogo_patogeno: "",
    usu_usuario: "",
  });

  const cargarAnalisis = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAnalisisLaboratorio();
      setAnalisis(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar análisis:", err);
      setError("Error al cargar análisis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await cargarAnalisis();
      try {
        const data = await getAlertas();
        setAlertas(Array.isArray(data) ? data : []);
      } catch {
        console.error("Error cargando alertas para select");
      }
      try {
        const data = await getCatalogoPatogenos();
        setPatogenos(Array.isArray(data) ? data : []);
      } catch {
        console.error("Error cargando patógenos para select");
      }
      try {
        const response = await getAgroUsuarios();
        setUsuarios(response.data.usuarios || []);
      } catch {
        console.error("Error cargando usuarios para select");
      }
    };
    init();
  }, []);

  const opcionesAlertas = alertas.map(a => ({
    valor: String(a.alertsalud_id),
    label: `Alerta #${a.alertsalud_id} - Árbol ${a.arb_arbol}`
  }));

  const opcionesPatogenos = patogenos.map(p => ({
    valor: String(p.catpato_catalogo_patogeno),
    label: p.catpato_nombre_comun
  }));

  const opcionesUsuarios = usuarios.map(u => ({
    valor: String(u.usu_usuario),
    label: u.usu_nombre
  }));

  const analisisFiltrados = analisis.filter((a) =>
    String(a.analab_laboratorio_nombre || "")
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const abrirCrear = () => {
    setEditando(null);
    setForm({
      analab_laboratorio_nombre: "",
      analab_fecha_envio: "",
      analab_fecha_resultado: "",
      analab_resultado_tipo: "",
      alert_alerta_salud: "",
      catpato_catalogo_patogeno: "",
      usu_usuario: "",
    });
    setFormError("");
    setModal(true);
  };

  const abrirEditar = (a: any) => {
    setEditando(a);
    const toDate = (d: string) => d ? String(d).split("T")[0] : "";
    setForm({
      analab_laboratorio_nombre: a.analab_laboratorio_nombre || "",
      analab_fecha_envio: toDate(a.analab_fecha_envio),
      analab_fecha_resultado: toDate(a.analab_fecha_resultado),
      analab_resultado_tipo: a.analab_resultado_tipo || "",
      alert_alerta_salud: String(a.alert_alerta_salud || ""),
      catpato_catalogo_patogeno: String(a.catpato_catalogo_patogeno || ""),
      usu_usuario: String(a.usu_usuario || ""),
    });
    setFormError("");
    setModal(true);
  };

  const cerrarModal = () => setModal(false);

  const handleGuardar = async () => {
    if (!form.analab_laboratorio_nombre.trim()) {
      setFormError("Nombre requerido");
      return;
    }

    if (!form.analab_fecha_envio) {
      setFormError("Fecha envío requerida");
      return;
    }

    if (!form.alert_alerta_salud || Number(form.alert_alerta_salud) <= 0) {
      setFormError("La alerta de salud es requerida");
      return;
    }

    try {
      setGuardando(true);
      setFormError("");

      const payload = {
        analab_analisis_laboratorio: editando
          ? editando.analab_analisis_laboratorio
          : Date.now(),
        analab_laboratorio_nombre: form.analab_laboratorio_nombre,
        analab_fecha_envio: form.analab_fecha_envio,
        analab_fecha_resultado: form.analab_fecha_resultado || null,
        analab_resultado_tipo: form.analab_resultado_tipo || null,
        alert_alerta_salud: Number(form.alert_alerta_salud),
        catpato_catalogo_patogeno: form.catpato_catalogo_patogeno
          ? Number(form.catpato_catalogo_patogeno)
          : null,
        usu_usuario: form.usu_usuario
          ? Number(form.usu_usuario)
          : null,
      };

      console.log("PAYLOAD FINAL ANALISIS:", payload);

      if (editando) {
        await updateAnalisisLaboratorio(
          editando.analab_analisis_laboratorio,
          payload
        );
        toast.success("Actualizado");
      } else {
        await createAnalisisLaboratorio(payload);
        toast.success("Creado");
      }

      setModal(false);
      await cargarAnalisis();
    } catch (err: any) {
      console.error("ERROR REAL ANALISIS:", err);
      setFormError(err?.message || "Error al guardar");
      toast.error(err?.message || "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = (a: any) => {
    toast.warning("¿Eliminar?", {
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await deleteAnalisisLaboratorio(a.analab_analisis_laboratorio);
            await cargarAnalisis();
            toast.success("Eliminado");
          } catch (err: any) {
            toast.error(err?.message || "Error al eliminar");
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => {} },
    });
  };

  return {
    analisis,
    analisisFiltrados,
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
    opcionesAlertas,
    opcionesPatogenos,
    opcionesUsuarios,
  };
};