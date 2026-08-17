import { Router, type Request, type RequestHandler } from 'express';
import type { CreateRoomRequest, JoinRoomRequest, OutgoingSignal } from '../../signaling/index.js';
import { RoomApiError, RoomService } from './service.js';

export function buildRoomRouter(service: RoomService) {
  const router = Router();
  router.use(Router().use((request, response, next) => {
    if (!request.is('application/json') && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      response.status(415).json({ error: { code: 'json-required', message: 'Requests must use application/json.' } });
      return;
    }
    next();
  }));

  router.post('/', route(async (request, response) => {
    response.status(201).json(await service.createRoom((request.body ?? {}) as CreateRoomRequest));
  }));
  router.post('/:roomId/join', route(async (request, response) => {
    response.status(201).json(await service.joinRoom(roomId(request), (request.body ?? {}) as JoinRoomRequest));
  }));
  router.post('/:roomId/heartbeat', route(async (request, response) => {
    const identity = requireIdentity(request);
    await service.heartbeat(roomId(request), identity.participantId, identity.token);
    response.status(204).end();
  }));
  router.delete('/:roomId', route(async (request, response) => {
    const identity = requireIdentity(request);
    await service.closeRoom(roomId(request), identity.participantId, identity.token);
    response.status(204).end();
  }));
  router.delete('/:roomId/participants/me', route(async (request, response) => {
    const identity = requireIdentity(request);
    await service.leaveRoom(roomId(request), identity.participantId, identity.token);
    response.status(204).end();
  }));
  router.post('/:roomId/signals', route(async (request, response) => {
    const identity = requireIdentity(request);
    await service.sendSignal(roomId(request), identity.participantId, identity.token, (request.body ?? {}) as OutgoingSignal);
    response.status(202).end();
  }));
  router.get('/:roomId/signals', route(async (request, response) => {
    const identity = requireIdentity(request);
    const after = Math.max(0, Number.parseInt(String(request.query.after ?? '0'), 10) || 0);
    response.set('Cache-Control', 'private, no-store');
    response.json(await service.readSignals(roomId(request), identity.participantId, identity.token, after));
  }));
  return router;
}

function requireIdentity(request: Request) {
  const participantId = request.header('x-participant-id') ?? '';
  const authorization = request.header('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!participantId || !token) throw new RoomApiError('unauthorized', 401, 'Room credentials are required.');
  return { participantId, token };
}

function roomId(request: Request) {
  const value = request.params.roomId;
  return Array.isArray(value) ? value[0] ?? '' : value;
}

function route(handler: RequestHandler): RequestHandler {
  return async (request, response, next) => {
    try {
      await handler(request, response, next);
    } catch (error) {
      if (error instanceof RoomApiError) {
        response.status(error.status).json({ error: { code: error.code, message: error.message } });
        return;
      }
      console.error(error);
      response.status(500).json({ error: { code: 'internal-error', message: 'The room service failed.' } });
    }
  };
}
