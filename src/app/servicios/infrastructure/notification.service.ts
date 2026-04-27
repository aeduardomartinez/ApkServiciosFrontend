import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Utilizamos apiBaseUrl que es la variable real en tu environment
  private apiUrl = `${environment.apiBaseUrl}/api/notifications`;

  constructor(private http: HttpClient) { }

  enviarRecordatorios() {
    return this.http.post(`${this.apiUrl}/send-reminder`, {}, { responseType: 'text' });
  }

  enviarRecordatorioPerfil(perfilId: string | number) {
    return this.http.post(`${this.apiUrl}/send-reminder/${perfilId}`, {}, { responseType: 'text' });
  }
}
