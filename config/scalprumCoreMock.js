function createSharedStore({ initialState, onEventChange }) {
  let state = initialState;
  const listeners = new Set();
  const notify = () => {
    listeners.forEach((callback) => callback());
  };
  return {
    getState: () => state,
    updateState: (event, payload) => {
      state = onEventChange(state, event, payload);
      notify();
    },
    subscribe: (_event, callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    subscribeAll: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
  };
}

module.exports = { createSharedStore };
