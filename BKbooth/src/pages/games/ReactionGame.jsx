import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGameSession } from '../../utils/session';
import GameComplete from '../../components/GameComplete';
import './ReactionGame.css';

function ReactionGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('ready'); // ready, waiting, active, processing, complete, tooEarly
  const [reactionTime, setReactionTime] = useState(null);
  const [score, setScore] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [timeoutId, setTimeoutId] = useState(null);
  const startTimeRef = useRef(null);

  const handleStartGame = () => {
    setGameState('waiting');
    startTimeRef.current = null;

    // 3~5초 랜덤 대기
    const randomDelay = Math.random() * 2000 + 3000; // 3000~5000ms

    const id = setTimeout(() => {
      setGameState('active');
    }, randomDelay);

    setTimeoutId(id);
  };

  // 화면이 실제로 'active' 상태로 렌더링되는 정확한 시점을 측정
  useEffect(() => {
    if (gameState === 'active') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 2번의 requestAnimationFrame으로 확실히 렌더링 완료 후 시간 기록
          startTimeRef.current = performance.now();
        });
      });
    }
  }, [gameState]);

  const handleScreenClick = () => {
    // 이미 처리 중이면 무시 (중복 방지)
    if (gameState === 'processing') {
      return;
    }

    // waiting 상태에서 클릭하면 너무 빨리 누른 것
    if (gameState === 'waiting') {
      clearTimeout(timeoutId);
      setGameState('tooEarly');
      return;
    }

    // active 상태에서만 반응
    if (gameState === 'active' && startTimeRef.current !== null) {
      setGameState('processing'); // 중복 클릭 방지

      // 클릭 이벤트가 발생한 정확한 시점 측정
      const endTime = performance.now();
      const reaction = Math.round(endTime - startTimeRef.current);

      setReactionTime(reaction);
      setScore(reaction); // 반응 시간을 그대로 점수로 저장 (ms)

      // 세션 생성 및 완료 처리
      createGameSessionAndComplete(reaction);
    }
  };

  const handleRetry = () => {
    setGameState('ready');
    setReactionTime(null);
    setScore(null);
    setTimeoutId(null);
    startTimeRef.current = null;
  };

  const createGameSessionAndComplete = async (finalScore) => {
    try {
      const newSessionId = await createGameSession('reaction', finalScore);
      setSessionId(newSessionId);
      setGameState('complete');
    } catch (error) {
      alert('세션 생성 실패: ' + error.message);
    }
  };

  const handleNext = () => {
    navigate('/');
  };

  // complete 상태
  if (gameState === 'complete') {
    return (
      <GameComplete
        sessionId={sessionId}
        score={score}
        gameType="reaction"
        onNext={handleNext}
      />
    );
  }

  // ready 상태
  if (gameState === 'ready') {
    return (
      <div className="reaction-game">
        <div className="game-container">
          <h1>반응속도 테스트</h1>
          <p>화면 색깔이 변하면 빠르게 클릭하세요!</p>
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

  // tooEarly 상태
  if (gameState === 'tooEarly') {
    return (
      <div className="reaction-game">
        <div className="game-container too-early">
          <h1>너무 빨리 눌렀습니다!</h1>
          <p>색깔이 변경될 때까지 기다려야 합니다.</p>
          <button className="start-btn" onClick={handleRetry}>
            다시 시작
          </button>
          <button className="back-btn" onClick={() => navigate('/')}>
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // waiting 상태
  if (gameState === 'waiting') {
    return (
      <div
        className="game-screen waiting-screen"
        onClick={handleScreenClick}
        onTouchEnd={handleScreenClick}
      >
        <h2>대기하세요...</h2>
        <p>화면 색깔이 변할 때까지 기다리세요</p>
      </div>
    );
  }

  // active 상태 또는 processing 상태
  if (gameState === 'active' || gameState === 'processing') {
    return (
      <div
        className="game-screen active-screen"
        onClick={handleScreenClick}
        onTouchEnd={handleScreenClick}
      >
        <h2>지금 클릭!</h2>
      </div>
    );
  }
}

export default ReactionGame;
