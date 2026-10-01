/**
 * @file client/js/shared/icons.js
 * @description Icon renderer and Lucide CDN initializer.
 */

export class Icons {
  static init() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  static refresh() {
    setTimeout(() => this.init(), 10);
  }
}

export default Icons;
