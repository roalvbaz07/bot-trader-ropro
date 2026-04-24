import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import {
  buildOtpAuthUri,
  buildQrDataUrl,
  generateSecret,
  getTotpRecord,
  saveTotpRecord,
  verifyToken,
} from "@/lib/totp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Step = "credentials" | "setup" | "verify";

const credSchema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(200),
});

const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Debe tener 6 dígitos");

export default function Login() {
  const navigate = useNavigate();
  const { user, totpVerified, setTotpVerified, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  // Setup step state
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Already authenticated + verified → go home.
  useEffect(() => {
    if (!authLoading && user && totpVerified) navigate("/", { replace: true });
  }, [user, totpVerified, authLoading, navigate]);

  // If user is logged-in but TOTP step pending (e.g. refresh), figure out which screen.
  useEffect(() => {
    if (authLoading || !user || totpVerified) return;
    if (step !== "credentials") return;
    (async () => {
      const rec = await getTotpRecord(user.uid);
      if (!rec || !rec.enabled) {
        const secret = generateSecret();
        const uri = buildOtpAuthUri(user.email ?? user.uid, secret);
        const qr = await buildQrDataUrl(uri);
        setPendingSecret(secret);
        setQrDataUrl(qr);
        setStep("setup");
      } else {
        setStep("verify");
      }
    })();
  }, [user, totpVerified, authLoading, step]);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, parsed.data.email, parsed.data.password);
      const rec = await getTotpRecord(cred.user.uid);
      if (!rec || !rec.enabled) {
        const secret = generateSecret();
        const uri = buildOtpAuthUri(cred.user.email ?? cred.user.uid, secret);
        const qr = await buildQrDataUrl(uri);
        setPendingSecret(secret);
        setQrDataUrl(qr);
        setStep("setup");
      } else {
        setStep("verify");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al iniciar sesión";
      toast.error(
        msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")
          ? "Credenciales incorrectas"
          : "No se pudo iniciar sesión",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSetupConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingSecret) return;
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!verifyToken(parsed.data, pendingSecret)) {
      toast.error("Código inválido. Vuelve a comprobar la app.");
      return;
    }
    setBusy(true);
    try {
      await saveTotpRecord(user.uid, {
        secret: pendingSecret,
        enabled: true,
        createdAt: Date.now(),
      });
      setTotpVerified(true);
      toast.success("2FA activado correctamente");
      navigate("/", { replace: true });
    } catch {
      toast.error("No se pudo guardar la configuración 2FA");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      const rec = await getTotpRecord(user.uid);
      if (!rec?.secret || !verifyToken(parsed.data, rec.secret)) {
        toast.error("Código inválido o expirado");
        return;
      }
      setTotpVerified(true);
      navigate("/", { replace: true });
    } catch {
      toast.error("Error verificando el código");
    } finally {
      setBusy(false);
    }
  };

  const headerTitle = useMemo(() => {
    if (step === "credentials") return "Inicia sesión";
    if (step === "setup") return "Configura 2FA";
    return "Verificación 2FA";
  }, [step]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6 bg-surface border-border">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="font-mono text-lg font-semibold tracking-wide">{headerTitle}</h1>
        </div>

        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
            </Button>
          </form>
        )}

        {step === "setup" && qrDataUrl && (
          <form onSubmit={handleSetupConfirm} className="space-y-4">
            <p className="text-sm text-dim">
              Escanea este código con <strong className="text-foreground">Microsoft Authenticator</strong> (o
              cualquier app TOTP) y luego introduce el código de 6 dígitos para confirmar.
            </p>
            <div className="flex justify-center bg-white rounded-md p-3">
              <img src={qrDataUrl} alt="QR TOTP" width={220} height={220} />
            </div>
            {pendingSecret && (
              <p className="text-[11px] text-dim-2 font-mono break-all text-center">
                Clave manual: {pendingSecret}
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="setup-code">Código de la app</Label>
              <Input
                id="setup-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activar 2FA"}
            </Button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-dim">
              Introduce el código de 6 dígitos que muestra <strong className="text-foreground">Microsoft Authenticator</strong>.
              El código caduca cada 30 segundos.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="verify-code">Código</Label>
              <Input
                id="verify-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                autoFocus
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
}
