import type { Cell, Transaction } from '@ton/core'
import { Address, Slice } from '@ton/core'
import { Blockchain } from '@ton/sandbox'
import type { FlatTransactionComparable } from '@ton/test-utils/dist/test/transaction'
import { compareTransaction, flattenTransaction } from '@ton/test-utils/dist/test/transaction'
import { beforeEach, expect } from 'vitest'

beforeEach(async (ctx) => {
  ctx.blockchain = await Blockchain.create()
})

expect.extend({
  toHaveTransaction(received, expected: FlatTransactionComparable) {
    const { isNot } = this
    if (Array.isArray(received)) {
      const ret = (received as Transaction[]).find(tx => compareTransaction(flattenTransaction(tx), expected))
      return {
        pass: !!ret,
        message: () => `Expected ${received} ${!isNot ? 'NOT ' : ' '}to match pattern ${JSON.stringify(expected)}${isNot ? ', but it does' : ''}`,
      }
    }
    const flat = flattenTransaction(received)
    return {
      pass: compareTransaction(received, expected),
      message: () => `Expected ${flat} ${isNot ? 'NOT' : ''} to match pattern ${JSON.stringify(expected)}${isNot ? ', but it does' : ''}`,
    }
  },
  toHaveCell(received, expected) {
    const { isNot } = this
    return {
      pass: expected.asCell().equals(received.asCell()),
      message: () => `Expected\n${received}\n${isNot ? 'Not' : ''} to equal\n${expected}\nbut it does`,
    }
  },
  toEqualAddress(received, expected) {
    if (received instanceof Address && expected instanceof Address) {
      const { isNot } = this
      return {
        pass: expected.equals(received),
        message: () => `Expected\n${expected}\n${isNot ? 'NOT' : ''} to equal\n${received}\nbut it does`,
      }
    }
    return {
      pass: false,
      message: () => `${received} or ${expected} is not a Address object`,
    }
  },
  toEqualSlice(received, expected) {
    if (received instanceof Slice && expected instanceof Slice) {
      const { isNot } = this
      return {
        pass: expected.asCell().equals(received.asCell()),
        message: () => `Expected\n${expected}\n${isNot ? 'NOT' : ''} to equal\n${received}\nbut it does`,
      }
    }
    return {
      pass: false,
      message: () => `${received} or ${expected} is not a Slice object`,
    }
  },
})

interface CustomMatchers<R = unknown> {
  toHaveTransaction: (expected: FlatTransactionComparable) => R
  toEqualCell: (expected: Cell) => R
  toEqualAddress: (expected: Address) => R
  toEqualSlice: (expected: Slice) => R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> { }
  interface AsymmetricMatchersContaining extends CustomMatchers { }
  export interface TestContext {
    blockchain: Blockchain
  }
}
