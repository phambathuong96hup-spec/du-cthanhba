import React, { useId } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploaderProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  selectedFile,
  onFileSelect,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
  maxSizeMB = 10,
  label = 'File tài liệu đính kèm',
  helperText = 'Hỗ trợ PDF, Word, Excel, JPG, PNG',
}) => {
  const inputId = useId();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`Kích thước file quá lớn (tối đa ${maxSizeMB}MB).`);
        e.target.value = ''; // Reset input
        return;
      }
      onFileSelect(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  };

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div 
        style={{ 
          border: '2px dashed var(--border)', 
          borderRadius: '12px', 
          padding: '20px', 
          textAlign: 'center', 
          cursor: 'pointer',
          background: 'var(--surface-50)',
          position: 'relative',
          transition: 'all 0.2s ease-in-out'
        }}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        <input 
          type="file" 
          id={inputId} 
          style={{ display: 'none' }} 
          onChange={handleFileChange}
          accept={accept}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
          <Upload size={28} style={{ color: 'var(--primary)' }} />
          {selectedFile ? (
            <div>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedFile.name}</span>
              <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '2px' }}>
                ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </span>
            </div>
          ) : (
            <div>
              <span style={{ fontWeight: '600', color: 'var(--primary)' }}>Nhấp để chọn file</span> hoặc kéo thả file vào đây
              <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '2px', color: 'var(--text-secondary)' }}>
                {helperText} (Tối đa {maxSizeMB}MB)
              </span>
            </div>
          )}
        </div>
      </div>
      {selectedFile && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
          <button 
            type="button" 
            onClick={handleClear}
            style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          >
            <X size={14} /> Xóa file đã chọn
          </button>
        </div>
      )}
    </div>
  );
};
