declare module 'pdf-parse' {
  interface PDFOptions {
    maxBufferSize?: number;
    [key: string]: any;
  }

  interface PDFResult {
    text: string;
    version: string;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      Producer?: string;
      Creator?: string;
      CreationDate?: string;
      ModDate?: string;
    };
    numpages: number;
    numrender: number;
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: PDFOptions
  ): Promise<PDFResult>;

  export = pdfParse;
}

declare module 'ws' {
  import { EventEmitter } from 'events';

  interface WebSocket extends EventEmitter {
    CONNECTING: number;
    OPEN: number;
    CLOSING: number;
    CLOSED: number;
    readyState: number;
    protocol: string;
    upgradeReq: any;
    close(code?: number, reason?: string, abort?: boolean): void;
    terminate(): void;
    ping(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    pong(data?: any, mask?: boolean, cb?: (err: Error) => void): void;
    send(data: any, cb?: (err: Error) => void): void;
    terminate(): void;
  }

  interface WebSocketServer extends EventEmitter {
    options: any;
    close(cb?: () => void): void;
  }

  interface WebSocketServerOptions {
    host?: string;
    port?: number;
    path?: string;
    server?: any;
    verifyClient?: any;
    handleProtocols?: any;
    perMessageDeflate?: boolean;
    maxPayload?: number;
    clientTracking?: boolean;
  }

  function WebSocket(
    address: string | URL,
    protocols?: string | string[],
    options?: any
  ): WebSocket;

  namespace WebSocket {
    const CONNECTING: number;
    const OPEN: number;
    const CLOSING: number;
    const CLOSED: number;
    function createServer(
      options?: WebSocketServerOptions,
      callback?: () => void
    ): WebSocketServer;
  }

  export { WebSocket, WebSocketServer, WebSocketServerOptions };
  export default WebSocket;
}

declare module 'ws/default' {
  const WebSocket: any;
  export default WebSocket;
}

declare module '@types/ws' {
  export * from 'ws';
}