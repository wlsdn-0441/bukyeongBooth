import { useState, useEffect, useCallback, useRef } from 'react';
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
  const canvasRef = useRef(null);
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
  const [animationProgress, setAnimationProgress] = useState(0);
  const animationFrameRef = useRef(null);

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

  // 캔버스에 그리드 그리기
  useEffect(() => {
    if (gameState !== 'playing' || !canvasRef.current || tiles.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const config = LEVEL_CONFIG[level];
    const gridSize = config.grid;

    // 캔버스 크기 설정 (고해상도 대응)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const canvasWidth = rect.width;
    const canvasHeight = rect.height;

    // 배경 클리어
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // gap과 padding 계산 (CSS와 동일하게)
    let gap, padding;
    if (gridSize === 2) { gap = 8; padding = 16; }
    else if (gridSize === 3) { gap = 6; padding = 14; }
    else if (gridSize === 4) { gap = 5; padding = 12; }
    else if (gridSize === 5) { gap = 4; padding = 10; }
    else { gap = 3; padding = 8; }

    const availableWidth = canvasWidth - (2 * padding) - (gap * (gridSize - 1));
    const availableHeight = canvasHeight - (2 * padding) - (gap * (gridSize - 1));
    const tileWidth = availableWidth / gridSize;
    const tileHeight = availableHeight / gridSize;

    // 둥근 사각형 그리기 함수
    const roundRect = (x, y, width, height, radius) => {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + width - radius, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
      ctx.lineTo(x + width, y + height - radius);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      ctx.lineTo(x + radius, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
    };

    // 타일 그리기
    tiles.forEach((color, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      const x = padding + col * (tileWidth + gap);
      const y = padding + row * (tileHeight + gap);

      // 애니메이션 효과 계산
      let scale = 1;
      let glowIntensity = 0;
      let offsetX = 0;

      if (clickedIndex === index && animationProgress < 1) {
        if (isCorrect) {
          // 정답: 펄스 효과
          const pulse = Math.sin(animationProgress * Math.PI);
          scale = 1 + pulse * 0.08;
          glowIntensity = pulse;
        } else {
          // 오답: 흔들림 효과
          const shake = Math.sin(animationProgress * Math.PI * 4);
          offsetX = shake * 10 * (1 - animationProgress);
          glowIntensity = 1 - animationProgress;
        }
      }

      // 타일 중심점
      const centerX = x + tileWidth / 2;
      const centerY = y + tileHeight / 2;

      // scale 및 offset 적용을 위한 translate
      ctx.save();
      ctx.translate(centerX + offsetX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      // Glow 효과 (클릭된 타일)
      if (clickedIndex === index && glowIntensity > 0) {
        ctx.shadowBlur = 20 * glowIntensity;
        ctx.shadowColor = isCorrect ? '#48bb78' : '#f56565';
      }

      // 둥근 타일 그리기
      roundRect(x, y, tileWidth, tileHeight, 8);
      ctx.fillStyle = color;
      ctx.fill();

      // Shadow 리셋
      ctx.shadowBlur = 0;

      // 타일 테두리 (흰색 하이라이트)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 정답/오답 표시
      if (clickedIndex === index && animationProgress >= 0.5) {
        const borderOffset = 2 + (1 - animationProgress) * 4;
        roundRect(x - borderOffset, y - borderOffset, tileWidth + borderOffset * 2, tileHeight + borderOffset * 2, 8);
        if (isCorrect) {
          ctx.strokeStyle = '#48bb78';
          ctx.lineWidth = 4 + animationProgress * 2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#f56565';
          ctx.lineWidth = 4 + animationProgress * 2;
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }, [tiles, clickedIndex, isCorrect, gameState, level, animationProgress]);

  // 클릭 애니메이션 실행
  useEffect(() => {
    if (clickedIndex === null) return;

    setAnimationProgress(0);
    const startTime = Date.now();
    const duration = isCorrect ? 400 : 500; // 정답: 400ms, 오답: 500ms

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [clickedIndex, isCorrect]);

  // 새 문제 생성
  const generateNewQuestion = useCallback((currentLevel = level) => {
    setClickedIndex(null);
    setIsCorrect(null);
    setAnimationProgress(0);
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

  // 캔버스 클릭 핸들러
  const handleCanvasClick = (event) => {
    if (clickedIndex !== null || gameState !== 'playing' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const config = LEVEL_CONFIG[level];
    const gridSize = config.grid;

    // gap과 padding 계산 (CSS와 동일하게)
    let gap, padding;
    if (gridSize === 2) { gap = 8; padding = 16; }
    else if (gridSize === 3) { gap = 6; padding = 14; }
    else if (gridSize === 4) { gap = 5; padding = 12; }
    else if (gridSize === 5) { gap = 4; padding = 10; }
    else { gap = 3; padding = 8; }

    const availableWidth = rect.width - (2 * padding) - (gap * (gridSize - 1));
    const availableHeight = rect.height - (2 * padding) - (gap * (gridSize - 1));
    const tileWidth = availableWidth / gridSize;
    const tileHeight = availableHeight / gridSize;

    // 클릭한 타일 인덱스 계산
    let clickedTileIndex = -1;
    for (let i = 0; i < gridSize * gridSize; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      const tileX = padding + col * (tileWidth + gap);
      const tileY = padding + row * (tileHeight + gap);

      if (x >= tileX && x <= tileX + tileWidth && y >= tileY && y <= tileY + tileHeight) {
        clickedTileIndex = i;
        break;
      }
    }

    if (clickedTileIndex === -1) return;

    setClickedIndex(clickedTileIndex);

    if (clickedTileIndex === differentTileIndex) {
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
          <button className="exit-game-btn" onClick={() => navigate('/')}>
            나가기
          </button>
        </div>

        {/* 타이머 프로그레스 바 */}
        <div className="timer-container">
          <div className="timer-bar" style={{ width: `${timeProgress}%` }}></div>
          <span className="timer-text">{timeLeft}초</span>
        </div>

        {/* 타일 그리드 (Canvas) */}
        <div className="tiles-grid-wrapper">
          <canvas
            ref={canvasRef}
            className={`tiles-canvas grid-${config.grid}`}
            onClick={handleCanvasClick}
          />
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
