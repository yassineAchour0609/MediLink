import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  constructor(private router: Router) {}
  redirect() {
    this.router.navigate(['/dashboard', 16]);
    console.log('Redirecting to dashboard with ID 16');
  }

}
