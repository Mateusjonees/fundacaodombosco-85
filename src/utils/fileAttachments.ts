const VIEWABLE_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'txt']);

export const getFileExtension = (filePath: string) => {
  const cleanPath = filePath.split('?')[0];
  const fileName = cleanPath.split('/').pop() || '';
  const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
  return extension?.toLowerCase() || '';
};

export const getAttachmentFileName = (filePath: string, fallbackName: string) => {
  const storedName = decodeURIComponent(filePath.split('/').pop()?.split('?')[0] || '');
  const originalName = storedName.replace(/^\d+[_-]/, '');
  const extension = getFileExtension(filePath);

  if (originalName && originalName.includes('.')) return originalName;
  if (extension && !fallbackName.toLowerCase().endsWith(`.${extension}`)) {
    return `${fallbackName}.${extension}`;
  }
  return fallbackName;
};

export const canPreviewAttachment = (filePath: string) => VIEWABLE_EXTENSIONS.has(getFileExtension(filePath));

export const isStorageAttachmentPath = (value?: string | null): value is string => {
  if (!value || !value.includes('/')) return false;
  return Boolean(getFileExtension(value));
};

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};