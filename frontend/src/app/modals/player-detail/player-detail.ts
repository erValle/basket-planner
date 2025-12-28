import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

type PlayerStatus = 'active' | 'revision';

export interface PlayerDetailModel {
  id: string;
  name: string;
  team: string;
  category: string;
  position: string;
  status: PlayerStatus;
  firstName: string;
  lastName: string;
  birthDate: string;
  dni: string;
  height: number;
  weight: number;
  dominantHand: string;
  club: string;
  currentTeam: string;
  weeklyLoad: string;
  lastFeedback: string;
  notes: string;
}

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, InputTextModule, TextareaModule, ButtonModule, TagModule],
  templateUrl: './player-detail.html',
  styleUrl: './player-detail.css',
})
export class PlayerDetail {
  @Input({ required: true }) player!: PlayerDetailModel;

  @Output() cancel = new EventEmitter<void>();
  @Output() save = new EventEmitter<PlayerDetailModel>();

  onCancel() {
    this.cancel.emit();
  }

  onSave() {
    this.save.emit(this.player);
  }
}
