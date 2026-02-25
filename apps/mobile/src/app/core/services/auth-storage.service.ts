import { Injectable } from '@angular/core';
import { AuthSession } from '../models/auth.models';

const SESSION_KEY = 'steeze.session';

@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  loadSession(): AuthSession | null {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthSession;
    } catch {
      return null;
    }
  }

  saveSession(session: AuthSession | null): void {
    if (!session) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
}
