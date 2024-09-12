import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  // private foldersUrl = 'https://read-pdf-api.zhilingtech.com/';
  private foldersUrl = 'https://humanfactorPDFreader-api.dinglantech.com/';
  // private foldersUrl = 'http://localhost:3000/';

  constructor(private http: HttpClient) {}

  getFolders(): Observable<string[]> {
    return this.http.get<string[]>(`${this.foldersUrl}api/folders`);
  }
  getImages(folder: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.foldersUrl}api/folder/${folder}`);
  }
  getJson(folder: string, file: string): Observable<string> {
    return this.http.get<string>(`${this.foldersUrl}api/json/${folder}/${file}`);
  }
  updateJson(folder: string, file: string, json: any): Observable<any> {
    return this.http.put<string>(`${this.foldersUrl}api/json/${folder}/${file}`, json);
  }
}
