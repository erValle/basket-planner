import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ClubContextService } from '../../core/context/club-context.service';

/**
 * Shell is a minimal router wrapper.
 * All UI (sidebar, navigation, logout) is handled by AppShell inside each page.
 */
@Component({
  selector: 'bp-shell',
  imports: [RouterOutlet],
  templateUrl: './shell.html',
  styleUrls: ['./shell.css'],
})
export class Shell {
  private readonly clubContext = inject(ClubContextService);

  constructor() {
    // Initialize club context on app load
    this.clubContext.refresh();
  }
}
