export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown,
    /** extra response headers, e.g. Retry-After */
    public headers?: Record<string, string>,
  ) {
    super(message);
  }
}
export const notFound = (what = 'Resource') => new ApiError(404, 'not_found', `${what} not found`);
export const badRequest = (message: string, details?: unknown) => new ApiError(400, 'bad_request', message, details);
