import { HTTP_METHODS, STATUS_CODES } from '@/constants/http'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { handlers } from './server-handlers'

const server = setupServer(...handlers)

type optionsType = {
  method: HTTP_METHODS
  url: string
  statusCode?: number
  response?: Record<string, unknown>
  error?: Record<string, unknown>
}

/**
 * custom api response for testing
 * @param options {optionsType}
 */
const customApiResponse = (options: optionsType) => {
  const getMethod = () => {
    switch (options.method) {
      case HTTP_METHODS.POST:
        return http.post
      case HTTP_METHODS.PUT:
        return http.put
      case HTTP_METHODS.DELETE:
        return http.delete
      case HTTP_METHODS.PATCH:
        return http.patch
      case HTTP_METHODS.GET:
      default:
        return http.get
    }
  }

  server.use(
    getMethod()(
      options.url,
      () => {
        if (options.error) {
          return HttpResponse.json(options.error, { status: options.statusCode || STATUS_CODES.SUCCESS })
        }

        if (options.statusCode) {
          return HttpResponse.json(options.response, { status: options.statusCode })
        }

        return HttpResponse.json(options.response, { status: STATUS_CODES.SUCCESS })
      },
      {
        once: true,
      }
    )
  )
}

export { customApiResponse, http, server }
