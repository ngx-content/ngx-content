import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  input,
  inject,
  ChangeDetectionStrategy,
  output,
  PLATFORM_ID,
} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-content',
  standalone: true,
  template: '<ng-content />',
})
export class NgxContentComponent implements AfterViewInit, OnDestroy {
  debounce = input(10);
  place = input<'before' | 'after' | 'start' | 'end' | 'self'>('before');
  placed = output();
  select = input.required<string>();

  #debounceTimeout?: ReturnType<typeof setTimeout>;
  #document = inject(DOCUMENT);
  #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  #mutationObserver: MutationObserver | undefined;
  #platformId = inject(PLATFORM_ID);
  #renderer = inject(Renderer2);

  ngAfterViewInit(): void {
    // Check if the current platform is a browser.
    // If the code is not running in a browser (e.g., on the server with Angular Universal),
    // return early to avoid executing browser-specific logic.
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    // Initialize a MutationObserver to watch for changes in the DOM subtree
    // of the component's host element. The observer will trigger the provided callback
    // when there are changes to the child nodes.
    this.#mutationObserver = new MutationObserver(() =>
      // Use a debounced callback to handle DOM mutations efficiently.
      // The debounce function delays the execution of the `#place()` method
      // to avoid performance issues when many changes occur in rapid succession.
      this.#debounce(() => this.#place(), this.debounce()),
    );

    // Start observing the component's host element for changes to its child nodes and subtree.
    // `childList: true` indicates that changes to the direct children of the element should be observed.
    // `subtree: true` means that changes within the entire subtree of the element should be observed.
    this.#mutationObserver.observe(this.#elementRef.nativeElement, {
      childList: true,
      subtree: true,
    });

    this.#place();
  }

  ngOnDestroy(): void {
    this.#mutationObserver?.disconnect();
    clearTimeout(this.#debounceTimeout);
  }

  #debounce(callback: () => void, ms: number): void {
    clearTimeout(this.#debounceTimeout);
    this.#debounceTimeout = setTimeout(callback, ms);
  }

  #getNewChilds(): Node[] {
    // Check if there is a <template> element and return its child nodes if available
    const template = this.#elementRef.nativeElement.querySelector('template');
    if (template?.content?.childNodes.length) {
      return Array.from(template.content.childNodes);
    }

    // Fallback: Return child nodes of the host element if available
    const nodes = Array.from(this.#elementRef.nativeElement.childNodes);
    if (nodes.length) {
      return nodes;
    }

    // If no nodes are found, return a comment node as a placeholder
    return [
      this.#renderer.createComment('The ngx-content component content will be inserted here'),
    ];
  }

  #getParent(element: Element): Node {
    const node = element.parentNode;
    if (!node) {
      throw new Error(
        'NgxContentComponent: The element matched by the selector does not have a parent node. Content cannot be inserted.',
      );
    }

    return node;
  }

  #getRefChild(): Element {
    try {
      const element = this.#document.querySelector(this.select());
      if (!element) {
        throw new Error(
          'NgxContentComponent: The provided selector did not match any elements in the document.',
        );
      }

      return element;
    } catch {
      throw new Error('NgxContentComponent: The provided selector is not a valid CSS selector.');
    }
  }

  #place(): void {
    // Use `requestAnimationFrame` to defer the execution of the DOM manipulation
    // until the next repaint. This helps improve performance and ensures smoother
    // updates by synchronizing the DOM changes with the browser's rendering cycle.
    requestAnimationFrame(() => {
      const refChild = this.#getRefChild();
      const parent = this.#getParent(refChild);
      const newChilds = this.#getNewChilds();

      // Create a DocumentFragment to efficiently group all new child nodes.
      // Using `reduce`, each new child node is appended to the DocumentFragment.
      // This approach minimizes reflows and repaints by batching the DOM updates.
      const fragment = newChilds.reduce(
        (a, b) => (a.appendChild(b), a),
        this.#document.createDocumentFragment(),
      );

      this.#placeDom(parent, fragment, refChild);
    });
  }

  #placeDom(parent: ParentNode, newChild: Node, refChild: Element): void {
    switch (this.place()) {
      case 'before': {
        this.#renderer.insertBefore(parent, newChild, refChild, false);
        break;
      }
      case 'after': {
        this.#renderer.appendChild(parent, newChild);
        break;
      }
      case 'start': {
        this.#renderer.insertBefore(refChild, newChild, refChild.firstChild, false);
        break;
      }
      case 'end': {
        this.#renderer.appendChild(refChild, newChild);
        break;
      }
      case 'self': {
        parent.replaceChild(newChild, refChild);
        break;
      }
      default: {
        throw new Error('NgxContentComponent: The specified insert mode is not valid.');
      }
    }

    this.placed.emit();
  }
}
