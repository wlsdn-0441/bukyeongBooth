import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameSelect from './pages/GameSelect';
import ReactionGame from './pages/games/ReactionGame';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameSelect />} />
        <Route path="/game/reaction" element={<ReactionGame />} />
        {/* 나머지 게임들은 나중에 추가 */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
