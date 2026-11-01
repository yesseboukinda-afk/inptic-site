"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

const ChatBot = dynamic(() => import("@/components/ChatBot"), {
  ssr: false,
});

export default function ChatBotLoader() {
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  const [openOnLoad, setOpenOnLoad] = useState(false);

  useEffect(() => {
    const openChat = () => {
      setOpenOnLoad(true);
      setIsLoaded(true);
    };

    window.addEventListener("open-inptic-chat", openChat);
    return () => window.removeEventListener("open-inptic-chat", openChat);
  }, []);

  if (isLoaded) {
    return <ChatBot initiallyOpen={openOnLoad} />;
  }

  return (
    <button
      type="button"
      onClick={() => {
        setOpenOnLoad(true);
        setIsLoaded(true);
      }}
      className="fixed bottom-4 right-4 z-50 transform rounded-full bg-blue-600 p-3 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-700 active:scale-95 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 sm:bottom-6 sm:right-6 sm:p-4"
      aria-label={t("chat.open")}
      title={t("chat.open")}
    >
      <Bot size={22} aria-hidden="true" />
    </button>
  );
}
