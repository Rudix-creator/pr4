import { useState } from "react";

const EMPTY = { name: "", description: "", duration_minutes: "", price: "", category_name: "" };

// форма услуги
function Productform({ service, categories, onSave, onCancel }) {
  const [form, setForm] = useState(service ? {
    name: service.name, description: service.description, duration_minutes: service.duration_minutes,
    price: service.price, category_name: service.category_name === "Нет категории" ? "" : service.category_name,
  } : EMPTY);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.category_name)
      return setError("Заполните название, описание и категорию");
    if (!(Number(form.duration_minutes) > 0)) return setError("Длительность должна быть больше 0");
    if (form.price === "" || Number(form.price) < 0) return setError("Укажите корректную цену");
    try {
      setSaving(true);
      setError(null);
      await onSave(form);
      if (!service) setForm(EMPTY);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h3>{service ? "Изменить услугу" : "Новая услуга"}</h3>
      <input name="name" placeholder="Название" value={form.name} onChange={handleChange} />
      <textarea name="description" placeholder="Описание" value={form.description} onChange={handleChange} />
      <select name="category_name" value={form.category_name} onChange={handleChange}>
        <option value="">Категория</option>
        {categories.map((c) => <option key={c.category_id}>{c.category_name}</option>)}
      </select>
      <input name="duration_minutes" type="number" placeholder="Длительность, мин" value={form.duration_minutes} onChange={handleChange} />
      <input name="price" type="number" placeholder="Цена, рублей" value={form.price} onChange={handleChange} />
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button className="btn" disabled={saving}>{saving ? "Сохранение..." : service ? "Сохранить" : "Добавить"}</button>
        {service && <button type="button" className="btn outline" onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  );
}

export default Productform;
