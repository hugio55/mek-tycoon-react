// WeakRef polyfill for older browsers (iOS < 14.5)
// This provides a basic implementation of WeakRef for compatibility
if (typeof WeakRef === 'undefined') {
  global.WeakRef = class WeakRef {
    constructor(target) {
      this._target = target;
    }

    deref() {
      return this._target;
    }
  };

  console.log('[POLYFILL] WeakRef polyfill loaded for legacy browser support');
}

// FinalizationRegistry polyfill (often used alongside WeakRef)
if (typeof FinalizationRegistry === 'undefined') {
  global.FinalizationRegistry = class FinalizationRegistry {
    constructor(callback) {
      this._callback = callback;
    }

    register(target, heldValue, unregisterToken) {
      // Basic no-op implementation
      // Real implementation would track object lifecycle
    }

    unregister(unregisterToken) {
      // No-op
    }
  };

  console.log('[POLYFILL] FinalizationRegistry polyfill loaded for legacy browser support');
}
