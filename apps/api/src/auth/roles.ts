import type { FastifyRequest } from 'fastify';
import type { Config } from '../config';
import { ApiError } from '../errors';
import { requireAuth, type AuthContext } from './session';

type Role = 'student' | 'editor' | 'admin';

/**
 * Staff-only routes: the caller must hold one of the roles AND have signed in recently (a stale session cannot
 * change reference data). Students get 403, anonymous callers 401.
 */
export function requireRole(req: FastifyRequest, config: Config, roles: Role[]): AuthContext {
  const auth = requireAuth(req);
  if (!roles.includes(auth.user.role as Role)) throw new ApiError(403, 'forbidden', 'This action needs a staff account.');
  const ageMin = (Date.now() - auth.signedInAt.getTime()) / 60_000;
  if (ageMin > config.ADMIN_REAUTH_MINUTES) throw new ApiError(401, 'reauth_required', 'Please sign in again to continue.');
  return auth;
}
