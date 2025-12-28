import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGameSession } from '../../utils/session';
import GameComplete from '../../components/GameComplete';
import './CapitalQuiz.css';

const TIME_PER_QUESTION = 15; // 각 문제당 15초

function CapitalQuiz() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('ready'); // ready, playing, complete
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0); // 최신 점수를 추적하기 위한 ref
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [answerOptions, setAnswerOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [quizData, setQuizData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    const loadQuizData = async () => {
      try {
        const response = await fetch('/capitalQuizData.json');
        const data = await response.json();
        setQuizData(data);
        setIsLoading(false);
      } catch (error) {
        console.error('퀴즈 데이터 로드 실패:', error);
        alert('데이터를 불러오는데 실패했습니다.');
        setIsLoading(false);
      }
    };
    loadQuizData();
  }, []);

  // 배열 섞기 함수
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  // 문제 섞기 및 답안 생성
  const initializeQuestion = useCallback((questionIndex, questions) => {
    if (questionIndex >= questions.length) {
      completeGame(scoreRef.current);
      return;
    }

    const currentQuestion = questions[questionIndex];
    const options = shuffleArray([
      currentQuestion.capital,
      ...currentQuestion.wrongAnswers
    ]);

    setAnswerOptions(options);
    setTimeLeft(TIME_PER_QUESTION);
    setSelectedAnswer(null);
    setIsCorrect(null);

    // 레벨 계산 (3문제당 1레벨)
    const newLevel = Math.floor(questionIndex / 3) + 1;
    setLevel(newLevel);
  }, []);

  // 게임 시작
  const handleStartGame = () => {
    if (quizData.length === 0) {
      alert('데이터를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const shuffled = shuffleArray(quizData);
    setShuffledQuestions(shuffled);
    setGameState('playing');
    setScore(0);
    scoreRef.current = 0;
    setLevel(1);
    setCurrentQuestionIndex(0);
    initializeQuestion(0, shuffled);
  };

  // 답안 클릭 핸들러
  const handleAnswerClick = (answer) => {
    if (selectedAnswer !== null || gameState !== 'playing') return;

    setSelectedAnswer(answer);
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const correct = answer === currentQuestion.capital;
    setIsCorrect(correct);

    if (correct) {
      // 정답 - 점수 추가 및 다음 문제
      const timeBonus = Math.floor((timeLeft / TIME_PER_QUESTION) * 50);
      const newScore = 100 + timeBonus + (level * 10);
      scoreRef.current += newScore;
      setScore(prev => prev + newScore);

      setTimeout(() => {
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        initializeQuestion(nextIndex, shuffledQuestions);
      }, 800);
    } else {
      // 오답 - 게임 오버
      setTimeout(() => {
        completeGame(scoreRef.current);
      }, 1000);
    }
  };

  // 게임 완료
  const completeGame = async (finalScore) => {
    try {
      const scoreToSave = finalScore !== undefined ? finalScore : score;
      const newSessionId = await createGameSession('capital', scoreToSave);
      setSessionId(newSessionId);
      setGameState('complete');
    } catch (error) {
      alert('세션 생성 실패: ' + error.message);
    }
  };

  // 타이머 (50ms 간격으로 부드럽게)
  useEffect(() => {
    if (gameState !== 'playing' || selectedAnswer !== null) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 0.05;
        if (newTime <= 0) {
          clearInterval(timer);
          // 시간 초과 - 게임 오버
          setTimeout(() => completeGame(scoreRef.current), 500);
          return 0;
        }
        return newTime;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [gameState, selectedAnswer, currentQuestionIndex]);

  const handleNext = () => {
    navigate('/');
  };

  // 게임 완료 화면
  if (gameState === 'complete') {
    return (
      <GameComplete
        sessionId={sessionId}
        score={score}
        gameType="capital"
        onNext={handleNext}
      />
    );
  }

  // 준비 화면
  if (gameState === 'ready') {
    return (
      <div className="capital-quiz">
        <div className="quiz-ready-container">
          <h1>수도 퀴즈</h1>
          <p>국가의 수도를 맞춰보세요!</p>
          {isLoading ? (
            <p>데이터를 불러오는 중...</p>
          ) : (
            <>
              <div className="quiz-rules">
                <h3>게임 규칙</h3>
                <ul>
                  <li>제시된 국가의 수도를 선택하세요</li>
                  <li>각 문제당 {TIME_PER_QUESTION}초의 시간이 주어집니다</li>
                  <li>빠르게 맞출수록 보너스 점수를 받습니다</li>
                  <li>틀리거나 시간이 초과되면 게임 오버</li>
                </ul>
              </div>
              <button className="quiz-start-btn" onClick={handleStartGame} disabled={isLoading}>
                게임 시작
              </button>
              <button className="quiz-back-btn" onClick={() => navigate('/')}>
                돌아가기
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 게임 플레이 화면
  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const timeProgress = (timeLeft / TIME_PER_QUESTION) * 100;

  return (
    <div className="capital-quiz">
      <div className="quiz-play-container">
        {/* 상단 대시보드 */}
        <div className="quiz-dashboard">
          <div className="dashboard-item">
            <span className="dashboard-label">레벨</span>
            <span className="dashboard-value">{level}</span>
          </div>
          <div className="dashboard-item">
            <span className="dashboard-label">점수</span>
            <span className="dashboard-value">{score}</span>
          </div>
          <div className="dashboard-item">
            <span className="dashboard-label">문제</span>
            <span className="dashboard-value">{currentQuestionIndex + 1}/{shuffledQuestions.length}</span>
          </div>
          <button className="quiz-exit-btn" onClick={() => navigate('/')}>
            나가기
          </button>
        </div>

        {/* 타이머 프로그레스 바 */}
        <div className="quiz-timer-container">
          <div className="quiz-timer-bar" style={{ width: `${timeProgress}%` }}></div>
          <span className="quiz-timer-text">{Math.ceil(timeLeft)}초</span>
        </div>

        {/* 국가 이름 박스 */}
        <div className="country-box">
          <div className="country-label">국가</div>
          <div className="country-name">{currentQuestion?.country}</div>
        </div>

        {/* 답안 그리드 (2x2) */}
        <div className="answers-grid">
          {answerOptions.map((answer, index) => (
            <button
              key={index}
              className={`answer-btn ${
                selectedAnswer === answer
                  ? isCorrect
                    ? 'correct'
                    : 'wrong'
                  : ''
              }`}
              onClick={() => handleAnswerClick(answer)}
              disabled={selectedAnswer !== null}
            >
              {answer}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CapitalQuiz;
