import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'els-admin-coming-soon',
  template:
    '<section class="els-container"><h1>Module planned</h1><p>This Admin module will be enabled in its dedicated vertical phase.</p></section>',
  styles: ['section{padding-block:3rem}'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComingSoon {}
