import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TodoApp from './TodoApp';
import CarGame from './CarGame';
import ShopPage from './ShopPage';
import Navigation from './Navigation';

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<TodoApp />} />
        <Route path="/game" element={<CarGame />} />
        <Route path="/shop" element={<ShopPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
