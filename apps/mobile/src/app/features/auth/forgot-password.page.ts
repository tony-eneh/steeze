import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    IonicModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule
  ],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.scss'
})
export class ForgotPasswordPage {
  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService
  ) {}

  submit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestPasswordReset(this.form.value.email ?? '').subscribe({
      next: (response) => {
        this.successMessage = response.message;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message ?? 'Unable to send reset email.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
