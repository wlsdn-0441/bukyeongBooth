import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGameSession } from '../../utils/session';
import GameComplete from '../../components/GameComplete';
import './Wordle.css';

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

// 키보드 배열 정의
const keyboardRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['입력', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Back']
];

function Wordle() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('ready'); // ready, playing, finished, complete
  const [wordList, setWordList] = useState([]);
  const [targetWord, setTargetWord] = useState('');
  const [targetMean, setTargetMean] = useState('');
  const [currentRow, setCurrentRow] = useState(0);
  const [currentTile, setCurrentTile] = useState(0);
  const [board, setBoard] = useState(Array(MAX_ATTEMPTS).fill().map(() => Array(WORD_LENGTH).fill({ letter: '', status: '' })));
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  const [message, setMessage] = useState('');
  const [keyboardStatus, setKeyboardStatus] = useState({});

  // 단어 목록 로드
  useEffect(() => {
    const loadWords = async () => {
      try {
        const response = await fetch('/words.json');
        const data = await response.json();
        setWordList(data);
      } catch (error) {
        setMessage('단어 목록을 불러올 수 없습니다.');
        console.error('Error loading words:', error);
      }
    };
    loadWords();
  }, []);

  // 게임 완료 - 연속 정답 횟수 기록
  const completeGame = useCallback(async (wins) => {
    try {
      const newSessionId = await createGameSession('wordle', wins);
      setSessionId(newSessionId);
      setGameState('finished');
    } catch (error) {
      alert('세션 생성 실패: ' + error.message);
    }
  }, []);

  // 단어 확인
  const checkWord = useCallback(async () => {
    if (currentTile !== WORD_LENGTH) return;

    const guess = board[currentRow].map(tile => tile.letter).join('');
    const targetArr = targetWord.split('');
    const status = Array(WORD_LENGTH).fill('absent');
    const newBoard = board.map(row => [...row]);
    const newKeyboardStatus = { ...keyboardStatus };

    // 1차: 위치 일치 (Green)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === targetWord[i]) {
        status[i] = 'correct';
        targetArr[i] = null;
      }
    }

    // 2차: 포함 여부 (Yellow)
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (status[i] !== 'correct' && targetArr.includes(guess[i])) {
        status[i] = 'present';
        targetArr[targetArr.indexOf(guess[i])] = null;
      }
    }

    // 보드 업데이트
    for (let i = 0; i < WORD_LENGTH; i++) {
      newBoard[currentRow][i] = { letter: guess[i], status: status[i] };

      // 키보드 상태 업데이트 (우선순위: correct > present > absent)
      const currentStatus = newKeyboardStatus[guess[i]];
      if (!currentStatus ||
          (status[i] === 'correct') ||
          (status[i] === 'present' && currentStatus !== 'correct')) {
        newKeyboardStatus[guess[i]] = status[i];
      }
    }

    setBoard(newBoard);
    setKeyboardStatus(newKeyboardStatus);

    // 승리 체크
    if (guess === targetWord) {
      const newWins = consecutiveWins + 1;
      setConsecutiveWins(newWins);
      setMessage(`정답! ${newWins}회 연속 성공!`);

      // 다음 문제로 자동 이동 (1초 후)
      setTimeout(() => {
        if (wordList.length === 0) return;

        const selected = wordList[Math.floor(Math.random() * wordList.length)];
        setTargetWord(selected.word.toUpperCase());
        setTargetMean(selected.mean);
        setCurrentRow(0);
        setCurrentTile(0);
        setBoard(Array(MAX_ATTEMPTS).fill().map(() => Array(WORD_LENGTH).fill({ letter: '', status: '' })));
        setMessage('');
        setKeyboardStatus({});

        console.log('정답:', selected.word.toUpperCase());
      }, 1000);
    } else if (currentRow + 1 === MAX_ATTEMPTS) {
      // 게임 오버 - 연속 횟수를 점수로 등록
      setMessage(`실패!`);
      await completeGame(consecutiveWins);
    } else {
      // 다음 행으로
      setCurrentRow(currentRow + 1);
      setCurrentTile(0);
    }
  }, [currentTile, board, currentRow, targetWord, targetMean, keyboardStatus, completeGame, consecutiveWins, wordList]);

  // 글자 추가
  const addLetter = useCallback((letter) => {
    if (currentTile < WORD_LENGTH) {
      const newBoard = board.map(row => [...row]);
      newBoard[currentRow][currentTile] = { letter, status: '' };
      setBoard(newBoard);
      setCurrentTile(currentTile + 1);
    }
  }, [currentTile, currentRow, board]);

  // 글자 삭제
  const deleteLetter = useCallback(() => {
    if (currentTile > 0) {
      const newBoard = board.map(row => [...row]);
      newBoard[currentRow][currentTile - 1] = { letter: '', status: '' };
      setBoard(newBoard);
      setCurrentTile(currentTile - 1);
    }
  }, [currentTile, currentRow, board]);

  // 입력 처리
  const handleInput = useCallback((key) => {
    if (gameState !== 'playing') return;

    if (key === 'Enter') {
      checkWord();
    } else if (key === 'Backspace') {
      deleteLetter();
    } else if (/^[A-Z]$/.test(key)) {
      addLetter(key);
    }
  }, [gameState, checkWord, deleteLetter, addLetter]);

  // 키보드 입력 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'playing') return;

      if (e.key === 'Enter') {
        handleInput('Enter');
      } else if (e.key === 'Backspace') {
        handleInput('Backspace');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleInput(e.key.toUpperCase());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleInput]);

  // 게임 시작
  const handleStartGame = useCallback(() => {
    if (wordList.length === 0) {
      setMessage('단어 목록이 로드되지 않았습니다.');
      return;
    }

    const selected = wordList[Math.floor(Math.random() * wordList.length)];
    setTargetWord(selected.word.toUpperCase());
    setTargetMean(selected.mean);
    setCurrentRow(0);
    setCurrentTile(0);
    setBoard(Array(MAX_ATTEMPTS).fill().map(() => Array(WORD_LENGTH).fill({ letter: '', status: '' })));
    setConsecutiveWins(0);
    setMessage('');
    setKeyboardStatus({});
    setGameState('playing');

    console.log('정답:', selected.word.toUpperCase()); // 개발 확인용
  }, [wordList]);

  const handleNext = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleRegisterScore = useCallback(() => {
    setGameState('complete');
  }, []);

  const handleRetry = useCallback(() => {
    if (wordList.length === 0) {
      setMessage('단어 목록이 로드되지 않았습니다.');
      return;
    }

    const selected = wordList[Math.floor(Math.random() * wordList.length)];
    setTargetWord(selected.word.toUpperCase());
    setTargetMean(selected.mean);
    setCurrentRow(0);
    setCurrentTile(0);
    setBoard(Array(MAX_ATTEMPTS).fill().map(() => Array(WORD_LENGTH).fill({ letter: '', status: '' })));
    setConsecutiveWins(0);
    setMessage('');
    setKeyboardStatus({});
    setGameState('playing');

    console.log('정답:', selected.word.toUpperCase()); // 개발 확인용
  }, [wordList]);

  // 완료 화면
  if (gameState === 'complete') {
    return (
      <GameComplete
        sessionId={sessionId}
        score={consecutiveWins}
        gameType="wordle"
        onNext={handleNext}
      />
    );
  }

  // 정답 확인 화면
  if (gameState === 'finished') {
    return (
      <div className="wordle-game playing">
        <div className="game-layout">
          {/* 왼쪽 - 게임 설명 */}
          <aside className="game-guide">
            <h2>게임 방법</h2>
            <p className="guide-desc">6번의 시도로 5글자 영어 단어를 맞춰보세요!</p>

            <div className="color-examples">
              <div className="color-example">
                <div className="example-tile correct">G</div>
                <div className="example-text">
                  <strong>초록색</strong>
                  <span>글자와 위치 모두 일치</span>
                </div>
              </div>

              <div className="color-example">
                <div className="example-tile present">Y</div>
                <div className="example-text">
                  <strong>노란색</strong>
                  <span>글자는 맞지만 위치 다름</span>
                </div>
              </div>

              <div className="color-example">
                <div className="example-tile absent">R</div>
                <div className="example-text">
                  <strong>빨강색</strong>
                  <span>단어에 포함되지 않음</span>
                </div>
              </div>
            </div>

            <div className="game-tips">
              <h3>팁</h3>
              <ul>
                <li>먼저 모음이 많은 단어로 시작하세요</li>
                <li>초록색 글자의 위치는 고정입니다</li>
                <li>노란색 글자는 다른 위치에 있습니다</li>
              </ul>
            </div>
          </aside>

          {/* 중앙 - 게임 보드 */}
          <main className="game-center">
            <div className="timer-display">
              연속 정답: {consecutiveWins}회
            </div>

            <h1>WORDLE</h1>

            <div className="board">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="row">
                  {row.map((tile, colIndex) => (
                    <div
                      key={colIndex}
                      className={`tile ${tile.status}`}
                    >
                      {tile.letter}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {message && <div className="message">{message}</div>}
          </main>

          {/* 오른쪽 - 키보드 및 정답 */}
          <aside className="game-keyboard">
            <div className="keyboard">
              {keyboardRows.map((row, rowIndex) => (
                <div key={rowIndex} className="keyboard-row">
                  {row.map((key) => (
                    <button
                      key={key}
                      className={`key ${key === '입력' || key === 'Back' ? 'wide-key' : ''} ${keyboardStatus[key] || ''}`}
                      disabled
                    >
                      {key === 'Back' ? '⌫' : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* 정답 표시 영역 */}
            <div className="answer-box">
              <div className="answer-title">정답</div>
              <div className="answer-word">{targetWord}</div>
              <div className="answer-meaning">{targetMean}</div>
            </div>

            {/* 연속 정답 횟수에 따른 버튼 */}
            {consecutiveWins > 0 ? (
              <button className="register-btn" onClick={handleRegisterScore}>
                점수 등록하기
              </button>
            ) : (
              <button className="register-btn retry-btn" onClick={handleRetry}>
                다시 하기
              </button>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // 준비 화면
  if (gameState === 'ready') {
    return (
      <div className="wordle-game">
        <div className="game-container">
          <h1>WORDLE</h1>
          <div className="game-rules">
            <h2>게임 방법</h2>
            <p>5글자 영어 단어를 맞춰보세요.</p>

            <div className="example">
              <div className="mini-tile correct">G</div>
              <span>: 글자와 위치 모두 일치 (초록)</span>
            </div>
            <div className="example">
              <div className="mini-tile present">Y</div>
              <span>: 글자는 맞지만 위치 다름 (노랑)</span>
            </div>
            <div className="example">
              <div className="mini-tile absent">R</div>
              <span>: 일치하는 글자 없음 (빨강)</span>
            </div>
            <p className="note">입력을 눌러 확인하세요</p>
          </div>
          {message && <p className="error-message">{message}</p>}
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
  return (
    <div className="wordle-game playing">
      <div className="game-layout">
        {/* 왼쪽 - 게임 설명 */}
        <aside className="game-guide">
          <h2>게임 방법</h2>
          <p className="guide-desc">6번의 시도로 5글자 영어 단어를 맞춰보세요!</p>

          <div className="color-examples">
            <div className="color-example">
              <div className="example-tile correct">G</div>
              <div className="example-text">
                <strong>초록색</strong>
                <span>글자와 위치 모두 일치</span>
              </div>
            </div>

            <div className="color-example">
              <div className="example-tile present">Y</div>
              <div className="example-text">
                <strong>노란색</strong>
                <span>글자는 맞지만 위치 다름</span>
              </div>
            </div>

            <div className="color-example">
              <div className="example-tile absent">R</div>
              <div className="example-text">
                <strong>빨강색</strong>
                <span>단어에 포함되지 않음</span>
              </div>
            </div>
          </div>

          <div className="game-tips">
            <h3>팁</h3>
            <ul>
              <li>먼저 모음이 많은 단어로 시작하세요</li>
              <li>초록색 글자의 위치는 고정입니다</li>
              <li>노란색 글자는 다른 위치에 있습니다</li>
            </ul>
          </div>
        </aside>

        {/* 중앙 - 게임 보드 */}
        <main className="game-center">
          <div className="wordle-header">
            <div className="timer-display">
              연속 정답: {consecutiveWins}회
            </div>
            <button className="exit-game-btn" onClick={() => navigate('/')}>
              나가기
            </button>
          </div>

          <h1>WORDLE</h1>

          <div className="board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="row">
                {row.map((tile, colIndex) => (
                  <div
                    key={colIndex}
                    className={`tile ${tile.status} ${rowIndex === currentRow && colIndex === currentTile ? 'current' : ''}`}
                  >
                    {tile.letter}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {message && <div className="message">{message}</div>}
        </main>

        {/* 오른쪽 - 키보드 */}
        <aside className="game-keyboard">
          <div className="keyboard">
            {keyboardRows.map((row, rowIndex) => (
              <div key={rowIndex} className="keyboard-row">
                {row.map((key) => (
                  <button
                    key={key}
                    className={`key ${key === '입력' || key === 'Back' ? 'wide-key' : ''} ${keyboardStatus[key] || ''}`}
                    onClick={() => {
                      if (key === '입력') handleInput('Enter');
                      else if (key === 'Back') handleInput('Backspace');
                      else handleInput(key);
                    }}
                  >
                    {key === 'Back' ? '⌫' : key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Wordle;
