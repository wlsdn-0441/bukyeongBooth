import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameSelect from './pages/GameSelect';
import ReactionGame from './pages/games/ReactionGame';
import ColorFindGame from './pages/games/ColorFindGame';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameSelect />} />
        <Route path="/game/reaction" element={<ReactionGame />} />
        <Route path="/game/colorfind" element={<ColorFindGame />} />
        {/* 나머지 게임들은 나중에 추가 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
