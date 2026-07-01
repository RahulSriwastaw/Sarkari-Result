// Sandboxed environment fetch getter bypass patch
// This patch must be imported first to execute before other dependencies (like formdata-polyfill or @google/genai) load and attempt to modify global fetch.
(function() {
  const patchObj = (obj: any) => {
    if (!obj) return false;
    try {
      const originalFetch = obj.fetch;
      if (typeof originalFetch !== 'function') return false;

      let currentFetch = originalFetch;

      // Define both a getter and a setter to allow transparent retrieval and overriding
      Object.defineProperty(obj, 'fetch', {
        get() {
          return currentFetch;
        },
        set(val) {
          currentFetch = val;
        },
        configurable: true,
        enumerable: true
      });
      return true;
    } catch (e) {
      console.warn('Failed to define getter/setter for fetch on:', obj, e);
      return false;
    }
  };

  // Try patching on globalThis, window, self, and Window.prototype
  let patched = false;
  if (typeof globalThis !== 'undefined') patched = patchObj(globalThis) || patched;
  if (typeof window !== 'undefined') patched = patchObj(window) || patched;
  if (typeof self !== 'undefined') patched = patchObj(self) || patched;

  // If instance patching was not fully successful or threw, let's also try Window.prototype as fallback
  if (typeof window !== 'undefined' && typeof Window !== 'undefined' && Window.prototype) {
    try {
      const proto = Window.prototype;
      const desc = Object.getOwnPropertyDescriptor(proto, 'fetch');
      if (desc && (desc.configurable || typeof desc.set === 'undefined')) {
        let protoFetch = proto.fetch;
        Object.defineProperty(proto, 'fetch', {
          get() {
            return protoFetch;
          },
          set(val) {
            protoFetch = val;
          },
          configurable: true,
          enumerable: true
        });
        patched = true;
      }
    } catch (protoErr) {
      console.warn('Failed to patch Window.prototype.fetch:', protoErr);
    }
  }

  if (patched) {
    console.log('Successfully installed fetch getter/setter bypass patch');
  }
})();
