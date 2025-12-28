import { BrowserRouter, Routes, Route } from 'react-router-dom';
import GameSelect from './pages/GameSelect';
import ReactionGame from './pages/games/ReactionGame';
import ColorFindGame from './pages/games/ColorFindGame';
import Wordle from './pages/games/Wordle';
import CapitalQuiz from './pages/games/CapitalQuiz';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameSelect />} />
        <Route path="/game/reaction" element={<ReactionGame />} />
        <Route path="/game/colorfind" element={<ColorFindGame />} />
        <Route path="/game/wordle" element={<Wordle />} />
        <Route path="/game/capital" element={<CapitalQuiz />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
