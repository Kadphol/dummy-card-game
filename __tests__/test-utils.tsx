import { RenderOptions, render as rtlRender } from '@testing-library/react'
import { AppRouterContext, AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { ReactElement } from 'react'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  withNextRouter?: boolean
  router?: AppRouterInstance
}

export const createMockRouter = (router: Partial<AppRouterInstance>): AppRouterInstance => {
  return {
    back: jest.fn(),
    prefetch: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    ...router,
  }
}

/**
 * --------------------------------------------------
 *  Override the default test render with our own
 *
 *  You can override the router mock like this:
 *
 *  const router = createMockRouter({ push: jest.fn() })
 *
 *  const { getByRole } = render(<AccountMenu />, {
 *    withNextRouter: true,
 *    router,
 *  })
 * --------------------------------------------------
 */
export const render = (
  ui: ReactElement,
  { withNextRouter = false, router = createMockRouter({}), ...renderOptions }: ExtendedRenderOptions = {}
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let components = children

    if (withNextRouter) {
      components = <AppRouterContext.Provider value={router}>{components}</AppRouterContext.Provider>
    }

    return components
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions })
}

/**
 * Wait for api data
 * @param {number} time - time to wait for api data
 */
export const waitForApiData = async (time = 100) => {
  await new Promise((resolve) => setTimeout(resolve, time))
}

export * from '@testing-library/react'
