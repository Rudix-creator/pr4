import { useState, useEffect } from "react";
import { checkServer } from "./api";

// проверка сервера и базы данных
const ping = (setOnline) => checkServer().then(() => setOnline(true)).catch(() => setOnline(false));

// страница «Технические работы»: показывается, пока сервер или база данных недоступны
function ServerGate({ children }) {
  // null — идёт первая проверка, true — сервер работает, false — технические работы
  const [online, setOnline] = useState(null);

  useEffect(() => {
    ping(setOnline);
    // каждые 5 секунд проверяем сервер: упал — показываем страницу (в том числе в корзине и в админке), заработал — возвращаем сайт
    const timer = setInterval(() => ping(setOnline), 5000);
    // любой неудавшийся запрос к серверу сразу включает страницу технических работ
    const handleDown = () => setOnline(false);
    window.addEventListener("server-down", handleDown);
    return () => {
      clearInterval(timer);
      window.removeEventListener("server-down", handleDown);
    };
  }, []);

  if (online === null) return <main className="container"><h2>Загрузка...</h2></main>;

  if (!online) return (
    <main className="container">
      <div className="card">
        <h1>Технические работы</h1>
        <p>Нет связи с сервером: сервис временно недоступен, на сервере ведутся технические работы. Мы скоро вернёмся.</p>
        <p className="muted">Страница обновится сама, как только сервер заработает.</p>
        <button className="btn" onClick={() => ping(setOnline)}>Проверить снова</button>
      </div>
    </main>
  );

  return children;
}

export default ServerGate;
