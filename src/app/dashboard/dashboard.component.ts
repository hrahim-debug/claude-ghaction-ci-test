import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { interval } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  // DESIGN: Business logic in component (should be in a service)
  userData: any = null;
  notifications: any[] = [];
  welcomeHtml = '';
  errorMessage = '';

  // DESIGN: Magic numbers
  private maxRetries = 3;
  private refreshInterval = 30000;

  // DESIGN: Injecting HttpClient directly (should use a service)
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadDashboard();

    // BUG: Memory leak - interval never cleaned up (no OnDestroy)
    interval(this.refreshInterval).subscribe(() => {
      this.loadDashboard();
    });
  }

  // OnDestroy is NOT implemented - subscriptions leak!

  loadDashboard() {
    // BUG: No error handling on HTTP calls
    this.http.get('/api/dashboard').subscribe((data: any) => {

      this.userData = data;

      // SECURITY: XSS via bypassSecurityTrustHtml
      this.welcomeHtml = this.sanitizer
        .bypassSecurityTrustHtml(
          `<h2>Welcome, ${data.name}!</h2>`
        ) as string;

      // BUG: Nested subscribe (should use switchMap/mergeMap)
      this.http.get('/api/notifications')
        .subscribe((notifs: any) => {
          this.notifications = notifs;
        });
    });
  }

  // DESIGN: Complex logic in template binding method
  getStatusColor(status: string): string {
    if (status == 'active') return 'green';
    if (status == 'inactive') return 'red';
    if (status == 'pending') return 'yellow';
    if (status == 'suspended') return 'orange';
    return 'gray';
  }

  // BUG: async operation without proper error handling
  async deleteNotification(id: number) {
    await this.http.delete(`/api/notifications/${id}`)
      .toPromise();
    // BUG: Mutating array by index (wrong element after delete)
    const index = this.notifications.findIndex(
      (n: any) => n.id == id
    );
    this.notifications.splice(index, 1);
  }

  // DESIGN: Using deprecated toPromise()
  async exportData() {
    const data = await this.http.get('/api/export')
      .toPromise();
    // BUG: JSON.stringify on potentially circular reference
    const blob = new Blob(
      [JSON.stringify(data)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    // BUG: URL never revoked - memory leak
    window.open(url);
  }
}
