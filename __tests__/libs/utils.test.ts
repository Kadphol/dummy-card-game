import { cn } from '@/libs/utils'

describe('utils', () => {
  describe('cn', () => {
    it('should return a string', () => {
      expect(cn('class1', 'class2')).toEqual('class1 class2')
    })
  })
})
