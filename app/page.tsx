"use client";
import { useEffect, useState } from "react";
import { Sender } from "./components/sender";
import { Receiver } from "./components/reciever";
import { SocketProvider } from "./utils/socket-context";
import { translation } from "./utils/translation";
export default function Home() {
  const [isSender, setIsSender] = useState<boolean>(true);
  const [offerId, setOfferId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const offerId = params.get("offerId");

    if (offerId !== null) {
      setIsSender(false);
      setOfferId(offerId);
    }
    setIsLoading(false);
  }, []);
  
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <header className="header">
         {translation("rabbitshare")}
      </header>
      <main>
        {isSender ? <Sender /> : <Receiver sharedId={offerId} />}
      </main>
    </SocketProvider>
  );
}
