import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024*1024) return (bytes/1024).toFixed(1)+' KB';
  return (bytes/(1024*1024)).toFixed(1)+' MB';
}

export default function FileUploader({ bucket, folder, existingFiles=[], onFilesChange, maxFiles=10, label='المرفقات' }) {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState(
    existingFiles.map(u => typeof u === 'string' ? {url:u, name:u.split('/').pop().split('?')[0]} : u)
  );
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleSelect(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    if (files.length + selected.length > maxFiles) { setError('الحد الأقصى '+maxFiles+' ملفات'); return; }
    setError(''); setUploading(true);
    const uploaded = [];
    for (const file of selected) {
      if (file.size > 50*1024*1024) { setError('الملف '+file.name+' أكبر من 50MB'); continue; }
      const ext = file.name.split('.').pop();
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file);
      if (upErr) { setError('خطأ في الرفع: '+upErr.message); continue; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      uploaded.push({ url: data.publicUrl, name: file.name, type: file.type, size: file.size });
    }
    const newFiles = [...files, ...uploaded];
    setFiles(newFiles);
    onFilesChange(newFiles.map(f => f.url));
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function removeFile(idx) {
    const file = files[idx];
    if (file.url) {
      const path = file.url.split('/storage/v1/object/public/'+bucket+'/')[1];
      if (path) await supabase.storage.from(bucket).remove([path]);
    }
    const newFiles = files.filter((_,i) => i !== idx);
    setFiles(newFiles);
    onFilesChange(newFiles.map(f => f.url));
  }

  return (
    <div className="file-uploader">
      <div className="file-uploader-header">
        <span className="file-uploader-label">{label}</span>
        <span className="file-uploader-count">{files.length}/{maxFiles}</span>
      </div>
      {error && <div className="file-uploader-error">⚠️ {error}</div>}
      <div
        className="file-drop-zone"
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if(e.dataTransfer?.files?.length){ const dt=new DataTransfer(); Array.from(e.dataTransfer.files).forEach(f=>dt.items.add(f)); inputRef.current.files=dt.files; handleSelect({target:inputRef.current}); } }}
      >
        {uploading ? <span className="file-uploading">⏳ جارٍ الرفع...</span> : (
          <>
            <span className="file-drop-icon">📎</span>
            <span className="file-drop-text">اضغط لرفع ملف أو اسحب وأفلت</span>
            <span className="file-drop-hint">صور • فيديو • PDF — حتى 50MB لكل ملف</span>
          </>
        )}
        <input ref={inputRef} type="file" multiple accept="image/*,video/*,.pdf" onChange={handleSelect} style={{display:'none'}} />
      </div>
      {files.length > 0 && (
        <div className="file-list">
          {files.map((file,i) => {
            const url = file.url || file;
            const name = file.name || url.split('/').pop().split('?')[0];
            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || (file.type||'').startsWith('image');
            const isVideo = /\.(mp4|mov|webm)$/i.test(url) || (file.type||'').startsWith('video');
            const isPDF   = /\.pdf$/i.test(url) || file.type==='application/pdf';
            return (
              <div key={i} className="file-item">
                {isImage && <img src={url} alt={name} className="file-preview-img" />}
                {!isImage && <div className="file-preview-pdf"><span>{isVideo?'🎬':isPDF?'📄':'📎'}</span></div>}
                <div className="file-item-info">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="file-item-name">{name}</a>
                  {file.size && <span className="file-item-size">{formatSize(file.size)}</span>}
                </div>
                <button className="file-item-remove" onClick={()=>removeFile(i)}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}