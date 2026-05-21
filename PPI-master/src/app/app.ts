import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './nucleo/servicios/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css']    
})
export class App {
  protected readonly title = signal('SCIC');
  private readonly authService = inject(AuthService);
}
