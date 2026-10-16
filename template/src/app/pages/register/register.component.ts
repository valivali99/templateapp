import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/auth.service';
import { errorMessage } from '../../core/errors';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  return group.get('password')?.value === group.get('confirm')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule, RouterLink, MatButtonModule, MatCardModule,
    MatFormFieldModule, MatIconModule, MatInputModule, MatProgressBarModule,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card" appearance="outlined">
        @if (loading()) { <mat-progress-bar mode="indeterminate" /> }
        <mat-card-header>
          <mat-card-title>Create an account</mat-card-title>
          <mat-card-subtitle>It only takes a moment</mat-card-subtitle>
        </mat-card-header>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-card-content>
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" autocomplete="username" />
              <mat-icon matPrefix>person</mat-icon>
              @if (form.controls.username.hasError('required')) { <mat-error>Username is required</mat-error> }
              @if (form.controls.username.hasError('minlength')) { <mat-error>At least 3 characters</mat-error> }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
              <mat-icon matPrefix>lock</mat-icon>
              @if (form.controls.password.hasError('required')) { <mat-error>Password is required</mat-error> }
              @if (form.controls.password.hasError('minlength')) { <mat-error>At least 6 characters</mat-error> }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Confirm password</mat-label>
              <input matInput type="password" formControlName="confirm" autocomplete="new-password" />
              <mat-icon matPrefix>lock</mat-icon>
            </mat-form-field>

            @if (form.hasError('mismatch') && form.controls.confirm.touched) {
              <p class="form-error">Passwords do not match</p>
            }
            @if (error()) { <p class="form-error">{{ error() }}</p> }
          </mat-card-content>

          <mat-card-actions>
            <button mat-flat-button type="submit" [disabled]="loading()">Sign up</button>
          </mat-card-actions>
        </form>

        <p class="auth-switch">Already have an account? <a routerLink="/login">Sign in</a></p>
      </mat-card>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = inject(NonNullableFormBuilder).group(
    {
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.auth.register(username, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error.set(errorMessage(err, 'Sign up failed'));
        this.loading.set(false);
      },
    });
  }
}
