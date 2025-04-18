import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { fabric } from 'fabric';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatRippleModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PdfService } from '../pdf.service';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { nanoid } from 'nanoid';
import { TooltipModule } from 'primeng/tooltip';
import { find } from 'rxjs';
// import tableData from '../../utils/tableData.json';

@Component({
  selector: 'app-img-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    FormsModule,
    MatTooltipModule,
    MatRippleModule,
    SidebarModule,
    ButtonModule,
    TableModule,
    TooltipModule,
  ],
  templateUrl: './img-viewer.component.html',
  styleUrls: ['./img-viewer.component.scss'],
})
export class ImgViewerComponent implements OnInit {
  canvas!: fabric.Canvas;
  initCanvas: any;
  group: any;
  curEditMarkItem: any;
  isCreateMarking: boolean = false;
  isTag: boolean = false;
  curPage: number = 0;
  proportion: number = 0;
  picNow: string = '';
  headers: string[] = ['Title', 'Property', 'V', 'Confidence', 'Locations'];
  secondHeaders: string[] = ['Title', 'Property', 'V', 'Locations'];
  thirdQHeaders: string[] = ['Title', 'Property', 'text', 'Locations'];
  headerEnum = {
    Title: '菌株',
    V:'提取结果',
    Confidence:'置信度',
    Locations:'定位',
    text:'原文',
    Property:'字段名称'
}
  thirdComponentHeaders: string[] = [
    'Title',
    'Property',
    'C',
    'V',
    'U',
    'Locations',
  ];
  rows: any[] = [];
  progressValue: number = 100;
  editingCell = { element: null, header: '' };
  tableData: any;
  isArray(value: any): boolean {
    return Array.isArray(value);
  }
  isNumber(value: any): boolean {
    return typeof value === 'number';
  }
  images: Array<string> = [
    // 'assets/images/1.png',
    // 'assets/images/2.png',
    // 'assets/images/3.png',
    // 'assets/images/4.png',
    // 'assets/images/5.png',
    // 'assets/images/6.png',
    // 'assets/images/7.png',
    // 'assets/images/8.png',
  ];
  locationRects: any = {};
  visible: boolean = false;
  confirm: boolean = false;
  elementNow: any;
  mode: string = '';
  showCorrect: boolean = false;
  activeRow: any = {};
  file: any;
  files: string[] = [];
  sidebarVisible: boolean = false;
  selectedRow: any;

  constructor(
    private _snackBar: MatSnackBar,
    private pdfService: PdfService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // if (!localStorage.getItem('tableData')) {
    //   localStorage.setItem('tableData', JSON.stringify(tableData));
    // }
    // console.log(this.images, 'this.images');
  }

  //获取数据，初始化画布
  ngOnInit() {
    this.file = this.route.snapshot.paramMap.get('file');
    // this.tableData = JSON.parse(localStorage.getItem('tableData') || '{}');
    this.getImages(String(this.file));
    this.loadFolders();
    this.getJson(String(this.file), 'tableData.json');
  }
  //获取files
  loadFolders(): void {
    this.pdfService.getFolders().subscribe(
      (folders) => {
        this.files = folders;
        // console.log(this.files, 'this.files');
        
        //按文件名排序
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
    const currentUrl = this.router.url;
    this.router
      .navigateByUrl('/refresh', { skipLocationChange: true })
      .then(() => {
        this.router.navigate(['/img-viewer', file]);
      });
  }

  //获取图片
  getImages(folder: string): void {
    this.pdfService.getImages(folder).subscribe(
      (images) => {
        images.forEach((image: any) => {
          if (image.includes('.png') || image.includes('.jpg')) {
            const imagePath = `/assets/pdfs/${folder}/${image}`;
            // console.log(imagePath);
            
            this.images.push(imagePath);
            // this.images.push(`../assets/pdfs/${folder}/${image}`);
            const img = new Image();
            img.src = imagePath;
          }
        });
        //images按照文件名排序
        this.images.sort((a, b) => {
          const aNum = parseInt(
            a.split('/')[a.split('/').length - 1].split('.')[0]
          );
          const bNum = parseInt(
            b.split('/')[a.split('/').length - 1].split('.')[0]
          );
          return aNum - bNum;
        });
        this.initializeCanvas();
      },
      (error) => {
        console.error('Failed to load images', error);
      }
    );
  }
  //获取json数据
  getJson(folder: string, file: string): void {
    this.pdfService.getJson(folder, file).subscribe(
      (json) => {
        this.tableData = JSON.parse(json);
        // console.log(this.tableData,'tableData');
        
        const addId = (obj: any) => {
          const stack = [obj];
        
          while (stack.length) {
            const current = stack.pop();
            Object.keys(current).forEach((key) => {
              if (key === 'V') {
                current.id = nanoid();
              } else if (key === 'Components' && Array.isArray(current.Components)) {
                current.Components.forEach((component: any) => {
                  component.id = nanoid();
                });
              } else if (key === 'Q' && Array.isArray(current.Q)) {
                current.Q.forEach((q: any) => {
                  q.id = nanoid();
                });
              } else if (typeof current[key] === 'object' && current[key] !== null) {
                stack.push(current[key]);
              }
            });
          }
        };
        
        addId(this.tableData);
        
        localStorage.setItem('tableData', JSON.stringify(this.tableData));
        this.loadTableData();
        const colorMap = new Map<string, string>();
        const generateColor = () => {
          const r = Math.floor(Math.random() * 156 + 100); 
          const g = Math.floor(Math.random() * 156 + 100); 
          const b = Math.floor(Math.random() * 156 + 100); 
          const a = 0.1;
          return `rgba(${r}, ${g}, ${b},${a})`;
        };

        this.rows.forEach((row) => {
          if (!colorMap.has(row.Title)) {
            colorMap.set(row.Title, generateColor());
          }
          row.bgColor = colorMap.get(row.Title);
        });
      },
      (error) => {
        console.error('Failed to load json', error);
      }
    );
  }
  //更新json数据
  updateJson(folder: string, file: string, json: string): void {
    this.pdfService.updateJson(folder, file, json).subscribe(
      (json) => {
        console.log('Updated json', json);
      },
      (error) => {
        console.error('Failed to update json', error);
      }
    );
  }
  //显示对话框
  showDialog() {
    this.visible = true;
  }
  //更改value
  editCellOne(element: any, header: string) {
    this.editingCell = { element, header };
  }
  isEditing(element: any, header: string): boolean {
    return (
      this.editingCell.element === element && this.editingCell.header === header
    );
  }
  //结束更改
  stopEditing() {
    Object.keys(this.tableData).forEach((key) => {
      // @ts-ignore
      if (key === this.editingCell.element.Property) {
        // @ts-ignore
        this.tableData[key]['V'] = this.editingCell.element.V;
        // @ts-ignore
      } else if (key === this.editingCell.element.Title.split('_')[0]) {
        Object.keys(this.tableData[key]).forEach((k) => {
          // @ts-ignore
          if (k === this.editingCell.element.Property) {
            // @ts-ignore
            this.tableData[key][k].V = this.editingCell.element.V;
          } else {
            this.tableData[key]['Components'].forEach((component: any) => {
              // @ts-ignore
              if (component.C === this.editingCell.element.Property) {
                // @ts-ignore
                component.V = this.editingCell.element.V;
              }
            });
          }
        });
      }
    });
    localStorage.setItem('tableData', JSON.stringify(this.tableData));
    this.updateJson(String(this.file), 'tableData.json', this.tableData);
    this.editingCell = { element: null, header: '' };
  }

  updateValue = (obj: any, id: string, value: any) => {
    // console.log(id,obj,value,1111111111111);
    
    const stack = [obj];
    while (stack.length) {
      const current = stack.pop();
      Object.keys(current).forEach((key) => {
        if (key === 'id' && current.id === id) {
          // console.log(current, 'current');
          
          current.V = value;
        } else if (key === 'Components' && Array.isArray(current.Components)) {
          current.Components.forEach((component: any) => {
            stack.push(component);
          });
        } else if (key === 'Q' && Array.isArray(current.Q)) {
          current.Q.forEach((q: any) => {
            stack.push(q);
          });
        } else if (typeof current[key] === 'object' && current[key] !== null) {
          stack.push(current[key]);
        }
      });
    }
  };

  //更新value
  update = (row, value) =>{
    // console.log(row, value, 'row,value');
    
    this.updateValue(this.tableData, row.id, value);

    // // console.log(row, value, 'row,value');
    // Object.keys(this.tableData).forEach((key) => {
    //   // console.log(key, 'key');
    //   if (key === row.Title) {
    //     Object.keys(this.tableData[key]).forEach((k) => {
    //       if (k === row.Property) {
    //         if (!row.text) {
    //           this.tableData[key][k].V = row.V;
    //         } else {
    //           this.tableData[key][k].Q.forEach((q) => {
    //             if (q.text === row.text) {
    //               q.V = row.V;
    //             }
    //           });
    //         }
    //       }
    //     });
    //   }
    // });
    localStorage.setItem('tableData', JSON.stringify(this.tableData));
    this.updateJson(String(this.file), 'tableData.json', this.tableData);
  }

  //初始化画布
  initializeCanvas() {
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    this.initCanvas = new fabric.Canvas('canvas', {
      width: (windowWidth / 100) * 45,
      height: windowHeight,
      selection: false,
    });
    this.group = new fabric.Group([], {
      hasBorders: false,
      hasControls: false,
    });
    this.showPic();
    this.initCanvas.on('mouse:wheel', this.handleMouseWheel);
    this.initCanvas.on('mouse:down', this.handleMouseClick);
  }

  // 获取数据
  loadTableData() {
    this.rows = [];
    // console.log(this.tableData, 'this.tableData');
    
    Object.keys(this.tableData).forEach((key) => {
      const data = this.tableData[key];
      // console.log(data);

      // 如果没有 Components
      if (!data.Components) {
        this.processDataWithoutComponents(key, data);
      } else {
        this.processDataWithComponents(key, data);
      }
    });
  }

  // 处理没有 Components 的数据
  processDataWithoutComponents(key, data) {
    type TableRow = {
      Property: any;
      Title: string;
      V?: any;
      Q?: Array<any>;
      Locations?: Array<any>;
      Confidence?: string;
      id?: string;
      children?: Array<TableRow>;
    };
    // console.log(key);
      if (Object.keys(data).find((i) => i === 'V')) {
      
      const row: TableRow = {
        Title: key,
        V: data.V,
        Q: data.Q || [],
        Property: '-',
        Locations: data.Locations,
        Confidence: data.Confidence,
        id : data.id
        // id: nanoid(),
      };
      if (Array.isArray(data.Q) && data.Q.length === 1) {
        row.Q = data.Q[0].text;
        row.Locations = data.Q[0].Locations;
        row.id = data.id;
      } else if (Array.isArray(data.Q)) {
        data.Q.forEach((q) => {
          q.Title = key;
          q.Property = '-';
          q.Confidence = data.Confidence;
          q.id = q.id;
          q.V = q.V || '-';
        });
      }
      this.rows.push(row);
    } else {
      // console.log(data, 'data');
      Object.keys(data).forEach((k) => {
        const row: TableRow = {
          Property: k,
          Title: key,
          V: data[k].V,
          Locations: data[k].Locations,
          children: [],
          id: data[k].id,
        };
        if (this.isArray(data)) {
          row.Property = '-';
        }
        if (!data[k]['V']) {
          Object.keys(data[k]).forEach((key) => {
            if (Array.isArray(data[k][key]) && data[k][key].length > 0) {
              let rowItem = {
                Property: key,
                Title: k,
                id: nanoid(),
                children: data[k][key].map((child) => ({
                  ...child,
                  // id: nanoid(), 
                  id:child.id,
                  Property: key,
                  Title: k,
                })),
              };
              row.children!.push(rowItem);
            } else {
              let rowItem = {
                Property: key,
                Title: k,
                V: data[k][key]?.V,
                Locations: data[k][key]?.Locations,
                id: data[k][key]?.id,
                // id: nanoid(),
              };
              row.children!.push(rowItem);
            }
          });
        } else {
          row.Confidence = data[k].Confidence;
          row.id = data[k].id;
          // console.log(data[k], 'data[k]');
          
          Object.keys(data[k]).forEach((key) => {
            if (Array.isArray(data[k][key]) && data[k][key].length > 0) {
              let rowItem = {
                Property: key,
                Title: k,
                id: nanoid(),
                children: data[k][key].map((child) => ({
                  Property: key,
                  Title: k,
                  id:child.id,
                  ...child,
                  // id: nanoid(), 
                })),
              };
              row.children!.push(rowItem);
            }
          });
        }
        // if (Array.isArray(data[k].Q) && data[k].Q.length === 1) {
        //   row.Q = data[k].Q[0].text;
        //   row.Locations = data[k].Q[0].Locations;
        // } else if (Array.isArray(data[k].Q)) {
        //   data[k].Q.forEach((q) => {
        //     q.Title = key;
        //     q.Property = k;
        //     q.Confidence = data[k].Confidence;
        //     q.id = nanoid();
        //     q.V = q.V || '-';
        //   });
        // }
        this.rows.push(row);
      });
    }
    // console.log(this.rows);
  }

  // 处理有 Components 的数据
  processDataWithComponents(key, data) {
    Object.keys(data).forEach((k) => {
      if (k !== 'Components') {
        this.processDataRow(key, k, data);
      } else {
        this.processComponentRows(key, data[k]);
      }
    });
  }

  // 处理单个数据行
  processDataRow(key, k, data) {
    const row = {
      Property: k,
      Title: `${key}_info`,
    };

    this.headers.forEach((header) => {
      if (header !== 'Property' && header !== 'Title') {
        row[header] = data[k];
      }

      if (header === 'Q') {
        row[header] = data['Source text'].V;
      }

      if (header === 'V') {
        row[header] = data[k].V;
      }
    });

    this.rows.push(row);
  }

  // 处理 Components 数据行
  processComponentRows(key, components) {
    components.forEach((component) => {
      const row = {
        Property: component.Component,
        Title: `${key}_Components_element`,
      };

      this.headers.forEach((header) => {
        if (header !== 'Property' && header !== 'Title') {
          row[header] = component[header];
        } else if (header === 'Property') {
          row[header] = component['C'];
        }

        if (header === 'Q') {
          row[header] = this.tableData[key]['Source text'].V;
        }

        if (header === 'Locations') {
          row[header] = component['Locations'];
        }
      });

      this.rows.push(row);
    });
  }
  //定位
  clickItem(row: any, type: string) {
    // console.log(row, 'row');

    if (
      typeof row.Locations !== 'object' ||
      row.Q === 'Not provided' ||
      row.Locations.length === 0
    ) {
      this.showCorrect = false;
      this._snackBar.open(
        typeof row.Locations !== 'object' || row.Locations.length === 0
          ? '缺少原文位置，无法定位'
          : 'value并未匹配，无法定位',
        '关闭',
        {
          duration: 1000,
        }
      );
      this.locationRects = {};
      this.curPage = 0;
      this.showPic();
    } else {
      this.showCorrect = true;
      if (type === 'subRow') {
        // console.log(row, 'row');

        this.jump(row.Locations);
      } else {
        if (row.Locations) {
          this.jump(row.Locations);
        } else return;
      }
    }
  }
  //上一页
  prePage() {
    if (this.curPage > 0) {
      this.curPage--;
      this.showPic();
    }
  }
  //下一页
  nextPage() {
    if (this.curPage < this.images.length - 1) {
      this.curPage++;
      this.showPic();
    }
  }
  //绘制图片
  showPic() {
    return new Promise<void>((resolve) => {
      this.group.getObjects().forEach((item: any) => {
        this.group.remove(item);
      });
      fabric.Image.fromURL(this.images[this.curPage], (img) => {
        this.proportion = this.initCanvas.height / img.height!;
        img.set({
          left: 0,
          top: 0,
          hasBorders: false,
          hasControls: false,
        });
        img.scaleToHeight(this.initCanvas.height);
        // console.log(img);

        this.initCanvas.setWidth(
          img.scaleToHeight(this.initCanvas.height).width! * this.proportion
        );
        document.getElementById('btns')!.style.width =
          this.initCanvas.width + 'px';
        this.group.addWithUpdate(img);
        this.initCanvas.add(this.group);
        if (this.locationRects[this.curPage]) {
          const drawnPositions = new Set();
          this.locationRects[this.curPage].forEach((i: any) => {
            if (i.length !== 0) {
              for (let j = 0; j < i.length / 2; j++) {
                const left = i[2 * j][0] * this.proportion + this.group.left;
                // const top = i[2 * j][1] * this.proportion + this.group.top - 20;
                const top = i[2 * j][1] * this.proportion + this.group.top;
                const width = (i[2 * j + 1][0] - i[2 * j][0]) * this.proportion;
                const height =
                  // (i[2 * j + 1][1] - i[2 * j][1]) * this.proportion + 40;
                  (i[2 * j + 1][1] - i[2 * j][1]) * this.proportion;
                const positionKey = `${left},${top}`;
                if (!drawnPositions.has(positionKey)) {
                  const rect = new fabric.Rect({
                    left: left,
                    top: top,
                    fill: 'rgba(255,0,0,0.3)',
                    width: width,
                    height: height,
                    selectable: false,
                  });
                  this.group.addWithUpdate(rect);
                  drawnPositions.add(positionKey);
                }
              }
            }
          });
        }
        resolve();
      });
    });
  }
  //滚轮缩放
  handleMouseWheel = (opt: any) => {
    const delta = opt.e.deltaY;
    let zoom = this.initCanvas.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > 20) zoom = 20;
    if (zoom < 0.01) zoom = 0.01;
    this.initCanvas.zoomToPoint(
      {
        x: opt.e.offsetX,
        y: opt.e.offsetY,
      },
      zoom
    );
    opt.e.preventDefault();
    opt.e.stopPropagation();
  };
  //页面跳转
  jump(location: any) {
    // console.log(location, 'location');
    let Locations = location;
    this.locationRects = {};
    if (location.Locations) {
      this.curPage = location.Locations[0][0];
      Locations = location.Locations;
    } else {
      // this.curPage = location[0][0];
      let count = 0;
      while (typeof location[0] !== 'number') {
        location = location[0];
        count++;
      }
      // console.log(count, 'count');
      if(count === 2){
        Locations = Locations.flat(1);
      }
      // console.log(Locations, 'location');
      this.curPage = location[0];

    }

    this.showPic().then(() => {
      this.initCanvas.getObjects().forEach((item: any) => {
        if (item.type === 'rect') {
          this.initCanvas.remove(item);
        }
      });
      this.group.getObjects().forEach((item: any) => {
        if (item.type === 'rect') {
          this.group.remove(item);
        }
      });

      const drawnPositions = new Set();
      this._snackBar.open('定位成功', '关闭', {
        duration: 1000,
      });
      Locations.forEach((item: any) => {
        //记录locationRects
        if (!this.locationRects[item[0]]) {
          this.locationRects[item[0]] = [];
        }
        this.locationRects[item[0]].push(item[1]);

        // console.log(item, 'item');

        if (item[0] === this.curPage) {
          item.forEach((i: any) => {
            if (i.length !== 0) {
              for (let j = 0; j < i.length / 2; j++) {
                const left = i[2 * j][0] * this.proportion + this.group.left;
                // const top = i[2 * j][1] * this.proportion + this.group.top - 20;
                const top = i[2 * j][1] * this.proportion + this.group.top;
                const width = (i[2 * j + 1][0] - i[2 * j][0]) * this.proportion;
                const height =
                  // (i[2 * j + 1][1] - i[2 * j][1]) * this.proportion + 40;
                  (i[2 * j + 1][1] - i[2 * j][1]) * this.proportion;
                // console.log(left, top, width, height, 'left, top, width, height');

                const positionKey = `${left},${top}`;
                if (!drawnPositions.has(positionKey)) {
                  const rect = new fabric.Rect({
                    left: left,
                    top: top,
                    fill: 'rgba(255,0,0,0.3)',
                    width: width,
                    height: height,
                    selectable: false,
                  });
                  this.group.addWithUpdate(rect);
                  drawnPositions.add(positionKey);
                }
              }
            }
          });
        }
      });

      this.initCanvas.setZoom(1);
      this.initCanvas.viewportTransform[4] = 0;
      this.initCanvas.viewportTransform[5] = 0;
    });
  }
  //修正或添加标记位置
  correct(element: any, mode: string) {
    if (this.showCorrect) {
      this.mode = mode;

      this.group.set({ selectable: false });
      this.initCanvas.discardActiveObject();
      this.initCanvas.renderAll();
      this.isTag = true;
      this.elementNow = element;
      this.initCanvas.on('mouse:down', this.handleMouseDown);
      this.initCanvas.on('mouse:move', this.handleMouseMove);
      this.initCanvas.on('mouse:up', this.handleMouseUp);
    } else {
      alert('请先选择定位');
    }
  }
  //添加rect
  handleMouseDown = (opt: any) => {
    if (this.isTag) {
      this.isCreateMarking = true;
      const pointer = this.initCanvas.getPointer(opt.e);
      const rect = new fabric.Rect({
        left: pointer.x,
        top: pointer.y,
        fill: 'rgba(255,0,0,0.3)',
        width: 0,
        height: 0,
        selectable: false,
        name: 'rect',
      });
      this.curEditMarkItem = rect;
      this.initCanvas.add(rect);
    }
  };
  //rect拖动
  handleMouseMove = (opt: any) => {
    if (this.isCreateMarking) {
      const pointer = this.initCanvas.getPointer(opt.e);
      this.curEditMarkItem.set({
        width: pointer.x - this.curEditMarkItem.left,
        height: pointer.y - this.curEditMarkItem.top,
      });
      this.initCanvas.renderAll();
    }
  };
  //结束绘画rect
  handleMouseUp = (opt: any) => {
    if (this.isTag) {
      this.isCreateMarking = false;
      this.isTag = false;
      this.curEditMarkItem.set({
        selectable: true,
        hasControls: false,
        hasBorders: false,
        lockScalingX: false,
        lockScalingY: false,
      });
      this.group.addWithUpdate(this.curEditMarkItem);
      // console.log(
      //   'left:',
      //   Math.abs(this.group._objects[0].left) + this.curEditMarkItem.left,
      //   'top:',
      //   Math.abs(this.group._objects[0].top) + this.curEditMarkItem.top,
      //   'width:',
      //   this.curEditMarkItem.width,
      //   'height:',
      //   this.curEditMarkItem.height
      // );

      this.initCanvas.setActiveObject(this.curEditMarkItem);
      this.group.set({ selectable: true });
      this.initCanvas.renderAll();
      this.curEditMarkItem = null;
      this.initCanvas.off('mouse:down', this.handleMouseDown);
      this.initCanvas.off('mouse:move', this.handleMouseMove);
      this.initCanvas.off('mouse:up', this.handleMouseUp);
    }
  };
  //添加或更正位置
  handleMouseClick = (opt: any) => {
    // console.log(this.elementNow, 'this.elementNow');

    let obj = this.initCanvas.getActiveObject();
    if (obj && obj.name === 'rect') {
      document.addEventListener('keydown', (e) => {
        if (e.keyCode === 46) {
          this.group.remove(obj);
          this.initCanvas.remove(obj);
          this.initCanvas.renderAll();
        }
      });
    }
    if (this.elementNow && obj && obj._objects.length > 1) {
      let lastObj = obj._objects[obj._objects.length - 1];
      let left =
        (Math.abs(this.group._objects[0].left) + lastObj.left) /
        this.proportion;
      let top =
        (Math.abs(this.group._objects[0].top) + lastObj.top) / this.proportion;
      // (Math.abs(this.group._objects[0].top) + lastObj.top + 20) /
      // this.proportion;
      let width = lastObj.width / this.proportion;
      let height = lastObj.height / this.proportion;
      // let height = (lastObj.height - 40) / this.proportion;
      if (this.mode === 'add') {
        let location: any[] = [];
        // @ts-ignore
        location.push(this.curPage);
        location.push([
          [left, top],
          [left + width, top + height],
        ]);
        // console.log(this.elementNow, 'this.elementNow');
        const addLocation = (obj: any, id: string, location: any) => {
          const stack = [obj];
          while (stack.length) {
            const current = stack.pop();
            Object.keys(current).forEach((key) => {
              if (key === 'id' && current.id === id) {
                // console.log(current.Locations[0][0][0], 'current.Locations');
                let newLocation = current.Locations;
                let count = 0;
                while(typeof newLocation[0] !== 'number'){
                  newLocation = newLocation[0];
                  count++;
                }
                if(count === 2){
                  current.Locations = current.Locations.flat(1);
                  current.Locations.push(location);
                  let temp: any[] = [];
                  let temp2: any[] = [];
                  current.Locations.forEach((item: any) => {
                    if (temp.length === 0) {
                      temp.push(item);
                    } else if (item[0] === temp[0][0]) {
                      temp.push(item);
                    } else {
                      temp2.push(temp);
                      temp = [];
                      temp.push(item);
                    }
                  });
                  temp2.push(temp);
                  current.Locations = temp2;
                }else{
                  current.Locations.push(location);
                }
                // console.log(count,current.Locations, 'current.Locations');
                
                // current.Locations.push(location);
                // console.log(current.Locations, 'current.Locations');
                
                this.jump(current.Locations);
              } else if (key === 'Components' && Array.isArray(current.Components)) {
                current.Components.forEach((component: any) => {
                  stack.push(component);
                });
              } else if (key === 'Q' && Array.isArray(current.Q)) {
                current.Q.forEach((q: any) => {
                  stack.push(q);
                });
              } else if (typeof current[key] === 'object' && current[key] !== null) {
                stack.push(current[key]);
              }
            });
          }
        }
        addLocation(this.tableData, this.elementNow.id, location);
        // Object.keys(this.tableData).forEach((key) => {
        //   // console.log(this.tableData[key], 'this.tableData[key]',key);
        //   if (key === this.elementNow.Title) {
        //     Object.keys(this.tableData[key]).forEach((k) => {
        //       if (k === this.elementNow.Property) {
        //         if (this.tableData[key][k].Q.length === 1) {
        //           this.tableData[key][k].Q[0].Locations.push(location);
        //         } else {
        //           this.tableData[key][k].Q.forEach((q) => {
        //             if (q.text === this.elementNow.text) {
        //               q.Locations.push(location);
        //             }
        //           });
        //         }
        //       } else {
        //         if (this.tableData[key][k].V === this.elementNow.V) {
        //           this.tableData[key][k].Q.forEach((q) => {
        //             if (q.text === this.elementNow.Q) {
        //               q.Locations.push(location);
        //             }
        //           });
        //         } else {
        //           console.log(k, 'this.tableData[key]', key);
        //           if (this.isArray(this.tableData[key][k])) {
        //             this.tableData[key][k].forEach((q) => {
        //               if (q.text === this.elementNow.text) {
        //                 q.Locations.push(location);
        //               }
        //             });
        //           }
        //         }
        //       }
        //     });
        //   }
        
        //   // if (key === this.elementNow.Property) {
        //   //   this.tableData[key]['Locations'].push(location);
        //   //   console.log(this.tableData[key]['Locations'], 'this.tableData[key][Locations]');

        //   //   this.jump(this.tableData[key]['Locations']);
        //   // } else if (key === this.elementNow.Title.split('_')[0]) {
        //   //   Object.keys(this.tableData[key]).forEach((k) => {
        //   //     if (k === this.elementNow.Property) {
        //   //       this.tableData[key][k]['Locations'].push(location);
        //   //       this.jump(this.tableData[key][k]['Locations']);
        //   //     } else {
        //   //       this.tableData[key]['Components'].forEach((component: any) => {
        //   //         if (component.C === this.elementNow.Property) {
        //   //           component['location'].push(location);
        //   //           console.log(component['location'], 'component[location]');
        //   //           this.jump(component['location']);
        //   //         }
        //   //       });
        //   //     }
        //   //   });
        //   // }
        // });
        
      } else if (this.mode === 'draw') {
        let location: any[] = [];
        location.push([
          this.curPage,
          [
            [left, top],
            [left + width, top + height],
          ],
        ]);
        const correctLocation = (obj: any, id: string, location: any) => {
          const stack = [obj];
          while (stack.length) {
            const current = stack.pop();
            Object.keys(current).forEach((key) => {
              if (key === 'id' && current.id === id) {
                current.Locations = location;
                this.jump(current.Locations);
              } else if (key === 'Components' && Array.isArray(current.Components)) {
                current.Components.forEach((component: any) => {
                  stack.push(component);
                });
              } else if (key === 'Q' && Array.isArray(current.Q)) {
                current.Q.forEach((q: any) => {
                  stack.push(q);
                });
              } else if (typeof current[key] === 'object' && current[key] !== null) {
                stack.push(current[key]);
              }
            });
          }
        };
        correctLocation(this.tableData, this.elementNow.id, location);
        // Object.keys(this.tableData).forEach((key) => {
        //   if (key === this.elementNow.Title) {
        //     Object.keys(this.tableData[key]).forEach((k) => {
        //       if (k === this.elementNow.Property) {
        //         if (this.tableData[key][k].Q.length === 1) {
        //           this.tableData[key][k].Q[0].Locations = location;
        //           this.jump(this.tableData[key][k].Q[0].Locations);
        //         } else {
        //           this.tableData[key][k].Q.forEach((q) => {
        //             if (q.text === this.elementNow.text) {
        //               q.Locations = location;
        //               this.jump(q.Locations);
        //             }
        //           });
        //         }
        //       } else {
        //         if (this.tableData[key][k].V === this.elementNow.V) {
        //           this.tableData[key][k].Q.forEach((q) => {
        //             if (q.text === this.elementNow.Q) {
        //               // console.log(1111111111);
        //               q.Locations = location;
        //               this.jump(q.Locations);
        //             }
        //           });
        //         } else {
        //           console.log(k, 'this.tableData[key]', key);
        //           if (this.isArray(this.tableData[key][k])) {
        //             this.tableData[key][k].forEach((q) => {
        //               if (q.text === this.elementNow.text) {
        //                 q.Locations = location;
        //                 this.jump(q.Locations);
        //               }
        //             });
        //           }
        //         }
        //       }
        //     });
        //   }
        //   // if (key === this.elementNow.Property) {
        //   //   this.tableData[key]['Locations'] = location;
        //   //   this.jump(this.tableData[key]['Locations']);
        //   // } else if (key === this.elementNow.Title.split('_')[0]) {
        //   //   Object.keys(this.tableData[key]).forEach((k) => {
        //   //     if (k === this.elementNow.Property) {
        //   //       console.log(this.tableData[key][k], 'this.tableData[key][k]');
        //   //       this.tableData[key][k]['Locations'] = location;
        //   //       this.jump(this.tableData[key][k]['Locations']);
        //   //       // this.tableData[key][k]['Locations'].push(location);
        //   //     } else {
        //   //       this.tableData[key]['Components'].forEach((component: any) => {
        //   //         if (component.C === this.elementNow.Property) {
        //   //           component['location'] = location;
        //   //           this.jump(component['location']);
        //   //         }
        //   //       });
        //   //     }
        //   //   });
        //   // }
        // });
        
      }
      localStorage.setItem('tableData', JSON.stringify(this.tableData));
        this.updateJson(String(this.file), 'tableData.json', this.tableData);
        this.loadTableData();
        this.mode = '';

        interface TreeNode {
          id: string;
          children?: TreeNode[];
        }
        this.activeRow = {}
        const findAndActivate = (
          arr: TreeNode[],
          targetId: string,
          activeRow: object = {},
          path: any[] = []
        ): boolean => {
          for (const item of arr) {
            const currentPath = [...path, item.id];
            if (item.id === targetId) {
              path.forEach(id => activeRow[id] = true);
              return true;
            }

            if (item.children && item.children.length > 0) {
              const found = findAndActivate(item.children, targetId, activeRow, currentPath);
              if (found) return true;
            }
          }
          return false;
        }
        findAndActivate(this.rows, this.elementNow.id, this.activeRow);
      
    }
  };
  //回到首页
  goHome() {
    this.router.navigate(['/']);
  }
}
