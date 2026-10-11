import { createContext, useState, useEffect } from "react";

// контекст пользователя
export const AuthContext = createContext();

// сохранённый пользователь (старые данные без role_name считаются недействительными)
function readUser() {
    try {
        const saved = localStorage.getItem("user");
        const parsed = saved ? JSON.parse(saved) : null;
        return parsed && parsed.role_name ? parsed : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readUser);

    // вход или выход в одной вкладке сразу обновляет остальные открытые вкладки
    useEffect(() => {
        const onStorage = (e) => { if (e.key === "user" || e.key === null) setUser(readUser()); };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // вход и выход: localStorage обновляется сразу, чтобы первый запрос после входа (корзина) уже знал пользователя
    const login = (userData) => {
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
    };
    const logout = () => {
        localStorage.removeItem("user");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
