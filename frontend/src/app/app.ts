import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from './service/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  private readonly authService:Auth = new Auth();
  data = signal<any>(null);

  ngOnInit() {
    // Replace with your actual Django URL
    this.authService.checkApi().subscribe((response:any) => {
        this.data.set(response);
      });
  }

}
