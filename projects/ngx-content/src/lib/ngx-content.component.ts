import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  Renderer2,
  AfterViewInit,
  input,
  inject,
  ChangeDetectionStrategy,
  output,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  //encapsulation: ViewEncapsulation.None,
  selector: 'ngx-content',
  standalone: true,
  template: '<ng-content />',
})
export class NgxContentComponent implements AfterViewInit {
  place = input<'before' | 'after' | 'start' | 'end' | 'self'>('before');
  placed = output();
  select = input.required<string>();

  #document = inject(DOCUMENT);
  #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  #platformId = inject(PLATFORM_ID);
  #renderer = inject(Renderer2);

  ngAfterViewInit(): void {
    // Check if the current platform is a browser.
    // If the code is not running in a browser (e.g., on the server with Angular Universal),
    // return early to avoid executing browser-specific logic.
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

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

      this.#place(parent, fragment, refChild);
    });
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

  #getParent(element: Element): ParentNode {
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

  #place(parent: ParentNode, newChild: Node, refChild: Element): void {
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
        this.#renderer.removeChild(parent, refChild);
        this.#renderer.appendChild(parent, newChild);
        break;
      }
      default: {
        throw new Error('NgxContentComponent: The specified insert mode is not valid.');
      }
    }

    // Remove the host element from the DOM
    const hostElement = this.#elementRef.nativeElement;
    if (hostElement.parentNode) {
      this.#renderer.removeChild(hostElement.parentNode, hostElement);
    }

    this.placed.emit();
  }
}
