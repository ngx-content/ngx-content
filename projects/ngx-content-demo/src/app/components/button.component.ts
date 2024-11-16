import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-button',
  standalone: true,
  template: `<button type="button"><ng-content /></button>`,
})
export class ButtonComponent {}
