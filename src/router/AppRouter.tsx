import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import AgroRolPage from "../pages/AgroRol/AgroRolPage";
import AgroTipoArbolPage from "../pages/AgroTipoArbol/AgroTipoArbolPage";
import AgroCatalogoPatogenoPage from "../pages/AgrocatalogoPatogeno/AgroCatalogoPatogenoPage";
import AgroProductoPage from "../pages/AgroProducto/AgroProductoPage";
import AgroTratamientosPage from "../pages/AgroTratamientos/AgroTratamientosPage";
import AgroAlertaSaludPage from "../pages/AgroAlertaSalud/AgroAlertaSaludPage";
import AgroAnalisisLaboratorioPage from "../pages/AgroAnalisisLaboratorio/AgroAnalisisLaboratorioPage";
// Cada dev importa su página y agrega su <Route> aquí

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<h1 style={{ padding: 40, color: "#2d4a2d" }}>Bienvenido a AgroTech 🌱</h1>} />
                    <Route path="/agro-roles" element={<AgroRolPage />} />
                    <Route path="/agro-tipo-arbol"        element={<AgroTipoArbolPage />} /> 
                    <Route path="/agro-catalogo-patogeno" element={<AgroCatalogoPatogenoPage />} /> 
                    <Route path="/agro-producto"          element={<AgroProductoPage />} /> 
                    <Route path="/agro-tratamientos" element={<AgroTratamientosPage />} />
                    <Route path="/agro-alerta-salud" element={<AgroAlertaSaludPage />} />
                    <Route path="/agro-analisis-laboratorio" element={<AgroAnalisisLaboratorioPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
};

export default AppRouter;