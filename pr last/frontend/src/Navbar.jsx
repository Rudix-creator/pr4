import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./Authcontext";
import { CartContext } from "./Cartcontext";

function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { itemCount } = useContext(CartContext);
  const navigate = useNavigate();
  const isAdmin = user?.role_name === "admin";

  return (
    <nav className="navbar">
      <b>ТехноФикс</b>
      <NavLink to="/" end>Услуги</NavLink>
      {isAuthenticated && !isAdmin && <NavLink to="/cart">Корзина ({itemCount})</NavLink>}
      {isAdmin && <NavLink to="/admin">Админ-панель</NavLink>}
      {isAuthenticated && <NavLink to="/dashboard">Кабинет</NavLink>}

      <div className="right">
        {isAuthenticated ? (
          <>
            <span>{user.full_name}</span>
            <button className="btn btn-danger" onClick={() => { logout(); navigate("/"); }}>Выйти</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Войти</NavLink>
            <NavLink to="/register">Регистрация</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
