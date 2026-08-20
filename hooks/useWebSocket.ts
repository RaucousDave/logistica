import { useEffect, useRef, useCallback } from 'react';
import { WebSocketMessage } from '@/types/api';

const WS_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://logistica-es0n.onrender.com')
  .replace(/^http/, 'ws');

interface UseWebSocketOptions {
  channel: 'driver' | `delivery/${number}`;
  token?: string | null;
  onMessage?: (message: WebSocketMessage) => void;
  enabled?: boolean;
}

export function useWebSocket({ channel, token, onMessage, enabled = true }: UseWebSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (!enabled || !token) return;

    // Prevent multiple connections
    if (socketRef.current && (socketRef.current.readyState === WebSocket.CONNECTING || socketRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    const wsUrl = `${WS_BASE_URL}/ws/${channel}/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`[WebSocket Connected] Path: /ws/${channel}/`);
    };

    ws.onmessage = (event) => {
      try {
        const parsed: WebSocketMessage = JSON.parse(event.data);
        if (onMessage) {
          onMessage(parsed);
        }
      } catch (err) {
        console.error('[WebSocket Error Parsing Message]:', err, event.data);
      }
    };

    ws.onerror = (error) => {
      console.warn(`[WebSocket Error] /ws/${channel}/:`, error);
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket Closed] Code: ${event.code}, Reason: ${event.reason}`);
      socketRef.current = null;

      // Attempt reconnect after 3s if still enabled and authenticated
      if (enabled && token) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    };

    socketRef.current = ws;
  }, [channel, token, enabled, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const send = useCallback((message: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket Send Failed] Socket is not open.');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { send, disconnect, reconnect: connect };
}
