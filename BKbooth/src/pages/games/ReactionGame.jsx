import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGameSession } from '../../utils/session';
import GameComplete from '../../components/GameComplete';
import './ReactionGame.css';

function ReactionGame() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('ready'); // ready, waiting, active, complete
  const [startTime, setStartTime] = useState(null);
  const [reactionTime, setReactionTime] = useState(null);
  const [score, setScore] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const handleStartGame = () => {
    setGameState('waiting');

    // 3~5초 랜덤 대기
    const randomDelay = Math.random() * 2000 + 3000; // 3000~5000ms

    setTimeout(() => {
      setStartTime(Date.now());
      setGameState('active');
    }, randomDelay);
  };

  const handleScreenClick = () => {
    // waiting 상태에서 클릭하면 무시
    if (gameState === 'waiting') {
      return;
    }

    // active 상태에서만 반응
    if (gameState === 'active') {
      const endTime = Date.now();
      const reaction = endTime - startTime;

      setReactionTime(reaction);
      setScore(reaction); // 반응 시간을 그대로 점수로 저장 (ms)

      // 세션 생성 및 완료 처리
      createGameSessionAndComplete(reaction);
    }
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
          <p>화면이 빨간색으로 변하면 빠르게 클릭하세요!</p>
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

  // waiting 상태
  if (gameState === 'waiting') {
    return (
      <div className="game-screen waiting-screen" onClick={handleScreenClick}>
        <h2>대기하세요...</h2>
        <p>화면이 빨간색으로 변할 때까지 기다리세요</p>
      </div>
    );
  }

  // active 상태
  if (gameState === 'active') {
    return (
      <div className="game-screen active-screen" onClick={handleScreenClick}>
        <h2>지금 클릭!</h2>
      </div>
    );
  }
}

export default ReactionGame;
