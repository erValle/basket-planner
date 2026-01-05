import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';

import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-player-no-plannings',
  imports: [RouterLink, ButtonModule, AppShell],
  templateUrl: './player-no-plannings.html',
  styleUrl: './player-no-plannings.css',
})
export class PlayerNoPlanningsPage {
  // Intentionally simple: this is a “state page” for players with no assigned plannings.
}
