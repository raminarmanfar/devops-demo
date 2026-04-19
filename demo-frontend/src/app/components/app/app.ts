import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  private apiService = inject(ApiService);

  title = 'DevOps Demo Frontend';
  message = signal('Loading from backend...');

  ngOnInit(): void {
    this.apiService.getHello().subscribe({
      next: (res) => this.message.set(res.message),
      error: () => this.message.set('Backend connection failed')
    });
  }
}
