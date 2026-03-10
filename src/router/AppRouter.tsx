import { BrowserRouter, Routes, Route } from "react-router-dom";

const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<h1>AgroTech</h1>} />
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;