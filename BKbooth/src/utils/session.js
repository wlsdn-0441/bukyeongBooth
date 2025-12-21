import { db } from './firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

// 6자리 랜덤 영숫자 생성
export function generateSessionId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 게임 세션 생성
export async function createGameSession(gameType, score) {
  try {
    const sessionId = generateSessionId();
    const now = Timestamp.now();
    const expiresAt = new Timestamp(now.seconds + 15 * 60, 0); // 15분 후

    await setDoc(doc(db, 'gameSessions', sessionId), {
      sessionId,
      gameType,
      score,
      createdAt: now,
      expiresAt,
      claimed: false,
      claimedBy: null,
      claimedAt: null
    });

    return sessionId;
  } catch (error) {
    console.error('세션 생성 실패:', error);
    throw error;
  }
}
