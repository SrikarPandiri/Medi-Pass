/**
 * @file client/js/shared/state.js
 * @description Centralized reactive client state management.
 */

export class AppState {
  static data = {
    user: null,
    doctor: null,
    isGuest: false,
    guestId: null,
    isElderlyMode: false,
    activeTab: 'home',
    records: [],
    recentPatients: [],
    activeSession: null
  };

  static listeners = new Set();

  static get() {
    return this.data;
  }

  static set(updates) {
    this.data = { ...this.data, ...updates };
    this.notify();
  }

  static subscribe(fn) {
    this.listeners.add(fn);
    fn(this.data);
    return () => this.listeners.delete(fn);
  }

  static notify() {
    for (const fn of this.listeners) {
      fn(this.data);
    }
  }
}

export default AppState;
