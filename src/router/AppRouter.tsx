import { BrowserRouter, Routes, Route } from "react-router-dom";
import AgroRolPage from "../pages/AgroRol/AgroRolPage";

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<h1>AgroTech 🌱</h1>} />
                <Route path="/agro-roles" element={<AgroRolPage />} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;