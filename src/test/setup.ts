import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'
import { cleanup } from '@testing-library/preact'
import { afterEach } from 'vitest'

// Unmount Preact trees between tests to avoid cross-test DOM leakage.
afterEach(() => {
  cleanup()
})
