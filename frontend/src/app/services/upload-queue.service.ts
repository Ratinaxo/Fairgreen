import { Injectable, inject } from '@angular/core';
import { DataService } from './data.service';
import { ToastService } from './toast.service';
import { SampleFile } from '../pages/new-sample/new-sample.component';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class UploadQueueService {
  private dataService = inject(DataService);
  private toastService = inject(ToastService);

  queueUploads(muestraId: number, files: SampleFile[]) {
    if (files.length === 0) return;

    this.toastService.show(`Procesando y subiendo ${files.length} foto(s) en segundo plano...`, 'info', 5000);

    const uploadNext = async (index: number) => {
      if (index >= files.length) {
        this.toastService.show(`¡Fotos de la muestra #${muestraId} procesadas y subidas con éxito!`, 'success', 8000);
        return;
      }
      
      let finalFile = files[index].file;
      
      // Compress if it's not already compressed or if we just want to ensure it is
      // We check if size is large, but to be safe we can just compress it
      try {
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          initialQuality: 0.8
        };
        const compressedBlob = await imageCompression(files[index].file, options);
        finalFile = new File([compressedBlob], files[index].file.name, {
          type: compressedBlob.type,
          lastModified: Date.now()
        });
      } catch (e) {
        console.error('Error compressing in background', e);
      }

      this.dataService.uploadFoto(muestraId, finalFile).subscribe({
        next: () => {
          uploadNext(index + 1);
        },
        error: () => {
          this.toastService.show(`Error al subir imagen ${index + 1} de la muestra #${muestraId}`, 'error', 5000);
          uploadNext(index + 1);
        }
      });
    };

    // Start sequential background upload
    uploadNext(0);
  }
}
