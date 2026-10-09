import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./Authcontext";
import { getUserOrders, updateUser, changePassword } from "./api";

function Dashboard() {
  const { user, login } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({
    full_name: user?.full_name || "", email: user?.email || "", phone: user?.phone || "", address: user?.address || "",
  });
  const [passwords, setPasswords] = useState({ old_password: "", new_password: "" });
  const [profileMsg, setProfileMsg] = useState(null);
  const [passMsg, setPassMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    getUserOrders(user.user_id)
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return <Navigate to="/login" replace />;

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profile.full_name.trim() || !profile.email.trim() || !profile.phone.trim())
      return setProfileMsg({ text: "ФИО, email и телефон обязательны", error: true });
    if (!/^\S+@\S+\.\S+$/.test(profile.email))
      return setProfileMsg({ text: "Некорректный email", error: true });
    try {
      login(await updateUser(user.user_id, profile));
      setProfileMsg({ text: "Данные сохранены" });
    } catch (err) { setProfileMsg({ text: err.message, error: true }); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!passwords.old_password || !passwords.new_password)
      return setPassMsg({ text: "Введите текущий и новый пароль", error: true });
    try {
      await changePassword(user.user_id, passwords);
      setPasswords({ old_password: "", new_password: "" });
      setPassMsg({ text: "Пароль изменён" });
    } catch (err) { setPassMsg({ text: err.message, error: true }); }
  };

  const Msg = ({ m }) => m && <p className={m.error ? "error" : "ok"}>{m.text}</p>;

  return (
    <>
      <h1>Личный кабинет</h1>
      <div className="grid">
        <form className="card form" onSubmit={saveProfile} noValidate>
          <h3>Личные данные</h3>
          <input placeholder="ФИО" value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
          <input type="email" placeholder="Email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <input type="tel" placeholder="Телефон" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          <input placeholder="Адрес по умолчанию" value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          <Msg m={profileMsg} />
          <button className="btn">Сохранить</button>
        </form>

        <form className="card form" onSubmit={savePassword} noValidate>
          <h3>Смена пароля</h3>
          <input type="password" placeholder="Текущий пароль" value={passwords.old_password} onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })} />
          <input type="password" placeholder="Новый пароль" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} />
          <Msg m={passMsg} />
          <button className="btn">Изменить пароль</button>
        </form>
      </div>

      {user.role_name !== "admin" && (
        <>
          <h2>Мои заказы</h2>
          {loading && <p>Загрузка...</p>}
          {error && <p className="error">{error}</p>}
          {!loading && !error && orders.length === 0 && <p>Заказов пока нет.</p>}
          {orders.map((o) => (
            <div className="card" key={o.order_id}>
              <div className="row between">
                <b>Заказ №{o.order_number} от {o.created_date}</b>
                <span className="status">{o.status}</span>
              </div>
              <p>{o.items}</p>
              <p>Адрес доставки: {o.delivery_address}</p>
              <p>Дата доставки: {o.delivery_date}</p>
              <b>{o.total} рублей</b>
            </div>
          ))}
        </>
      )}
    </>
  );
}

export default Dashboard;
