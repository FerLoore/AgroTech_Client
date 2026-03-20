import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import AgroRolPage from "../pages/AgroRol/AgroRolPage";
import AgroTipoArbolPage from "../pages/AgroTipoArbol/AgroTipoArbolPage";
import AgroCatalogoPatogenoPage from "../pages/AgrocatalogoPatogeno/AgroCatalogoPatogenoPage";
import AgroProductoPage from "../pages/AgroProducto/AgroProductoPage";
import AgroUsuarioPage from '../pages/AgroUsuario/AgroUsuarioPage';
import AgroFincaPage from '../pages/AgroFinca/AgroFincaPage';
import AgroSeccionPage from '../pages/AgroSeccion/AgroSeccionPage';
import AgroClimaPage from '../pages/AgroClima/AgroClimaPage';


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
                    <Route path="/agro-usuario" element={<AgroUsuarioPage />} />
                    <Route path="/agro-finca" element={<AgroFincaPage />} />
                    <Route path="/agro-seccion" element={<AgroSeccionPage />} />
                    <Route path="/agro-clima" element={<AgroClimaPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
};

export default AppRouter;