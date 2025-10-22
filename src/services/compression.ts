// services/compression.ts
export class FileCompressor {
    static async compressFile(file: File): Promise<Blob> {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension || '');
      
      // Skip compression for images to maintain OCR quality
      if (isImage) {
        console.log('🖼️ Skipping compression for image file');
        return file;
      }
  
      console.log('🗜️ Compressing file:', file.name);
      
      try {
        // Read file content
        const arrayBuffer = await file.arrayBuffer();
        
        // Create gzip compressed blob
        const compressedStream = new CompressionStream('gzip');
        const writer = compressedStream.writable.getWriter();
        writer.write(new Uint8Array(arrayBuffer));
        writer.close();
        
        const compressedBlob = await new Response(compressedStream.readable).blob();
        
        console.log('✅ Compression complete:', {
          original: this.formatBytes(file.size),
          compressed: this.formatBytes(compressedBlob.size),
          ratio: `${((compressedBlob.size / file.size) * 100).toFixed(1)}%`
        });
        
        return compressedBlob;
      } catch (error) {
        console.error('❌ Compression failed, using original file:', error);
        return file;
      }
    }
  
    static formatBytes(bytes: number): string {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  
    static isCompressed(blob: Blob): boolean {
      return blob.type === 'application/gzip';
    }
  }