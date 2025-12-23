import { useNavigate } from 'react-router-dom';
import './GameSelect.css';

function GameSelect() {
  const navigate = useNavigate();

  const games = [
    { id: 'reaction', name: '반응속도', icon: '⚡', color: '#667eea' },
    { id: 'timing', name: '타이밍', icon: '⏱️', color: '#f56565' },
    { id: 'quiz', name: '퀴즈', icon: '🧠', color: '#48bb78' },
    { id: 'balloon', name: '풍선터뜨리기', icon: '🎈', color: '#ed8936' }
  ];

  return (
    <div className="game-select">
      <div className="select-container">
        <h1 className="main-title">부경고등학교 미니게임</h1>
        <p className="subtitle">플레이할 게임을 선택하세요</p>

        <div className="game-grid">
          {games.map(game => (
            <button
              key={game.id}
              className="game-card"
              style={{ borderColor: game.color }}
              onClick={() => navigate(`/game/${game.id}`)}
            >
              <div className="game-icon">{game.icon}</div>
              <div className="game-name">{game.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GameSelect;
