import { Link } from "react-router-dom";

// карточка услуги
function ServiceCard({ service, isAdmin, onAdd }) {
  return (
    <div className="card">
      <img
        className="service-img"
        src={`/images/${service.service_id}.jpg`}
        alt={service.name}
        onError={(e) => { e.target.onerror = null; e.target.src = "/images/placeholder.jpg"; }}
      />
      <span className="tag">{service.category_name}</span>
      <h3>{service.name}</h3>
      <p className="grow">{service.description}</p>
      <p>{service.duration_minutes} мин · <b>{service.price} рублей</b></p>
      <div className="row">
        <Link className="btn outline" to={`/service/${service.service_id}`}>Подробнее</Link>
        {!isAdmin && <button className="btn" onClick={() => onAdd(service)}>В корзину</button>}
      </div>
    </div>
  );
}

export default ServiceCard;
