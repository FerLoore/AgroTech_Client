import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ShieldCheck, TreeDeciduous, Bug, Package,
    Users, MapPin, Layers, CloudRain,
    GitBranch, Leaf, ClipboardList,
    AlertTriangle, FlaskConical, Syringe,
    ChevronLeft, ChevronRight, Menu, History, Calendar
    // Map as MapIcon
} from "lucide-react";
import logo from "../assets/AGROTECHLOGOsinfondo.png";

const MENU = [
    {
        grupo: "Catálogos",
        items: [
            { label: "Roles", ruta: "/agro-roles", icono: ShieldCheck },
            { label: "Tipos de Árbol", ruta: "/agro-tipo-arbol", icono: TreeDeciduous },
            { label: "Catálogo Patógeno", ruta: "/agro-catalogo-patogeno", icono: Bug },
            { label: "Productos", ruta: "/agro-producto", icono: Package },
        ]
    },
    {
        grupo: "Finca",
        items: [
            { label: "Usuarios", ruta: "/agro-usuario", icono: Users },
            { label: "Fincas", ruta: "/agro-finca", icono: MapPin },
            { label: "Secciones", ruta: "/agro-seccion", icono: Layers },
            { label: "Clima", ruta: "/agro-clima", icono: CloudRain },
        ]
    },
    {
        grupo: "Árboles",
        items: [
            { label: "Surcos", ruta: "/agro-surcos", icono: GitBranch },
            { label: "Árboles", ruta: "/agro-arboles", icono: Leaf },
            { label: "Historial", ruta: "/agro-historial", icono: ClipboardList }
            // { label: "Mapa de Finca", ruta: "/agro-mapa", icono: MapIcon },
        ]
    },
    {
        grupo: "Salud",
        items: [
            { label: "Alertas de Salud", ruta: "/agro-alerta-salud", icono: AlertTriangle },
            { label: "Análisis Lab", ruta: "/agro-analisis-laboratorio", icono: FlaskConical },
            { label: "Tratamientos", ruta: "/agro-tratamientos", icono: Syringe },
            { label: "Fumigación", ruta: "/agro-fumigacion", icono: Calendar },
            { label: "Timeline Árbol", ruta: "/agro-arbol-timeline", icono: History },
        ]
    },
];

const SIDEBAR_W = 240;
const COLLAPSED_W = 64;
const NAVBAR_H = 56;

interface LayoutProps { children: React.ReactNode }

const Layout = ({ children }: LayoutProps) => {

    const [collapsed, setCollapsed] = useState(false);
    const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const sw = collapsed ? COLLAPSED_W : SIDEBAR_W;
    const paginaActual = MENU.flatMap(g => g.items).find(i => i.ruta === location.pathname)?.label ?? "Inicio";

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#f5f0e8" }}>

            <aside style={{
                width: sw, minHeight: "100vh", background: "#2d4a2d",
                display: "flex", flexDirection: "column",
                transition: "width 0.22s ease", overflow: "hidden",
                position: "fixed", top: 0, left: 0, zIndex: 100,
                boxShadow: "2px 0 12px rgba(0,0,0,0.12)"
            }}>

                {/* Logo */}
                <div style={{
                    height: NAVBAR_H, display: "flex", alignItems: "center",
                    padding: collapsed ? "0 14px" : "0 18px", gap: 10,
                    borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
                    background: "#f5f0e8"
                }}>
                    <img src={logo} alt="AgroTech"
                        style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }} />
                    {!collapsed && (
                        <span style={{ color: "#2d4a2d", fontWeight: 700, fontSize: 16, whiteSpace: "nowrap" }}>
                            AgroTech
                        </span>
                    )}
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                    {MENU.map(grupo => (
                        <div key={grupo.grupo} style={{ marginBottom: 4 }}>
                            {!collapsed && (
                                <p style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                                    color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
                                    padding: "12px 18px 4px", margin: 0
                                }}>{grupo.grupo}</p>
                            )}
                            {grupo.items.map(item => {
                                const activo = location.pathname === item.ruta;
                                const Icono = item.icono;
                                return (
                                    <button key={item.ruta}
                                        onClick={() => navigate(item.ruta)}
                                        onMouseEnter={e => collapsed && setTooltip({
                                            label: item.label,
                                            y: (e.currentTarget as HTMLElement).getBoundingClientRect().top + 14
                                        })}
                                        onMouseLeave={() => setTooltip(null)}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center",
                                            gap: 10, padding: collapsed ? "10px 0" : "9px 18px",
                                            justifyContent: collapsed ? "center" : "flex-start",
                                            background: activo ? "rgba(255,255,255,0.10)" : "transparent",
                                            border: "none", cursor: "pointer",
                                            borderLeft: activo ? "3px solid #6aaa7a" : "3px solid transparent",
                                            transition: "background 0.15s"
                                        }}>
                                        <Icono size={17} color={activo ? "#6aaa7a" : "rgba(255,255,255,0.55)"} />
                                        {!collapsed && (
                                            <span style={{
                                                fontSize: 13, whiteSpace: "nowrap",
                                                color: activo ? "#f5f0e8" : "rgba(255,255,255,0.55)",
                                                fontWeight: activo ? 600 : 400
                                            }}>{item.label}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Toggle collapse */}
                <button onClick={() => setCollapsed(!collapsed)} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "14px", background: "transparent", border: "none",
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    cursor: "pointer", color: "rgba(255,255,255,0.4)", flexShrink: 0
                }}>
                    {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
                </button>
            </aside>

            {/* Tooltip */}
            {collapsed && tooltip && (
                <div style={{
                    position: "fixed",
                    left: COLLAPSED_W + 8,
                    top: tooltip.y,
                    background: "#2d4a2d",
                    color: "#f5f0e8",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    zIndex: 200,
                    pointerEvents: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    whiteSpace: "nowrap"
                }}>
                    {tooltip.label}
                </div>
            )}

            {/* Main content */}
            <div style={{
                marginLeft: sw, flex: 1,
                display: "flex", flexDirection: "column",
                transition: "margin-left 0.22s ease"
            }}>
                <header style={{
                    height: NAVBAR_H, background: "#fff",
                    display: "flex", alignItems: "center",
                    padding: "0 24px", gap: 10,
                    borderBottom: "1px solid #e8e0d0",
                    position: "sticky", top: 0, zIndex: 90,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                }}>
                    <Menu size={16} color="#aaa" />
                    <span style={{ fontSize: 14, color: "#7a9a7a" }}>{paginaActual}</span>
                </header>

                <main style={{ flex: 1 }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;