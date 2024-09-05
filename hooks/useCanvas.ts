"use client";

import { useState, useEffect } from "react";
import { CanvasClient } from "@dscvr-one/canvas-client-sdk";

interface User {
  id: string;
  username: string;
  avatar?: string;
}

export function useCanvas() {
  const [canvasClient, setCanvasClient] = useState<CanvasClient | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initCanvas = async () => {
      try {
        if (window.self !== window.top) {
          const client = new CanvasClient();
          const response = await client.ready();
          if (response) {
            setCanvasClient(client);
            setUser(response.untrusted.user || null);
          }
        } else {
          console.log("Not in a Canvas environment");
        }
      } catch (error) {
        console.error("Error initializing Canvas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initCanvas();
  }, []);

  return { canvasClient, user, isLoading };
}
