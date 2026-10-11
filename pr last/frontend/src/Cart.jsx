import { useContext, useState, useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./Authcontext";
import { CartContext } from "./Cartcontext";
import { createOrder, getAvailability, getWelcomeDiscount, checkCoupon } from "./api";

// максимум штук одной услуги (так же на сервере)
const MAX_QTY = 10;

// корзина и оформление заказа
function Cart() {
  const { user } = useContext(AuthContext);
  const { items, loading, error: cartError, total, changeQuantity, removeFromCart, reloadCart } = useContext(CartContext);
  const location = useLocation();
  const [address, setAddress] = useState(user?.address || "");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [welcome, setWelcome] = useState(0); // скидка на первый заказ, %
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // применённый купон: { code, percent }
  const [couponError, setCouponError] = useState(null);

  // сколько услуг ещё можно заказать на выбранную дату
  useEffect(() => {
    if (!date) { setAvailability(null); return; }
    let cancelled = false;
    getAvailability(date)
      .then((data) => { if (!cancelled) setAvailability(data); })
      .catch(() => { if (!cancelled) setAvailability(null); });
    return () => { cancelled = true; };
  }, [date]);

  // скидка на первый заказ: сервер сообщает, положена ли она (только если заказов ещё не было)
  useEffect(() => {
    if (!user || user.role_name === "admin") return;
    getWelcomeDiscount(user.user_id).then((d) => setWelcome(d.percent)).catch(() => setWelcome(0));
  }, [user?.user_id]);

  const today = new Date().toLocaleDateString("sv-SE");

  // гостя отправляем на вход и после входа возвращаем в корзину
  if (!user || user.role_name === "admin") return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  // сколько услуг в корзине и хватает ли на выбранную дату мест
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const dayFull = availability !== null && cartCount > availability.free;

  // купон: сервер проверяет код (существует, включён, этот пользователь его ещё не использовал)
  const applyCoupon = async () => {
    if (!couponInput.trim()) return setCouponError("Введите код купона");
    try {
      setCouponError(null);
      setCoupon(await checkCoupon(couponInput.trim()));
    } catch (err) { setCoupon(null); setCouponError(err.message); }
  };
  const removeCoupon = () => { setCoupon(null); setCouponInput(""); setCouponError(null); };

  // к заказу применяется одна, самая выгодная скидка: за первый заказ или купон
  const percent = Math.max(welcome, coupon ? coupon.percent : 0);
  const toPay = Math.round(total * (100 - percent) / 100);
  const couponWins = coupon && coupon.percent > welcome;

  // оформление заказа
  const handleOrder = async (e) => {
    e.preventDefault();
    if (!address.trim() || !date) return setError("Укажите адрес и дату доставки");
    if (date < today) return setError("Дата доставки не может быть раньше сегодняшней");
    try {
      setSaving(true);
      setError(null);
      await createOrder({ delivery_address: address, delivery_date: date, coupon_code: coupon ? coupon.code : undefined });
      await reloadCart();
      setDone(true);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <h2>Загрузка...</h2>;

  if (done) return (
    <div className="card">
      <h2>Заказ оформлен</h2>
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
                <div>{i.duration_minutes} мин · {i.price} ₽</div>
              </div>
              <div className="row">
                <button className="btn outline" disabled={i.quantity <= 1} onClick={() => changeQuantity(i.service_id, i.quantity - 1)}>−</button>
                <span>{i.quantity}</span>
                <button className="btn outline" disabled={i.quantity >= MAX_QTY} onClick={() => changeQuantity(i.service_id, i.quantity + 1)}>+</button>
              </div>
              <b>{i.price * i.quantity} рублей</b>
              <button className="btn btn-danger" onClick={() => removeFromCart(i.service_id)}>Удалить</button>
            </div>
          ))}
          <p className="muted">Не больше {MAX_QTY} шт. одной услуги.</p>

          <h2>Итого: {total} рублей</h2>

          <div className="card form">
            <h3>Купон</h3>
            {coupon ? (
              <div className="row between">
                <span>Купон <b>{coupon.code}</b>: −{coupon.percent}%</span>
                <button type="button" className="btn outline" onClick={removeCoupon}>Убрать</button>
              </div>
            ) : (
              <div className="row">
                <input className="grow" placeholder="Код купона" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} />
                <button type="button" className="btn outline" onClick={applyCoupon}>Применить</button>
              </div>
            )}
            {couponError && <p className="error">{couponError}</p>}
            {coupon && !couponWins && welcome > 0 && (
              <p className="muted">Скидка на первый заказ ({welcome}%) выгоднее этого купона, поэтому купон не будет потрачен.</p>
            )}
          </div>

          {percent > 0 && (
            <p className="ok">
              {couponWins ? `Купон ${coupon.code}` : "Скидка на первый заказ"} (−{percent}%): −{total - toPay} рублей.
              К оплате: <b>{toPay} рублей</b>
            </p>
          )}

          <form className="card form" onSubmit={handleOrder} noValidate>
            <h3>Оформление заказа</h3>
            <input placeholder="Адрес доставки" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            {availability && (
              <p className={dayFull ? "error" : "muted"}>
                {availability.free === 0
                  ? "На эту дату все сотрудники заняты, выберите другой день."
                  : dayFull
                    ? `На эту дату свободно только ${availability.free} шт., а в корзине ${cartCount}. Уменьшите количество или выберите другой день.`
                    : `На эту дату свободно: ${availability.free} из ${availability.limit} шт.`}
              </p>
            )}
            <button className="btn" disabled={saving || dayFull}>{saving ? "Оформляем..." : "Оформить заказ"}</button>
          </form>
        </>
      )}
    </>
  );
}

export default Cart;
