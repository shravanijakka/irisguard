import { AuthResult } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@/hooks/useActor";
import {
  CheckCircle,
  Eye,
  Loader2,
  Lock,
  Scan,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface AuthPageProps {
  onLoginSuccess: (token: bigint, username: string) => void;
}

async function sha256Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getIrisTemplate(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  [AuthResult.userNotFound]: "User not found. Please register first.",
  [AuthResult.irisMismatch]:
    "Iris pattern mismatch. Biometric verification failed.",
  [AuthResult.internalError]: "System error. Please try again.",
  [AuthResult.invalidCredentials]: "Invalid username or password.",
};

const TICK_ANGLES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

interface StepIndicatorProps {
  currentStep: number;
}

function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { label: "Credentials", icon: Lock },
    { label: "Iris Scan", icon: Scan },
    { label: "Access", icon: CheckCircle },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isActive = i + 1 === currentStep;
        const isDone = i + 1 < currentStep;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isDone
                    ? "border-success bg-success/20 text-success"
                    : isActive
                      ? "border-primary bg-primary/20 text-primary scan-active"
                      : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-xs font-mono uppercase tracking-wider ${
                  isActive
                    ? "text-primary"
                    : isDone
                      ? "text-success"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 h-px mx-1 mb-5 transition-all duration-500 ${
                  isDone ? "bg-success" : "bg-border"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface IrisScannerProps {
  hasFile: boolean;
  isScanning: boolean;
  isSuccess: boolean;
}

function IrisScanner({ hasFile, isScanning, isSuccess }: IrisScannerProps) {
  return (
    <div className="relative flex items-center justify-center w-40 h-40 mx-auto">
      <div
        className={`absolute inset-0 rounded-full border-2 iris-ring-1 transition-colors duration-500 ${
          isSuccess
            ? "border-success/60"
            : hasFile
              ? "border-primary/60"
              : "border-border/40"
        }`}
      />
      <div
        className={`absolute inset-3 rounded-full border iris-ring-2 transition-colors duration-500 ${
          isSuccess
            ? "border-success/40"
            : hasFile
              ? "border-primary/40"
              : "border-border/30"
        }`}
      />
      <div
        className={`absolute inset-6 rounded-full border iris-ring-3 transition-colors duration-500 ${
          isSuccess
            ? "border-success/30"
            : hasFile
              ? "border-primary/30"
              : "border-border/20"
        }`}
      />
      {TICK_ANGLES.map((angle) => (
        <div
          key={angle}
          className={`absolute w-0.5 h-2 transition-colors duration-500 ${
            isSuccess
              ? "bg-success/70"
              : hasFile
                ? "bg-primary/70"
                : "bg-border/50"
          }`}
          style={{
            transformOrigin: "50% 80px",
            transform: `rotate(${angle}deg) translateX(-50%)`,
            left: "50%",
            top: "0",
          }}
        />
      ))}
      <div
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 iris-glow ${
          isSuccess
            ? "bg-success/10 border-2 border-success"
            : hasFile
              ? "bg-primary/10 border-2 border-primary"
              : "bg-muted/30 border-2 border-border"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
            isSuccess
              ? "bg-success/20"
              : hasFile
                ? "bg-primary/20"
                : "bg-muted/50"
          }`}
        >
          {isScanning ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <Eye
              className={`w-5 h-5 transition-colors ${hasFile ? "text-primary" : "text-muted-foreground"}`}
            />
          )}
        </div>
        {isScanning && (
          <div
            className="absolute left-1 right-1 h-px bg-primary/80"
            style={{ animation: "iris-scan-line 1.5s ease-in-out infinite" }}
          />
        )}
      </div>
    </div>
  );
}

interface FileUploadZoneProps {
  irisFile: File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

function FileUploadZone({
  irisFile,
  onFileChange,
  fileInputRef,
}: FileUploadZoneProps) {
  return (
    <button
      type="button"
      className={`relative w-full border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-all duration-300 ${
        irisFile
          ? "border-primary/60 bg-primary/5"
          : "border-border hover:border-primary/40 hover:bg-primary/5"
      }`}
      onClick={() => fileInputRef.current?.click()}
      data-ocid="auth.iris_upload_button"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
      <Upload
        className={`w-5 h-5 mx-auto mb-1 ${irisFile ? "text-primary" : "text-muted-foreground"}`}
      />
      <p
        className={`text-xs font-mono ${irisFile ? "text-primary" : "text-muted-foreground"}`}
      >
        {irisFile ? irisFile.name : "Upload iris scan image"}
      </p>
      {irisFile && (
        <p className="text-xs text-muted-foreground mt-1 font-mono">
          Template: {getIrisTemplate(irisFile).substring(0, 30)}...
        </p>
      )}
    </button>
  );
}

interface FormState {
  username: string;
  password: string;
  irisFile: File | null;
}

const INITIAL_FORM: FormState = { username: "", password: "", irisFile: null };

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const { actor } = useActor();
  const [tab, setTab] = useState<"register" | "login">("register");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentStep =
    form.username && form.password ? (form.irisFile ? 3 : 2) : 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, irisFile: file }));
    setError(null);
  };

  const handleTabChange = (value: string) => {
    setTab(value as "register" | "login");
    setForm(INITIAL_FORM);
    setError(null);
    setRegisterSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) {
      setError("Connecting to backend...");
      return;
    }
    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }
    if (!form.password) {
      setError("Password is required.");
      return;
    }
    if (!form.irisFile) {
      setError("Please upload an iris image.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [passwordHash, irisTemplate] = await Promise.all([
        sha256Hex(form.password),
        Promise.resolve(getIrisTemplate(form.irisFile)),
      ]);

      if (tab === "register") {
        const result = await actor.register(
          form.username.trim(),
          passwordHash,
          irisTemplate,
        );
        if (result === AuthResult.success) {
          setRegisterSuccess(true);
          toast.success("Registration successful! You can now log in.");
          setTimeout(() => {
            setTab("login");
            setForm(INITIAL_FORM);
            setRegisterSuccess(false);
          }, 1800);
        } else {
          setError(AUTH_ERROR_MESSAGES[result] ?? "Registration failed.");
        }
      } else {
        const { result, token } = await actor.login(
          form.username.trim(),
          passwordHash,
          irisTemplate,
        );
        if (result === AuthResult.success && token !== undefined) {
          toast.success("Biometric authentication verified.");
          onLoginSuccess(token, form.username.trim());
        } else {
          setError(AUTH_ERROR_MESSAGES[result] ?? "Login failed.");
        }
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg hex-overlay flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center fade-in-up">
        <div className="flex items-center justify-center gap-3 mb-3">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-display font-bold tracking-tight glow-text text-primary">
            IRISGUARD
          </h1>
          <ShieldCheck className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Biometric Cloud Security v2.1 &nbsp;|&nbsp; Iris Authentication System
        </p>
      </header>

      <div
        className="w-full max-w-md border border-border bg-card/80 backdrop-blur-md rounded-lg overflow-hidden"
        style={{
          boxShadow:
            "0 0 40px oklch(0.72 0.16 185 / 0.12), 0 2px 40px rgba(0,0,0,0.6)",
        }}
      >
        <div className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

        <div className="p-6">
          <Tabs value={tab} onValueChange={handleTabChange}>
            <TabsList className="w-full mb-6 bg-muted/40 border border-border">
              <TabsTrigger
                value="register"
                className="flex-1 font-mono text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-ocid="auth.tab"
              >
                Register
              </TabsTrigger>
              <TabsTrigger
                value="login"
                className="flex-1 font-mono text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-ocid="auth.tab"
              >
                Login
              </TabsTrigger>
            </TabsList>

            <IrisScanner
              hasFile={!!form.irisFile}
              isScanning={isLoading}
              isSuccess={registerSuccess}
            />

            <div className="mt-5">
              <StepIndicator currentStep={registerSuccess ? 3 : currentStep} />
            </div>

            <TabsContent value="register">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Username
                  </Label>
                  <Input
                    value={form.username}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, username: e.target.value }))
                    }
                    placeholder="Enter your username"
                    className="bg-input/60 border-border font-mono"
                    autoComplete="username"
                    data-ocid="auth.username_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Password
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Enter secure password"
                    className="bg-input/60 border-border font-mono"
                    autoComplete="new-password"
                    data-ocid="auth.password_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Iris Image
                  </Label>
                  <FileUploadZone
                    irisFile={form.irisFile}
                    onFileChange={handleFileChange}
                    fileInputRef={fileInputRef}
                  />
                </div>

                {error && (
                  <div
                    className="text-xs font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded p-3"
                    data-ocid="auth.error_state"
                  >
                    ⚠ {error}
                  </div>
                )}

                {registerSuccess && (
                  <div
                    className="text-xs font-mono text-success bg-success/10 border border-success/30 rounded p-3"
                    data-ocid="auth.success_state"
                  >
                    ✓ Registration successful. Redirecting to login...
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full font-mono uppercase tracking-widest text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-ocid="auth.submit_button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span data-ocid="auth.loading_state">
                        Scanning Iris...
                      </span>
                    </>
                  ) : (
                    "Register Identity"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Username
                  </Label>
                  <Input
                    value={form.username}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, username: e.target.value }))
                    }
                    placeholder="Enter your username"
                    className="bg-input/60 border-border font-mono"
                    autoComplete="username"
                    data-ocid="auth.username_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Password
                  </Label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, password: e.target.value }))
                    }
                    placeholder="Enter your password"
                    className="bg-input/60 border-border font-mono"
                    autoComplete="current-password"
                    data-ocid="auth.password_input"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Iris Image
                  </Label>
                  <FileUploadZone
                    irisFile={form.irisFile}
                    onFileChange={handleFileChange}
                    fileInputRef={fileInputRef}
                  />
                </div>

                {error && (
                  <div
                    className="text-xs font-mono text-destructive bg-destructive/10 border border-destructive/30 rounded p-3"
                    data-ocid="auth.error_state"
                  >
                    ⚠ {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full font-mono uppercase tracking-widest text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-ocid="auth.submit_button"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      <span data-ocid="auth.loading_state">
                        Verifying Biometrics...
                      </span>
                    </>
                  ) : (
                    "Authenticate"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>

        <div className="h-px bg-border" />
        <div className="px-6 py-3 flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">
            AES-256 · SHA-256 · Iris-CNN
          </span>
          <span className="text-xs font-mono text-primary/60">
            SECURE CHANNEL
          </span>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-muted-foreground font-mono">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
