import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfService } from '../pdf.service';
import { Router } from '@angular/router';
import {MatTableModule} from '@angular/material/table';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatTableModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  files: string[] = [];
  infos: { index: string, Title: string, Subject: string, DOI: string, Author: string }[] = [];
  displayedColumns: string[] = ['Index', 'Title', 'Subject', 'DOI', 'Author'];

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
