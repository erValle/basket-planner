import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule, ButtonModule, SelectModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  teams = ['Club Ficticio – Senior Masculino', 'Club Ficticio – Juvenil'];
  selectedTeam = this.teams[0];
}
