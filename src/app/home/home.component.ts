import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfService } from '../pdf.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  files: string[] = [];

  constructor(private pdfService: PdfService, private router: Router) {}

  ngOnInit(): void {
    this.loadFolders();
  }

  loadFolders(): void {
    this.pdfService.getFolders().subscribe(
      (folders) => {
        this.files = folders;
        this.files.sort((a, b) => {
          return Number(a) - Number(b);
        });
      },
      (error) => {
        console.error('Failed to load folders', error);
      }
    );
  }

  goFile(file: string): void {
    this.router.navigate(['/img-viewer', file]);
  }
}