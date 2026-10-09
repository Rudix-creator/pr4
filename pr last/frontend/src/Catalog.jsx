import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getServices, getCategories } from "./api";
import { AuthContext } from "./Authcontext";
import { CartContext } from "./Cartcontext";
import ServiceCard from "./ServiceCard";

function Catalog() {
  const { user } = useContext(AuthContext);
  const { addToCart, error: cartError } = useContext(CartContext);
  const navigate = useNavigate();
  const isAdmin = user?.role_name === "admin";

  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    Promise.all([getServices(), getCategories()])
      .then(([srv, cat]) => { setServices(srv); setCategories(cat); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (service) => {
    if (!user) return navigate("/login");
    if (await addToCart(service.service_id)) setMessage(`«${service.name}» добавлена в корзину`);
  };

  const filtered = services.filter((s) =>
    (!category || s.category_name === category) && 
    (!maxPrice || s.price <= Number(maxPrice))
  );

  if (loading) return <h2>Загрузка...</h2>;

  return (
    <>
      <h1>Услуги по ремонту техники</h1>

      <div className="filters">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.category_id}>{c.category_name}</option>)}
        </select>
        <input type="number" min="0" placeholder="Цена до, ₽" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
      </div>

      {(error || cartError) && <p className="error">{error || cartError}</p>}
      {message && !cartError && <p className="ok">{message}</p>}

      <div className="grid">
        {filtered.map((s) => <ServiceCard key={s.service_id} service={s} isAdmin={isAdmin} onAdd={handleAdd} />)}
      </div>
      {filtered.length === 0 && <p>Ничего не найдено.</p>}
    </>
  );
}

export default Catalog;
