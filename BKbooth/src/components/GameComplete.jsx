import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { addLetterToSession } from '../utils/session';
import './GameComplete.css';

function GameComplete({ sessionId, score, gameType, onNext }) {
  const navigate = useNavigate();
  const [letter, setLetter] = useState('');
  const [letterSubmitted, setLetterSubmitted] = useState(false);
  const [letterError, setLetterError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const qrValue = `https://bukyeong.com/claim?session=${sessionId}`;

  const gameTypeNames = {
    reaction: '반응속도',
    colorfind: '색깔 찾기',
    wordle: '워들',
    balloon: '풍선터뜨리기',
    capital: '수도 퀴즈'
  };

  // 5분 후 자동으로 메인 페이지로 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 300000); // 5분 = 300,000ms

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleLetterSubmit = async () => {
    if (!letter.trim()) {
      setLetterError('편지 내용을 입력해주세요');
      return;
    }

    if (letter.length > 500) {
      setLetterError('편지는 500자 이내로 작성해주세요');
      return;
    }

    setIsSubmitting(true);
    setLetterError('');

    try {
      await addLetterToSession(sessionId, letter);
      setLetterSubmitted(true);
    } catch (error) {
      setLetterError('편지 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="game-complete">
      <div className="complete-container">
        <h1 className="complete-title">게임 완료!</h1>

        <div className="score-display">
          <p className="game-type">{gameTypeNames[gameType]}</p>
          <p className="score">{score}{gameType === 'reaction' ? 'ms' : '점'}</p>
        </div>

        {/* 편지 작성 섹션 */}
        <div className="letter-section">
          <h2 className="letter-title">부경고에 한마디 남기기</h2>
          {!letterSubmitted ? (
            <div className="letter-form">
              <textarea
                className="letter-textarea"
                placeholder="부경고등학교에 하고 싶은 말을 남겨주세요 (선택사항)"
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                maxLength={500}
                rows={4}
              />
              <div className="letter-info">
                <span className="char-count">{letter.length}/500</span>
              </div>
              {letterError && <p className="letter-error">{letterError}</p>}
              <button
                className="letter-submit-btn"
                onClick={handleLetterSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? '저장 중...' : '편지 제출'}
              </button>
            </div>
          ) : (
            <div className="letter-success">
              <p className="success-icon">✓</p>
              <p className="success-message">편지가 성공적으로 제출되었습니다!</p>
            </div>
          )}
        </div>

        <div className="qr-section">
          <h2>휴대폰으로 QR 코드를 스캔하세요</h2>
          <div className="qr-code">
            <QRCodeSVG
              value={qrValue}
              size={300}
              level="H"
              includeMargin={true}
            />
          </div>

          <p className="expire-notice">
            ⏰ 15분 내에 점수를 등록해주세요
          </p>
        </div>

        <button className="next-btn" onClick={onNext}>
          다음 학생
        </button>
      </div>
    </div>
  );
}

export default GameComplete;
