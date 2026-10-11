import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./Authcontext";
import Productform from "./Productform";
import { EMAIL_RE, PHONE_RE, isRealFullName, normalizeName, formatPhone, NAME_ERROR, PHONE_ERROR } from "./validate";
import {
  getServices, createService, updateService, deleteService,
  getCategories, createCategory, updateCategory, deleteCategory,
  getAllOrders, updateOrderStatus,
  getUsers, registerUser,
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
} from "./api";

const STATUSES = ["Ожидает оплаты", "Оплачен", "В работе", "Готов к выдаче", "Выполнен", "Отменён"];
// нейтральная категория (как на сервере): её нельзя удалить и переименовать
const NO_CATEGORY = "Без категории";
// завершённые заказы менять нельзя
const FINAL = ["Выполнен", "Отменён"];
// оплаченный заказ не возвращается в «Ожидает оплаты»
const blocked = (current, next) =>
  next !== current && (next === "Ожидает оплаты" || (current === "Ожидает оплаты" && next !== "Оплачен" && next !== "Отменён"));
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

  // удаление категории: её услуги переезжают в «Без категории»
  const handleDelete = (c) => {
    if (confirm(`Удалить категорию «${c.category_name}»? Её услуги переместятся в «${NO_CATEGORY}».`))
      run(() => deleteCategory(c.category_id));
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
          {c.category_name === NO_CATEGORY ? (
            <span className="muted">Системная категория: сюда попадают услуги удалённых категорий</span>
          ) : (
            <div className="row">
              <button className="btn outline" onClick={() => handleRename(c)}>Переименовать</button>
              <button className="btn btn-danger" onClick={() => handleDelete(c)}>Удалить</button>
            </div>
          )}
        </div>
      ))}
    </>
  );
}

// вкладка купонов: создание, смена процента, отключение и удаление
function CouponsTab() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({ code: "", discount_percent: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = () => {
    getCoupons()
      .then(setCoupons)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };
  useEffect(loadData, []);

  const run = async (action) => {
    try { setError(null); await action(); loadData(); } catch (err) { setError(err.message); }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!/^[A-Za-zА-Яа-яЁё0-9_-]{3,20}$/.test(form.code.trim())) return setError("Код купона: 3-20 символов (буквы, цифры, «-» и «_»)");
    const percent = Number(form.discount_percent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) return setError("Скидка должна быть целым числом от 1 до 90 %");
    run(async () => { await createCoupon({ code: form.code.trim(), discount_percent: percent }); setForm({ code: "", discount_percent: "" }); });
  };

  const handlePercent = (c) => {
    const answer = prompt("Новый процент скидки (1-90):", c.discount_percent);
    if (answer === null) return;
    const percent = Number(answer);
    if (!Number.isInteger(percent) || percent < 1 || percent > 90) return setError("Скидка должна быть целым числом от 1 до 90 %");
    run(() => updateCoupon(c.coupon_id, { code: c.code, discount_percent: percent, active: c.active }));
  };

  const toggle = (c) => run(() => updateCoupon(c.coupon_id, { code: c.code, discount_percent: c.discount_percent, active: !c.active }));

  const handleDelete = (c) => {
    if (confirm(`Удалить купон ${c.code}?`)) run(() => deleteCoupon(c.coupon_id));
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <>
      <p className="muted">Каждый купон можно использовать один раз на пользователя. Скидка на первый заказ (10%) выдаётся новым пользователям автоматически и действует только на первый заказ.</p>
      <form className="card row" onSubmit={handleAdd} noValidate>
        <input className="grow" placeholder="Код купона (например, SALE10)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <input type="number" min="1" max="90" placeholder="Скидка, %" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} />
        <button className="btn">Добавить</button>
      </form>
      {error && <p className="error">{error}</p>}
      {coupons.length === 0 && <p>Купонов пока нет.</p>}
      {coupons.map((c) => (
        <div className="card row between" key={c.coupon_id}>
          <div>
            <b>{c.code}</b> · −{c.discount_percent}% · использован {c.uses} раз
            {!c.active && <span className="status"> отключён</span>}
          </div>
          <div className="row">
            <button className="btn outline" onClick={() => handlePercent(c)}>Изменить %</button>
            <button className="btn outline" onClick={() => toggle(c)}>{c.active ? "Отключить" : "Включить"}</button>
            <button className="btn btn-danger" onClick={() => handleDelete(c)}>Удалить</button>
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
            <b>{o.total} рублей{o.discount_percent > 0 && ` (${o.discount_note || "скидка"} −${o.discount_percent}%)`}</b>
          </div>
          <p>{o.items}</p>
          <p>{o.full_name}, {o.phone}<br />Доставка: {o.delivery_address}, {o.delivery_date}</p>
          <div className="row">
            <select value={o.status} disabled={FINAL.includes(o.status)} onChange={(e) => run(() => updateOrderStatus(o.order_id, e.target.value))}>
              {STATUSES.map((s) => <option key={s} disabled={blocked(o.status, s)}>{s}</option>)}
            </select>
            {FINAL.includes(o.status) && <span className="muted">Заказ завершён, статус изменить нельзя</span>}
          </div>
        </div>
      ))}
    </>
  );
}

// вкладка пользователей (только просмотр и добавление)
function UsersTab() {
  const [users, setUsers] = useState([]);
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

  // создание пользователя
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUser.full_name.trim() || !newUser.email.trim() || !newUser.password || !newUser.phone.trim())
      return setError("Заполните все поля");
    if (!isRealFullName(newUser.full_name)) return setError(NAME_ERROR);
    if (!EMAIL_RE.test(newUser.email)) return setError("Некорректный email");
    if (!PHONE_RE.test(newUser.phone)) return setError(PHONE_ERROR);
    try {
      setError(null);
      await registerUser({ ...newUser, full_name: normalizeName(newUser.full_name) });
      setNewUser(EMPTY_USER);
      setCreating(false);
      loadData();
    } catch (err) { setError(err.message); }
  };

  if (loading) return <p>Загрузка...</p>;

  return (
    <>
      {error && <p className="error">{error}</p>}
      {!creating && (
        <p><button className="btn" onClick={() => setCreating(true)}>Добавить пользователя</button></p>
      )}
      {creating && (
        <form className="card form" onSubmit={handleCreate} noValidate>
          <h3>Новый пользователь</h3>
          <input placeholder="Имя и фамилия" value={newUser.full_name} onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })} />
          <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <input type="password" placeholder="Пароль" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <input type="tel" inputMode="tel" maxLength={18} placeholder="+7 (900) 123-45-67" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: formatPhone(e.target.value) })} />
          <div className="row">
            <button className="btn">Добавить</button>
            <button type="button" className="btn outline" onClick={() => { setCreating(false); setError(null); }}>Отмена</button>
          </div>
        </form>
      )}
      {users.map((u) => (
        <div className="card" key={u.user_id}>
          <div><b>{u.full_name}</b> <span className="tag">{u.role_name}</span></div>
          <div>{u.email} · {u.phone}</div>
        </div>
      ))}
    </>
  );
}

// админ-панель
function Admin() {
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState("services");

  // доступ только для администратора
  if (user?.role_name !== "admin") return (
    <div className="card">
      <h1>Доступ запрещён</h1>
      <p>У вас нет прав для просмотра этой страницы.</p>
      <Link className="btn" to="/">На главную</Link>
    </div>
  );

  const tabs = { services: "Услуги", categories: "Категории", orders: "Заказы", coupons: "Купоны", users: "Пользователи" };

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
      {tab === "coupons" && <CouponsTab />}
      {tab === "users" && <UsersTab />}
    </>
  );
}

export default Admin;
