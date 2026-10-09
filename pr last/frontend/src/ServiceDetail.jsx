import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getServiceById, getReviews, createReview, updateReview, deleteReview } from "./api";
import { AuthContext } from "./Authcontext";
import { CartContext } from "./Cartcontext";

function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToCart, error: cartError } = useContext(CartContext);
  const isAdmin = user?.role_name === "admin";

  const [service, setService] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadData = () => {
    Promise.all([getServiceById(id), getReviews(id)])
      .then(([srv, rev]) => { setService(srv); setReviews(rev); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, [id]);

  const handleReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return setError("Напишите комментарий к отзыву");
    try {
      setSaving(true);
      setError(null);
      await createReview({ user_id: user.user_id, service_id: service.service_id, rating, comment });
      setComment("");
      setRating(5);
      loadData();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleEditReview = async (r) => {
    const newComment = prompt("Новый комментарий:", r.comment);
    if (!newComment || !newComment.trim()) return;
    const newRating = Number(prompt("Новая оценка (от 1 до 5):", r.rating));
    if (!Number.isInteger(newRating) || newRating < 1 || newRating > 5) return setError("Оценка должна быть целым числом от 1 до 5");
    try { await updateReview(r.review_id, { rating: newRating, comment: newComment }); loadData(); } catch (err) { setError(err.message); }
  };

  const handleDeleteReview = async (reviewId) => {
    try { await deleteReview(reviewId); loadData(); } catch (err) { setError(err.message); }
  };

  const handleAdd = async () => {
    if (!user) return navigate("/login");
    if (await addToCart(service.service_id)) navigate("/cart");
  };

  if (loading) return <h2>Загрузка...</h2>;
  if (!service) return <p className="error">{error || "Услуга не найдена"}</p>;

  return (
    <>
      <Link to="/">Все услуги</Link>
      <div className="card">
        <img
          className="service-img detail"
          src={`/images/${service.service_id}.jpg`}
          alt={service.name}
          onError={(e) => { e.target.onerror = null; e.target.src = "/images/placeholder.jpg"; }}
        />
        <span className="tag">{service.category_name}</span>
        <h1>{service.name}</h1>
        <p>{service.description}</p>
        <p>⏱ Длительность: {service.duration_minutes} мин</p>
        <h2>{service.price} ₽</h2>
        {!isAdmin && <button className="btn" onClick={handleAdd}>В корзину</button>}
      </div>

      {(error || cartError) && <p className="error">{error || cartError}</p>}

      <h2>Отзывы ({reviews.length})</h2>
      {reviews.length === 0 && <p>Отзывов пока нет.</p>}
      {reviews.map((r) => (
        <div className="card" key={r.review_id}>
          <div className="row between">
            <b>{r.full_name}</b>
            <span>{r.created_date}</span>
          </div>
          <div className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
          <p>{r.comment}</p>
          {isAdmin && (
            <div className="row">
              <button className="btn outline" onClick={() => handleEditReview(r)}>Изменить</button>
              <button className="btn btn-danger" onClick={() => handleDeleteReview(r.review_id)}>Удалить</button>
            </div>
          )}
        </div>
      ))}

      {user ? (
        <form className="card form" onSubmit={handleReview} noValidate>
          <h3>Оставить отзыв</h3>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
          </select>
          <textarea placeholder="Комментарий" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button className="btn" disabled={saving}>{saving ? "Отправка..." : "Отправить"}</button>
        </form>
      ) : (
        <p><Link to="/login">Войдите</Link>, чтобы оставить отзыв.</p>
      )}
    </>
  );
}

export default ServiceDetail;
