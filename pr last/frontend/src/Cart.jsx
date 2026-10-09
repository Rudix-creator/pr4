import { useContext, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "./Authcontext";
import { CartContext } from "./Cartcontext";
import { createOrder } from "./api";

function Cart() {
  const { user } = useContext(AuthContext);
  const { items, loading, error: cartError, total, changeQuantity, removeFromCart, reloadCart } = useContext(CartContext);
  const [address, setAddress] = useState(user?.address || "");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const today = new Date().toLocaleDateString("sv-SE");

  if (!user || user.role_name === "admin") return <Navigate to="/login" replace />;

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!address.trim() || !date) return setError("Укажите адрес и дату доставки");
    if (date < today) return setError("Дата доставки не может быть раньше сегодняшней");
    try {
      setSaving(true);
      setError(null);
      await createOrder({ user_id: user.user_id, delivery_address: address, delivery_date: date });
      await reloadCart();
      setDone(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <h2>Загрузка...</h2>;

  if (done) return (
    <div className="card">
      <h2>Заказ оформлен </h2>
      <p>Статус заказа можно смотреть в <Link to="/dashboard">личном кабинете</Link>.</p>
    </div>
  );

  return (
    <>
      <h1>Корзина</h1>
      {(error || cartError) && <p className="error">{error || cartError}</p>}
      {items.length === 0 ? (
        <p>Корзина пуста. <Link to="/">Перейти к услугам</Link></p>
      ) : (
        <>
          {items.map((i) => (
            <div className="card row between" key={i.service_id}>
              <div className="grow">
                <b>{i.name}</b>
                <div> {i.duration_minutes} мин · {i.price} ₽</div>
              </div>
              <div className="row">
                <button className="btn outline" disabled={i.quantity <= 1} onClick={() => changeQuantity(i.service_id, i.quantity - 1)}>−</button>
                <span>{i.quantity}</span>
                <button className="btn outline" onClick={() => changeQuantity(i.service_id, i.quantity + 1)}>+</button>
              </div>
              <b>{i.price * i.quantity} рублей</b>
              <button className="btn btn-danger" onClick={() => removeFromCart(i.service_id)}>Удалить</button>
            </div>
          ))}

          <h2>Итого: {total} рублей</h2>

          <form className="card form" onSubmit={handleOrder} noValidate>
            <h3>Оформление заказа</h3>
            <input placeholder="Адрес доставки" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="btn" disabled={saving}>{saving ? "Оформляем..." : "Оформить заказ"}</button>
          </form>
        </>
      )}
    </>
  );
}

export default Cart;
