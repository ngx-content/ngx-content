import { Component } from '@angular/core';
import {
  NgxContentComponent,
  NgxContentEncNoneComponent,
} from '../../../ngx-content/src/public-api';

@Component({
  imports: [NgxContentComponent, NgxContentEncNoneComponent],
  selector: 'app-root',
  standalone: true,
  styleUrl: './app.component.css',
  templateUrl: './app.component.html',
})
export class AppComponent {}
