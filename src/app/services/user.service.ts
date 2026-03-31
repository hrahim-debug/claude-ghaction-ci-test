import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, interval } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {

  // BUG: Using 'any' type everywhere - no type safety
  private cache: any = {};
  private users: any[] = [];

  // BUG: Memory leak - interval never unsubscribed
  private pollingSubscription = interval(5000).subscribe(() => {
    this.refreshUsers();
  });

  // BUG: Subject exposed publicly (should be asObservable())
  userUpdated = new Subject<any>();

  constructor(private http: HttpClient) {}

  // BUG: No error handling on HTTP call
  getUsers(): Observable<any> {
    return this.http.get('/api/users');
  }

  // BUG: Subscribe inside subscribe (callback hell / nested observables)
  getUserWithOrders(userId: number) {
    this.http.get(`/api/users/${userId}`).subscribe((user: any) => {
      this.http.get(`/api/users/${userId}/orders`).subscribe(
        (orders: any) => {
          user.orders = orders;
          this.cache[userId] = user;
          this.userUpdated.next(user);
        }
      );
    });
  }

  // BUG: Race condition - multiple rapid calls overwrite each other
  searchUsers(query: string) {
    this.http.get(`/api/users/search?q=${query}`)
      .subscribe((results: any) => {
        this.users = results;
      });
  }

  // BUG: Potential null reference - no null check on cache hit
  getCachedUser(userId: number): User {
    return this.cache[userId].profile;
  }

  // BUG: Off-by-one error in pagination
  getPage(page: number, pageSize: number): any[] {
    const start = page * pageSize;
    const end = start + pageSize - 1; // Should be start + pageSize
    return this.users.slice(start, end);
  }

  // BUG: Comparison with == instead of ===
  isAdmin(user: any): boolean {
    return user.role == 'admin';  // Should use ===
  }

  // BUG: Division by zero when users array is empty
  getAverageAge(): number {
    const total = this.users.reduce(
      (sum: number, u: any) => sum + u.age, 0
    );
    return total / this.users.length;
  }

  // BUG: Not a proper deep clone - mutates source
  cloneUser(user: any): any {
    const clone = Object.assign({}, user);
    clone.address = user.address; // Shared reference!
    return clone;
  }

  private refreshUsers() {
    this.http.get('/api/users').subscribe((data: any) => {
      this.users = data;
    });
  }
}
