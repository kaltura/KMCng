import { UploadFileData } from '@kaltura-ng/kaltura-common';

export class KalturaUploadFile implements UploadFileData {
  serverUploadToken: string;


  constructor(public file: File) {
  }

  getFileName(): string {
    return (this.file.name || '').trim();
  }

  getFileSize(): number {
    return this.file.size;
  }
}


