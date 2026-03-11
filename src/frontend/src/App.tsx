import { Toaster } from "@/components/ui/sonner";
import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import { useState } from "react";

export default function App() {
  const [authToken, setAuthToken] = useState<bigint | null>(null);
  const [authedUsername, setAuthedUsername] = useState<string>("");

  const handleLoginSuccess = (token: bigint, username: string) => {
    setAuthToken(token);
    setAuthedUsername(username);
  };

  const handleLogout = () => {
    setAuthToken(null);
    setAuthedUsername("");
  };

  return (
    <>
      {authToken === null ? (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      ) : (
        <DashboardPage
          token={authToken}
          username={authedUsername}
          onLogout={handleLogout}
        />
      )}
      <Toaster position="top-right" />
    </>
  );
}
