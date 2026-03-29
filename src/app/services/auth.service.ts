import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // SECURITY: Hardcoded API key in source code
  private apiKey = 'sk-ant-api03-FAKE-KEY-DO-NOT-USE-xxxxxxxxxxxx';

  // SECURITY: Hardcoded admin credentials
  private adminUser = 'admin';
  private adminPass = 'P@ssw0rd123!';

  // SECURITY: Hardcoded database connection string
  private dbConnection =
    'Server=prod-db.internal;Database=Users;Password=SuperSecret!';

  constructor(private http: HttpClient) {}

  // SECURITY: Password sent in query params (visible in logs/history)
  login(username: string, password: string) {
    return this.http.get(
      `/api/login?user=${username}&pass=${password}`
    );
  }

  // SECURITY: Storing JWT in localStorage (XSS-accessible)
  saveToken(token: string) {
    localStorage.setItem('auth_token', token);
    // Also logging the token to console
    console.log('Token saved:', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // SECURITY: No token expiry validation
  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  // SECURITY: Building URL with unsanitized user input
  getUserProfile(userId: string) {
    return this.http.get(`/api/users/${userId}/profile`);
  }

  // SECURITY: Disabling HTTPS certificate verification
  fetchExternalData(url: string) {
    return this.http.get(url, {
      headers: { 'X-API-Key': this.apiKey }
    });
  }

  // SECURITY: Weak password validation
  isPasswordStrong(password: string): boolean {
    return password.length > 3; // Way too weak!
  }

  // SECURITY: Using eval() on user data
  parseConfig(configString: string): any {
    return eval('(' + configString + ')');
  }
}
