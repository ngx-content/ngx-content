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

type NgxContentPlacement = 'before' | 'after' | 'append' | 'prepend' | 'replace';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ngx-content',
  standalone: true,
  template: '<ng-content />',
})
export class NgxContentComponent implements AfterViewInit, OnDestroy {
  contentUpdated = output();
  debounce = input(10);
  placement = input<NgxContentPlacement>('before');
  selector = input.required<string>();

  #debounceTimeout?: ReturnType<typeof setTimeout>;
  #document = inject(DOCUMENT);
  #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  #mutationObserver?: MutationObserver;
  #platformId = inject(PLATFORM_ID);
  #renderer = inject(Renderer2);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }

    this.#inject();

    this.#mutationObserver = new MutationObserver(() =>
      this.#debounce(() => this.#inject(), this.debounce()),
    );

    this.#mutationObserver.observe(this.#elementRef.nativeElement, {
      childList: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    this.#mutationObserver?.disconnect();
    clearTimeout(this.#debounceTimeout);
  }

  #debounce(callback: () => void, ms: number): void {
    clearTimeout(this.#debounceTimeout);
    this.#debounceTimeout = setTimeout(callback, ms);
  }

  #inject(): void {
    requestAnimationFrame(() => {
      const refChild = this.#findRefChild();
      const parent = refChild.parentNode;
      if (!parent) {
        throw new Error(
          `NgxContentComponent: The element matched by "${this.selector()}" does not have a parent node.`,
        );
      }

      const fragment = this.#getNewChilds().reduce(
        (a, b) => (a.appendChild(b), a),
        this.#document.createDocumentFragment(),
      );

      this.#injectDom(parent, fragment, refChild);
    });
  }

  #injectDom(parent: ParentNode, newChild: Node, refChild: Element) {
    switch (this.placement()) {
      case 'before': {
        this.#renderer.insertBefore(parent, newChild, refChild, false);
        break;
      }
      case 'after': {
        this.#renderer.appendChild(parent, newChild);
        break;
      }
      case 'append': {
        this.#renderer.appendChild(refChild, newChild);
        break;
      }
      case 'prepend': {
        this.#renderer.insertBefore(refChild, newChild, refChild.firstChild, false);
        break;
      }
      case 'replace': {
        parent.replaceChild(newChild, refChild);
        break;
      }
      default: {
        throw new Error(`NgxContentComponent: The placement "${this.placement()}" is not valid.`);
      }
    }

    this.contentUpdated.emit();
  }

  #findRefChild(): Element {
    try {
      const element = this.#document.querySelector(this.selector());
      if (!element) {
        throw new Error(
          `NgxContentComponent: The selector "${this.selector()}" did not match any elements.`,
        );
      }

      return element;
    } catch {
      throw new Error(`NgxContentComponent: The selector "${this.selector()}" is not valid.`);
    }
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
      this.#document.createComment('The ngx-content component content will be injected here'),
    ];
  }
}
