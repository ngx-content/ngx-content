import { Component } from '@angular/core';
import { NgxContentComponent } from '../../../ngx-content/src/public-api';
import { ButtonComponent } from './components/button.component';

@Component({
  imports: [ButtonComponent, NgxContentComponent],
  selector: 'app-root',
  standalone: true,
  template: `
    <h1>H1</h1>
    <div id="c">Content</div>

    <ngx-content select="h1" place="self">
      <h2>H2</h2>
    </ngx-content>

    <ngx-content select="head" place="end">
      <template>
        <meta name="description" content="ngx-content demo" />
      </template>
    </ngx-content>

    <ngx-content select="link[rel='icon']" place="self">
      <template>
        <link rel="icon" type="image/x-icon" href="favicon2.ico" />
      </template>
    </ngx-content>

    <ngx-content select="#c" place="self">
      <app-button>click</app-button>
    </ngx-content>
  `,
})
export class AppComponent {}
