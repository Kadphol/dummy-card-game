import { STATUS_CODES } from '@constants/http'
import { http, HttpResponse } from 'msw'

const handlers = [
  http.get('/example', () => {
    return HttpResponse.json({ status: STATUS_CODES.SUCCESS })
  }),
]

export default handlers
