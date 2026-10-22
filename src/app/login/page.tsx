"use client";

import { useState, useTransition, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ShieldCheck, Eye, EyeOff, ArrowRight, AlertCircle, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginWithPin } from "@/actions/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleKeypadPress = (digit: string) => {
    setError(null);
    if (pin.length < 12) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setError(null);
    setPin("");
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin.trim()) {
      setError("Por favor ingresa el PIN o contraseña.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await loginWithPin(pin, rememberMe);
      if (res.success) {
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(res.error || "PIN incorrecto.");
        setPin("");
      }
    });
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      {/* Header Logo & Title */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 p-3 shadow-xl flex items-center justify-center">
          <Image
            src="/logotaller.webp"
            alt="Logo Taller San Luis"
            width={64}
            height={80}
            className="h-14 w-auto object-contain drop-shadow"
            priority
          />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Taller Mecánico San Luis
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Panel de Administración Operativa
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 border-b border-zinc-800/80 pb-3">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Ingreso con PIN o Contraseña</span>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in zoom-in-95">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-zinc-400 block">
              PIN de Acceso / Contraseña Maestra
            </label>
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value);
                }}
                placeholder="Ingresa tu PIN..."
                autoFocus
                className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600 tracking-widest text-center font-mono text-lg h-11 pr-10 focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                tabIndex={-1}
                title={showPin ? "Ocultar" : "Mostrar"}
              >
                {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Quick-tap numeric keypad for mobile */}
          <div className="pt-1">
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-11 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 active:bg-zinc-700 text-white font-mono text-base font-semibold border border-zinc-800 transition-colors"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-11 rounded-xl bg-zinc-950/40 hover:bg-zinc-800/60 active:bg-zinc-700 text-zinc-400 text-xs font-medium border border-zinc-800/60 transition-colors"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress("0")}
                className="h-11 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 active:bg-zinc-700 text-white font-mono text-base font-semibold border border-zinc-800 transition-colors"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="h-11 rounded-xl bg-zinc-950/40 hover:bg-zinc-800/60 active:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800/60 transition-colors"
                title="Borrar"
              >
                <Delete className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-zinc-400 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
              />
              <span>Recordar sesión</span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={isPending || !pin.trim()}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all mt-2"
          >
            {isPending ? (
              "Verificando..."
            ) : (
              <>
                <span>Acceder al Taller</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Security note for client QR vs admin */}
      <div className="rounded-xl bg-zinc-900/40 border border-zinc-800/50 p-3.5 text-center text-[11px] text-zinc-500 space-y-1">
        <p className="flex items-center justify-center gap-1.5 text-zinc-400 font-medium">
          <Lock className="h-3 w-3 text-amber-500" />
          Área Privada del Taller
        </p>
        <p>
          Los clientes no necesitan contraseña; acceden únicamente al historial de su vehículo escaneando el código QR.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-950 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white text-sm">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
