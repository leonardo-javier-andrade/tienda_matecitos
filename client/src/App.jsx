import ListaProductos from './components/ListaProductos';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-contenido">
          <h1>🧉 Tienda Matecitos</h1>
          <p>Mates, bombillas y todo lo que necesitás para disfrutar un buen mate</p>
        </div>
      </header>

      <main>
        <ListaProductos />
      </main>

      <footer className="app-footer">
        <p>© {new Date().getFullYear()} Tienda Matecitos — Hecho con 🧉 en Argentina</p>
      </footer>
    </div>
  );
}

export default App;
