//Rutas de archivos
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import AgroRolPage from "../pages/AgroRol/AgroRolPage";
import AgroTipoArbolPage from "../pages/AgroTipoArbol/AgroTipoArbolPage";
import AgroCatalogoPatogenoPage from "../pages/AgrocatalogoPatogeno/AgroCatalogoPatogenoPage";
import AgroProductoPage from "../pages/AgroProducto/AgroProductoPage";
import AgroTratamientosPage from "../pages/AgroTratamientos/AgroTratamientosPage";
import AgroAlertaSaludPage from "../pages/AgroAlertaSalud/AgroAlertaSaludPage";
import AgroAnalisisLaboratorioPage from "../pages/AgroAnalisisLaboratorio/AgroAnalisisLaboratorioPage";
import AgroUsuarioPage from "../pages/AgroUsuario/AgroUsuarioPage";
import AgroFincaPage from "../pages/AgroFinca/AgroFincaPage";
import AgroSeccionPage from "../pages/AgroSeccion/AgroSeccionPage";
import AgroClimaPage from "../pages/AgroClima/AgroClimaPage";
import AgroArbolPage from "../pages/AgroArbol/AgroArbolPage";
import AgroSurcoPage from "../pages/AgroSurco/AgroSurcoPage";
import AgroHistorialPage from "../pages/AgroHistorial/AgroHistorialPage";
import AgroAuditoriaPage from "../pages/AgroAuditoria/AgroAuditoriaPage";
import ArbolTimelinePage from "../pages/AgroHistorial/ArbolTimelinePage";
import HomeDashboardPage from "../pages/HomeDashboard/HomeDashboardPage";
import AgroMapaPage from "../pages/AgroMapa/AgroMapaPage";
import AgroMantenimientoPage from "../pages/AgroMantenimiento/AgroMantenimientoPage";

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<HomeDashboardPage />} />
                    <Route path="/agro-roles" element={<AgroRolPage />} />
                    <Route path="/agro-tipo-arbol" element={<AgroTipoArbolPage />} />
                    <Route path="/agro-catalogo-patogeno" element={<AgroCatalogoPatogenoPage />} />
                    <Route path="/agro-producto" element={<AgroProductoPage />} />
                    <Route path="/agro-tratamientos" element={<AgroTratamientosPage />} />
                    <Route path="/agro-alerta-salud" element={<AgroAlertaSaludPage />} />
                    <Route path="/agro-analisis-laboratorio" element={<AgroAnalisisLaboratorioPage />} />
                    <Route path="/agro-usuario" element={<AgroUsuarioPage />} />
                    <Route path="/agro-finca" element={<AgroFincaPage />} />
                    <Route path="/agro-seccion" element={<AgroSeccionPage />} />
                    <Route path="/agro-clima" element={<AgroClimaPage />} />
                    <Route path="/agro-arboles" element={<AgroArbolPage />} />
                    <Route path="/agro-surcos" element={<AgroSurcoPage />} />
                    <Route path="/agro-historial" element={<AgroHistorialPage />} />
                    <Route path="/agro-auditoria" element={<AgroAuditoriaPage />} />
                    <Route path="/agro-mapa" element={<AgroMapaPage />} />
                    <Route path="/agro-arbol-timeline" element={<ArbolTimelinePage />} />
                    <Route path="/home-dashboard" element={<HomeDashboardPage />} />
                    <Route path="/agro-mantenimiento" element={<AgroMantenimientoPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
};
//Exportamos
export default AppRouter;