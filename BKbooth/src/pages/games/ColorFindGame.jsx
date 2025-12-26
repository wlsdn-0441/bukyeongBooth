import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGameSession } from '../../utils/session';
import GameComplete from '../../components/GameComplete';
import './ColorFindGame.css';

// 레벨 설정
const LEVEL_CONFIG = {
  1: { grid: 2, diff: 25, time: 10 },
  2: { grid: 3, diff: 15, time: 12 },
  3: { grid: 4, diff: 10, time: 14 },
  4: { grid: 5, diff: 7, time: 16 },
  5: { grid: 6, diff: 5, time: 18 }
};

function ColorFindGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('ready'); // ready, playing, complete
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(LEVEL_CONFIG[1].time);
  const [questionsInLevel, setQuestionsInLevel] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [differentTileIndex, setDifferentTileIndex] = useState(0);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [highScore, setHighScore] = useState(0);

  // HSL 색상 생성
  const generateColors = useCallback((level) => {
    const config = LEVEL_CONFIG[level];
    const gridSize = config.grid * config.grid;

    // 기본 색상 (HSL)
    const hue = Math.floor(Math.random() * 360);
    const saturation = 50 + Math.floor(Math.random() * 30); // 50-80%
    const baseLightness = 45 + Math.floor(Math.random() * 20); // 45-65%

    // 다른 색상 (Lightness만 변경)
    const diffLightness = baseLightness + (Math.random() > 0.5 ? config.diff : -config.diff);
    const clampedDiffLightness = Math.max(10, Math.min(90, diffLightness));

    const baseColor = `hsl(${hue}, ${saturation}%, ${baseLightness}%)`;
    const differentColor = `hsl(${hue}, ${saturation}%, ${clampedDiffLightness}%)`;

    // 다른 타일 위치 랜덤
    const differentIndex = Math.floor(Math.random() * gridSize);

    // 타일 배열 생성
    const newTiles = Array(gridSize).fill(baseColor).map((color, index) =>
      index === differentIndex ? differentColor : color
    );

    setTiles(newTiles);
    setDifferentTileIndex(differentIndex);
  }, []);

  // 새 문제 생성
  const generateNewQuestion = useCallback((currentLevel = level) => {
    setClickedIndex(null);
    setIsCorrect(null);
    generateColors(currentLevel);
    setTimeLeft(LEVEL_CONFIG[currentLevel].time);
  }, [level, generateColors]);

  // 게임 시작
  const handleStartGame = () => {
    setGameState('playing');
    setLevel(1);
    setScore(0);
    setCombo(0);
    setQuestionsInLevel(0);
    generateNewQuestion();
  };

  // 타일 클릭 핸들러
  const handleTileClick = async (index) => {
    if (clickedIndex !== null || gameState !== 'playing') return;

    setClickedIndex(index);

    if (index === differentTileIndex) {
      // 정답
      setIsCorrect(true);
      const timeBonus = timeLeft / LEVEL_CONFIG[level].time;
      const newScore = Math.floor(100 * level * (1 + combo * 0.1) * timeBonus);
      setScore(prev => prev + newScore);
      setCombo(prev => prev + 1);

      // 3문제 완료 시 레벨업
      setTimeout(() => {
        const nextQuestion = questionsInLevel + 1;
        setQuestionsInLevel(nextQuestion);

        if (nextQuestion >= 3) {
          if (level < 5) {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            setQuestionsInLevel(0);
            generateNewQuestion(nextLevel);
          } else {
            // 게임 완료
            completeGame();
          }
        } else {
          generateNewQuestion();
        }
      }, 500);
    } else {
      // 오답
      setIsCorrect(false);
      setCombo(0);

      setTimeout(() => {
        // 게임 오버
        completeGame();
      }, 1000);
    }
  };

  // 게임 완료
  const completeGame = async () => {
    try {
      const finalScore = score;
      if (finalScore > highScore) {
        setHighScore(finalScore);
      }
      const newSessionId = await createGameSession('colorfind', finalScore);
      setSessionId(newSessionId);
      setGameState('complete');
    } catch (error) {
      alert('세션 생성 실패: ' + error.message);
    }
  };

  // 타이머
  useEffect(() => {
    if (gameState !== 'playing' || clickedIndex !== null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 시간 초과 - 게임 오버
          setCombo(0);
          setTimeout(() => completeGame(), 500);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, clickedIndex, level]);

  const handleNext = () => {
    navigate('/');
  };

  // 게임 완료 화면
  if (gameState === 'complete') {
    return (
      <GameComplete
        sessionId={sessionId}
        score={score}
        gameType="colorfind"
        onNext={handleNext}
      />
    );
  }

  // 준비 화면
  if (gameState === 'ready') {
    return (
      <div className="colorfind-game">
        <div className="game-container">
          <h1>색깔 찾기 게임</h1>
          <p>다른 색깔의 타일을 찾으세요!</p>
          <div className="game-rules">
            <h3>게임 규칙</h3>
            <ul>
              <li>하나만 다른 색깔의 타일을 찾으세요</li>
              <li>각 레벨마다 3문제를 맞춰야 합니다</li>
              <li>연속으로 맞추면 콤보 보너스!</li>
              <li>틀리거나 시간이 초과되면 게임 오버</li>
            </ul>
          </div>
          <button className="start-btn" onClick={handleStartGame}>
            게임 시작
          </button>
          <button className="back-btn" onClick={() => navigate('/')}>
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 게임 플레이 화면
  const config = LEVEL_CONFIG[level];
  const timeProgress = (timeLeft / config.time) * 100;

  return (
    <div className="colorfind-game">
      <div className="game-play-container">
        {/* 상단 정보 */}
        <div className="game-info">
          <div className="info-item">
            <span className="info-label">레벨</span>
            <span className="info-value">{level}</span>
          </div>
          <div className="info-item">
            <span className="info-label">점수</span>
            <span className="info-value">{score}</span>
          </div>
          <div className="info-item">
            <span className="info-label">문제</span>
            <span className="info-value">{questionsInLevel + 1}/3</span>
          </div>
        </div>

        {/* 타이머 프로그레스 바 */}
        <div className="timer-container">
          <div className="timer-bar" style={{ width: `${timeProgress}%` }}></div>
          <span className="timer-text">{timeLeft}초</span>
        </div>

        {/* 타일 그리드 */}
        <div
          className={`tiles-grid grid-${config.grid}`}
          style={{
            gridTemplateColumns: `repeat(${config.grid}, 1fr)`,
            gridTemplateRows: `repeat(${config.grid}, 1fr)`
          }}
        >
          {tiles.map((color, index) => (
            <div
              key={index}
              className={`tile ${clickedIndex === index ? (isCorrect ? 'correct' : 'wrong') : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => handleTileClick(index)}
            />
          ))}
        </div>

        {/* 하단 정보 */}
        <div className="bottom-info">
          {combo > 0 && (
            <div className="combo-display">
              🔥 콤보 x{combo}
            </div>
          )}
          {highScore > 0 && (
            <div className="high-score">
              최고 기록: {highScore}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ColorFindGame;
