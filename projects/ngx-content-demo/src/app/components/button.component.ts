import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-button',
  standalone: true,
  styles: ['button { color: red; }'],
  template: `<button type="button" (click)="click()"><ng-content /> {{ count() }}</button>`,
})
export class ButtonComponent {
  count = signal(0);

  click(): void {
    this.count.set(this.count() + 1);
  }
}
