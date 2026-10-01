/**
 * @file client/js/shared/router.js
 * @description Hash-based client-side router for bottom navigation tabs.
 */

export class Router {
  static routes = new Map();
  static currentRoute = '';

  static register(hash, handler) {
    this.routes.set(hash.replace(/^#/, ''), handler);
  }

  static init(defaultRoute = 'home') {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#/, '') || defaultRoute;
      this.currentRoute = hash;
      const handler = this.routes.get(hash) || this.routes.get(defaultRoute);
      if (handler) {
        handler();
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
  }

  static navigate(hash) {
    window.location.hash = hash.startsWith('#') ? hash : `#${hash}`;
  }
}

export default Router;
