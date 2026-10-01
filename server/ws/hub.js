/**
 * @file server/ws/hub.js
 * @description WebSocket broadcast hub managing live session connections,
 * instant kill-switch revocation, and real-time audit event streams.
 */

import { WebSocketServer, WebSocket } from 'ws';
import url from 'url';
import { TokenService } from '../services/tokenService.js';

class WebSocketHub {
  constructor() {
    this.wss = null;
    // Map of client sockets: ws -> { role, userId, guestId, boundSessions: Set<string> }
    this.clients = new Map();
  }

  /**
   * Initializes WebSocket server attached to HTTP server
   */
  init(server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const parsedUrl = url.parse(request.url, true);
      if (parsedUrl.pathname === '/ws') {
        const token = parsedUrl.query.token;
        let authData = null;

        if (token) {
          // Verify against patient, doctor, or guest
          authData = TokenService.verifyPatientToken(token) ||
                     TokenService.verifyDoctorToken(token) ||
                     TokenService.verifyGuestToken(token);
        }

        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request, authData);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws, request, authData) => {
      const clientInfo = {
        role: authData?.role || 'anonymous',
        userId: authData?.sub || authData?.guest_id || null,
        guestId: authData?.guest_id || null,
        boundSessions: new Set()
      };

      this.clients.set(ws, clientInfo);

      // Heartbeat ping
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.action === 'SUBSCRIBE_SESSION' && msg.session_id) {
            clientInfo.boundSessions.add(msg.session_id);
            ws.send(JSON.stringify({ type: 'SUBSCRIBED', session_id: msg.session_id }));
          }
        } catch (err) {
          // ignore malformed ws messages
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.send(JSON.stringify({
        type: 'CONNECTED',
        userId: clientInfo.userId,
        role: clientInfo.role,
        timestamp: new Date().toISOString()
      }));
    });

    // Heartbeat timer to drop stale sockets
    setInterval(() => {
      for (const [ws] of this.clients) {
        if (ws.isAlive === false) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        ws.isAlive = false;
        ws.ping();
      }
    }, 30000);
  }

  /**
   * Broadcasts to all clients subscribed to a specific session
   */
  broadcastToSession(sessionId, event, payload = {}) {
    const message = JSON.stringify({ event, sessionId, payload, timestamp: new Date().toISOString() });
    for (const [ws, info] of this.clients) {
      if (ws.readyState === WebSocket.OPEN && info.boundSessions.has(sessionId)) {
        ws.send(message);
      }
    }
  }

  /**
   * Broadcasts to a specific patient
   */
  broadcastToPatient(patientId, event, payload = {}) {
    const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const [ws, info] of this.clients) {
      if (ws.readyState === WebSocket.OPEN && info.userId === patientId) {
        ws.send(message);
      }
    }
  }

  /**
   * Broadcasts to a specific doctor
   */
  broadcastToDoctor(doctorId, event, payload = {}) {
    const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const [ws, info] of this.clients) {
      if (ws.readyState === WebSocket.OPEN && info.userId === doctorId) {
        ws.send(message);
      }
    }
  }

  /**
   * Global broadcast
   */
  broadcastAll(event, payload = {}) {
    const message = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    for (const [ws] of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }
}

export const wsHub = new WebSocketHub();
export default wsHub;
