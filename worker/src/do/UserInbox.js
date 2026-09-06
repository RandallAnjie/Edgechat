import { isVerifiedInternalRequest, parseVerifiedUserId } from '../verified-identity.js';
import { durableObjectHealth } from '../maintenance/do-health.ts';

export class UserInbox {
  constructor(state) {
    this.state = state;
    // Ordinary DO WebSocket only. RandallFlare has no hibernation API
    // (acceptWebSocket / getWebSockets / serializeAttachment).
    this.connections = new Set();
  }

  attachSocket(server) {
    server.accept();
    this.connections.add(server);
    server.addEventListener('close', () => {
      this.connections.delete(server);
    });
    server.addEventListener('error', () => {
      this.connections.delete(server);
    });
  }

  broadcast(packet) {
    for (const socket of this.connections) {
      try {
        socket.send(packet);
      } catch {
        this.connections.delete(socket);
      }
    }
  }

  async fetch(request) {
    const health = durableObjectHealth(request, 'UserInbox');
    if (health) return health;
    const url = new URL(request.url);

    if (url.pathname === '/connect') {
      const userId = parseVerifiedUserId(request);
      if (!userId) {
        return new Response('Unauthorized', { status: 401 });
      }

      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected websocket', { status: 426 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.attachSocket(server);
      server.send(JSON.stringify({ protocolVersion: 1, type: 'ready' }));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === '/notify' && request.method === 'POST') {
      if (!isVerifiedInternalRequest(request)) {
        return new Response('Unauthorized', { status: 401 });
      }

      const payload = await request.json();
      this.broadcast(JSON.stringify(payload));
      return Response.json({ ok: true });
    }

    return new Response('Not Found', { status: 404 });
  }
}
