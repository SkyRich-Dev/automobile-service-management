import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  entityType: string;
  entityId: string | number;
  onUploadComplete: (url: string, type: string) => void;
  accept?: string;
  maxFiles?: number;
}

export function FileUploader({ entityType, entityId, onUploadComplete, accept = 'image/*,video/*', maxFiles = 10 }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const csrfToken = document.cookie.split('; ').find(r => r.startsWith('csrftoken='))?.split('=')[1];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entity_type', entityType);
    formData.append('entity_id', String(entityId));
    const response = await fetch('/api/media/upload/', {
      method: 'POST',
      headers: csrfToken ? { 'X-CSRFToken': csrfToken } : {},
      credentials: 'include',
      body: formData,
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Upload failed');
    }
    return response.json();
  };

  const handleFiles = async (files: FileList) => {
    setError('');
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, maxFiles)) {
        const result = await uploadFile(file);
        onUploadComplete(result.url, result.type);
      }
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors' data-testid='file-uploader'>
      <input ref={inputRef} type='file' accept={accept} multiple className='hidden'
             onChange={e => e.target.files && handleFiles(e.target.files)} data-testid='file-input' />
      <Upload className='h-8 w-8 mx-auto mb-2 text-muted-foreground' />
      <p className='text-sm text-muted-foreground mb-2'>Drag & drop or click to upload</p>
      <Button type='button' variant='outline' size='sm' disabled={uploading}
              onClick={() => inputRef.current?.click()} data-testid='upload-button'>
        {uploading ? 'Uploading...' : 'Choose Files'}
      </Button>
      {error && <p className='text-destructive text-sm mt-2' data-testid='upload-error'>{error}</p>}
    </div>
  );
}
