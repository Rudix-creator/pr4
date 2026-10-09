import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "./Authcontext";
import { registerUser } from "./api";

function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim() || !form.password || !form.phone.trim())
      return setError("Заполните все поля");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Некорректный email");
    try {
      setLoading(true);
      setError(null);
      login(await registerUser(form));
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="card form narrow">
      <h2>Регистрация</h2>
      <input name="full_name" placeholder="Полное имя" value={form.full_name} onChange={handleChange} />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
      <input name="password" type="password" placeholder="Пароль" value={form.password} onChange={handleChange} />
      <input name="phone" type="tel" placeholder="Телефон" value={form.phone} onChange={handleChange} />
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={loading}>{loading ? "Загрузка..." : "Зарегистрироваться"}</button>
      <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
    </form>
  );
}

export default Register;
