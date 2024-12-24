import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfService } from '../pdf.service';
import { Router } from '@angular/router';
import {MatTableModule} from '@angular/material/table';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatTableModule,MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  files: string[] = [];
  infos: { index: string, Title: string, Journal: string, DOI: string, Author: string }[] = [];
  displayedColumns: string[] = ['Index', 'Title', 'Author', 'Journal', 'DOI'];

  constructor(private pdfService: PdfService, private router: Router) {}

  ngOnInit(): void {
    this.loadInfos();
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

  export(): void {
    this.pdfService.download().subscribe(
      (files) => {
     const blob = new Blob([files], { type: 'text/csv' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = 'export.csv';
     a.click();
     window.URL.revokeObjectURL(url);
        
      },
      (error) => {
        console.error('Failed to download files', error);
      }
    );
  }

  loadInfos(): void {
    this.pdfService.getInfos().subscribe(
      (infos) => {
        this.infos = infos;
        console.log(this.infos);
      },
      (error) => {
        console.error('Failed to load infos', error);
      }
    );
  }

  goFile(file: string): void {
    this.router.navigate(['/img-viewer', file]);
  }
}
