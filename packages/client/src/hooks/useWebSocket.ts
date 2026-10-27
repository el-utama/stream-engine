import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store';

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { setStreamStatus, updateStream, setUser, setAccounts } = useAppStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    socket.on('stream:status', (data: any) => {
      if (data?.streamId) {
        useAppStore.getState().setStreamStatus(data.streamId, data);
      }
    });

    socket.on('stream:error', (data: any) => {
      console.error('Stream error:', data);
    });

    socket.on('relay:status', (data: any) => {
      console.log('Relay status:', data);
    });

    socket.on('auth:accounts', (accounts: any[]) => {
      useAppStore.getState().setAccounts(accounts);
    });

    socket.on('user:updated', (user: any) => {
      useAppStore.getState().setUser(user);
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const joinStream = useCallback((streamId: string) => {
    socketRef.current?.emit('join:stream', streamId);
  }, []);

  const leaveStream = useCallback((streamId: string) => {
    socketRef.current?.emit('leave:stream', streamId);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { socket: socketRef.current, connect, disconnect, joinStream, leaveStream };
}

export function useStreamStatus(streamId: string | null) {
  const { joinStream, leaveStream } = useWebSocket();
  const stream = useAppStore((state) => streamId ? state.streams.find(s => s.id === streamId) : null);

  useEffect(() => {
    if (streamId) {
      joinStream(streamId);
    }
    return () => {
      if (streamId) {
        leaveStream(streamId);
      }
    };
  }, [streamId, joinStream, leaveStream]);

  return stream;
}
