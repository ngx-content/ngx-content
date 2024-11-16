import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-button',
  standalone: true,
  styles: ['button { color: red; }'],
  template: `<button type="button"><ng-content /></button>`,
})
export class ButtonComponent {}
