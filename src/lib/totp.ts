import { authenticator } from "@otplib/preset-browser";
import QRCode from "qrcode";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// 30s window — Microsoft Authenticator estándar.
authenticator.options = { ...authenticator.options, step: 30, window: 1 };

const ISSUER = "BotInversor";

export interface TotpRecord {
  secret: string;
  enabled: boolean;
  createdAt: number;
}

export function generateSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpAuthUri(email: string, secret: string): string {
  return authenticator.keyuri(email, ISSUER, secret);
}

export async function buildQrDataUrl(otpauth: string): Promise<string> {
  return QRCode.toDataURL(otpauth, { margin: 1, width: 240 });
}

export function verifyToken(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

export async function getTotpRecord(uid: string): Promise<TotpRecord | null> {
  const snap = await getDoc(doc(db, "totp", uid));
  if (!snap.exists()) return null;
  return snap.data() as TotpRecord;
}

export async function saveTotpRecord(uid: string, rec: TotpRecord): Promise<void> {
  await setDoc(doc(db, "totp", uid), rec);
}
