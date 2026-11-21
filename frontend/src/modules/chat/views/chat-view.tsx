
"use client";

import { Suspense } from "react";
import { ChatWorkspace } from "../components/chat-workspace";

export function ChatView() {
  return (
    <div className="relative flex size-full flex-col">
      <Suspense fallback={null}>
        <ChatWorkspace />
      </Suspense>
    </div>
  );
}
