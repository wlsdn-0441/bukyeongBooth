import { QRCodeSVG } from 'qrcode.react';
import './GameComplete.css';

function GameComplete({ sessionId, score, gameType, onNext }) {
  const qrValue = `https://bukyeongsite.vercel.app/claim?session=${sessionId}`;

  const gameTypeNames = {
    reaction: '반응속도',
    timing: '타이밍',
    quiz: '퀴즈',
    balloon: '풍선터뜨리기'
  };

  return (
    <div className="game-complete">
      <div className="complete-container">
        <h1 className="complete-title">게임 완료!</h1>

        <div className="score-display">
          <p className="game-type">{gameTypeNames[gameType]}</p>
          <p className="score">{score}ms</p>
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

          <div className="session-code">
            <p>세션 코드 (수동 입력용):</p>
            <p className="code">{sessionId}</p>
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
