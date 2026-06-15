export function querySelector<K extends keyof HTMLElementTagNameMap>(
  selector: K,
  parent?: Element
): HTMLElementTagNameMap[K] | null {
  return (parent || document).querySelector(selector);
}

export function querySelectorAll<K extends keyof HTMLElementTagNameMap>(
  selector: K,
  parent?: Element
): HTMLElementTagNameMap[K][] {
  return Array.from((parent || document).querySelectorAll(selector));
}

export function getAttribute(el: Element, name: string): string | null {
  return el.getAttribute(name);
}

export function getStyle(el: Element, prop: string): string {
  return getComputedStyle(el).getPropertyValue(prop).trim();
}

export function setStyle(el: Element, prop: string, value: string): void {
  (el as HTMLElement).style.setProperty(prop, value);
}

export function addClass(el: Element, ...classNames: string[]): void {
  el.classList.add(...classNames);
}

export function removeClass(el: Element, ...classNames: string[]): void {
  el.classList.remove(...classNames);
}

export function toggleClass(el: Element, className: string): void {
  el.classList.toggle(className);
}

export function createEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      el.setAttribute(key, value);
    }
  }
  if (children) {
    for (const child of children) {
      if (typeof child === "string") {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
  }
  return el;
}

export function waitForElement(
  selector: string,
  timeout = 5000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const el = document.querySelector(selector);
    if (el) {
      resolve(el);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}
