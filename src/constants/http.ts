export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const

export type HTTP_METHODS = keyof typeof HTTP_METHODS

export const STATUS_CODES = {
  SUCCESS: 200,
  UNAUTHORIZED: 401,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
}
