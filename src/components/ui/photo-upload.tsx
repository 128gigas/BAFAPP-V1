import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  onFileSelect: (base64: string, file: File) => void;
  currentPhotoUrl?: string;
  onRemovePhoto?: () => void;
  acceptedFileTypes?: string;
  maxFileSize?: number;
}

export function PhotoUpload({ 
  onFileSelect, 
  currentPhotoUrl, 
  onRemovePhoto,
  acceptedFileTypes = 'image/*',
  maxFileSize = 1048576 // 1MB default
}: PhotoUploadProps) {
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      try {
        const base64 = await convertToBase64(acceptedFiles[0]);
        onFileSelect(base64, acceptedFiles[0]);
      } catch (error) {
        console.error('Error converting file to base64:', error);
      }
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      [acceptedFileTypes]: []
    },
    maxSize: maxFileSize,
    multiple: false
  });

  return (
    <div className="space-y-4">
      {currentPhotoUrl ? (
        <div className="relative inline-block">
          {acceptedFileTypes === 'image/*' ? (
            <img
              src={currentPhotoUrl}
              alt="Preview"
              className="h-32 w-32 rounded-lg object-cover"
            />
          ) : (
            <div className="h-32 w-32 rounded-lg bg-gray-100 flex items-center justify-center">
              <span className="text-sm text-gray-500">Documento</span>
            </div>
          )}
          {onRemovePhoto && (
            <button
              onClick={onRemovePhoto}
              className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Suelta el archivo aquí'
              : 'Arrastra un archivo o haz clic para seleccionar'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {acceptedFileTypes === 'image/*' 
              ? 'PNG, JPG o JPEG (máx. 1MB)'
              : 'PDF, DOC o DOCX (máx. 5MB)'}
          </p>
        </div>
      )}
    </div>
  );
}