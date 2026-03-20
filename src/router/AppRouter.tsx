import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "../components/Layout";
import AgroRolPage from "../pages/AgroRol/AgroRolPage";
import AgroTipoArbolPage from "../pages/AgroTipoArbol/AgroTipoArbolPage";
import AgroCatalogoPatogenoPage from "../pages/AgrocatalogoPatogeno/AgroCatalogoPatogenoPage";
import AgroProductoPage from "../pages/AgroProducto/AgroProductoPage";
import AgroArbolPage from "../pages/AgroArbol/AgroArbolPage";
import AgroSurcoPage from "../pages/AgroSurco/AgroSurcoPage";
import AgroHistorialPage from "../pages/AgroHistorial/AgroHistorialPage";

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
                    <Route path="/agro-arboles" element={<AgroArbolPage/>} />
                    <Route path="/agro-surcos" element={<AgroSurcoPage />} />
                    <Route path="/agro-historial" element={<AgroHistorialPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
};

export default AppRouter;