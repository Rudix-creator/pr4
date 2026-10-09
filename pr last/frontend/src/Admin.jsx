import { useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./Authcontext";
import Productform from "./Productform";
import {
  getServices, createService, updateService, deleteService,
  getCategories, createCategory, updateCategory, deleteCategory,
  getAllOrders, updateOrderStatus, deleteOrder,
  getUsers, updateUser, deleteUser, registerUser,
} from "./api";

const STATUSES = ["Новый", "В работе", "Готов к выдаче", "Выполнен", "Отменён"];
const EMPTY_USER = { full_name: "", email: "", password: "", phone: "" };

// вкладка услуг
function ServicesTab() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    Promise.all([getServices(), getCategories()])
      .then(([s, c]) => { setServices(s); setCategories(c); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const handleSave = async (form) => {
    if (editing) await updateService(editing.service_id, form);
    else await createService(form);
    setEditing(null);
    loadData();
  };

  const handleDelete = async (s) => {
    try { setError(null); await deleteService(s.service_id); loadData(); } catch (err) { setError(err.message); }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <>
      {error && <p className="error">{error}</p>}
      <Productform key={editing ? editing.service_id : "new"} service={editing} categories={categories}
        onSave={handleSave} onCancel={() => setEditing(null)} />
      {services.map((s) => (
        <div className="card row between" key={s.service_id}>
          <div className="grow">
            <b>{s.name}</b>
            <div>{s.category_name} · {s.duration_minutes} мин · {s.price} ₽</div>
          </div>
          <button className="btn outline" onClick={() => setEditing(s)}>Изменить</button>
          <button className="btn btn-danger" onClick={() => handleDelete(s)}>Удалить</button>
        </div>
      ))}
    </>
  );
}

// вкладка категорий
function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    getCategories()
      .then(setCategories)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const run = async (action) => {
    try { setError(null); await action(); loadData(); } catch (err) { setError(err.message); }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Введите название категории");
    run(async () => { await createCategory({ category_name: name }); setName(""); });
  };

  const handleRename = (c) => {
    const newName = prompt("Новое название:", c.category_name);
    if (newName && newName.trim()) run(() => updateCategory(c.category_id, { category_name: newName }));
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <>
      <form className="card row" onSubmit={handleAdd} noValidate>
        <input className="grow" placeholder="Новая категория" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn">Добавить</button>
      </form>
      {error && <p className="error">{error}</p>}
      {categories.map((c) => (
        <div className="card row between" key={c.category_id}>
          <b>{c.category_name}</b>
          <div className="row">
            <button className="btn outline" onClick={() => handleRename(c)}>Переименовать</button>
            <button className="btn btn-danger" onClick={() => run(() => deleteCategory(c.category_id))}>Удалить</button>
          </div>
        </div>
      ))}
    </>
  );
}

// вкладка заказов
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    getAllOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const run = async (action) => {
    try { setError(null); await action(); loadData(); } catch (err) { setError(err.message); }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 && <p>Заказов пока нет.</p>}
      {orders.map((o) => (
        <div className="card" key={o.order_id}>
          <div className="row between">
            <b>Заказ №{o.order_number} от {o.created_date}</b>
            <b>{o.total} рублей</b>
          </div>
          <p>{o.items}</p>
          <p>{o.full_name}, {o.phone}<br />Доставка: {o.delivery_address}, {o.delivery_date}</p>
          <div className="row">
            <select value={o.status} onChange={(e) => run(() => updateOrderStatus(o.order_id, e.target.value))}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="btn btn-danger" onClick={() => run(() => deleteOrder(o.order_id))}>Удалить</button>
          </div>
        </div>
      ))}
    </>
  );
}

// вкладка пользователей
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing.full_name.trim() || !editing.email.trim() || !editing.phone.trim())
      return setError("ФИО, email и телефон обязательны");
    if (!/^\S+@\S+\.\S+$/.test(editing.email)) return setError("Некорректный email");
    try {
      setError(null);
      await updateUser(editing.user_id, editing);
      setEditing(null);
      loadData();
    } catch (err) { setError(err.message); }
  };

  const handleDelete = async (u) => {
    try { setError(null); await deleteUser(u.user_id); loadData(); } catch (err) { setError(err.message); }
  };

  const handleChange = (e) => setEditing({ ...editing, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUser.full_name.trim() || !newUser.email.trim() || !newUser.password || !newUser.phone.trim())
      return setError("Заполните все поля");
    if (!/^\S+@\S+\.\S+$/.test(newUser.email)) return setError("Некорректный email");
    try {
      setError(null);
      await registerUser(newUser);
      setNewUser(EMPTY_USER);
      setCreating(false);
      loadData();
    } catch (err) { setError(err.message); }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <>
      {error && <p className="error">{error}</p>}
      {!editing && !creating && (
        <p><button className="btn" onClick={() => setCreating(true)}>Добавить пользователя</button></p>
      )}
      {creating && (
        <form className="card form" onSubmit={handleCreate} noValidate>
          <h3>Новый пользователь</h3>
          <input placeholder="ФИО" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
          <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <input type="password" placeholder="Пароль" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <input type="tel" placeholder="Телефон" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} />
          <div className="row">
            <button className="btn">Добавить</button>
            <button type="button" className="btn outline" onClick={() => { setCreating(false); setError(null); }}>Отмена</button>
          </div>
        </form>
      )}
      {editing && (
        <form className="card form" onSubmit={handleSave} noValidate>
          <h3>Изменить пользователя</h3>
          <input name="full_name" placeholder="ФИО" value={editing.full_name} onChange={handleChange} />
          <input name="email" type="email" placeholder="Email" value={editing.email} onChange={handleChange} />
          <input name="phone" type="tel" placeholder="Телефон" value={editing.phone} onChange={handleChange} />
          <input name="address" placeholder="Адрес" value={editing.address || ""} onChange={handleChange} />
          <div className="row">
            <button className="btn">Сохранить</button>
            <button type="button" className="btn outline" onClick={() => setEditing(null)}>Отмена</button>
          </div>
        </form>
      )}
      {users.map((u) => (
        <div className="card row between" key={u.user_id}>
          <div className="grow">
            <b>{u.full_name}</b> <span className="tag">{u.role_name}</span>
            <div>{u.email} · {u.phone}{u.address ? ` · ${u.address}` : ""}</div>
          </div>
          <button className="btn outline" onClick={() => setEditing(u)}>Изменить</button>
          {u.role_name !== "admin" && <button className="btn btn-danger" onClick={() => handleDelete(u)}>Удалить</button>}
        </div>
      ))}
    </>
  );
}

// админ-панель
function Admin() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState("services");

  if (user?.role_name !== "admin") return <Navigate to="/" replace />;

  const tabs = { services: "Услуги", categories: "Категории", orders: "Заказы", users: "Пользователи" };

  return (
    <>
      <h1>Админ-панель</h1>
      <div className="row tabs">
        {Object.entries(tabs).map(([key, title]) => (
          <button key={key} className={"btn outline" + (tab === key ? " active" : "")} onClick={() => setTab(key)}>{title}</button>
        ))}
      </div>
      {tab === "services" && <ServicesTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "users" && <UsersTab />}
    </>
  );
}

export default Admin;