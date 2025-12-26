import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import './GameComplete.css';

function GameComplete({ sessionId, score, gameType, onNext }) {
  const navigate = useNavigate();
  const qrValue = `https://bukyeong.com/claim?session=${sessionId}`;

  const gameTypeNames = {
    reaction: '반응속도',
    colorfind: '색깔 찾기',
    quiz: '퀴즈',
    balloon: '풍선터뜨리기'
  };

  // 5분 후 자동으로 메인 페이지로 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 300000); // 5분 = 300,000ms

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="game-complete">
      <div className="complete-container">
        <h1 className="complete-title">게임 완료!</h1>

        <div className="score-display">
          <p className="game-type">{gameTypeNames[gameType]}</p>
          <p className="score">{score}{gameType === 'reaction' ? 'ms' : '점'}</p>
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
