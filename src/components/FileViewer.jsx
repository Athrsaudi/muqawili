import React, { useState } from 'react';

export default function FileViewer({ files=[], title='المرفقات' }) {
  const [lightbox, setLightbox] = useState(null);
  const allFiles = [...new Set(files.filter(Boolean))];
  if (!allFiles.length) return null;
  return (
    <div className="file-viewer">
      <div className="file-viewer-title">{title} ({allFiles.length})</div>
      <div className="file-viewer-grid">
        {allFiles.map((url,i) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
          const isVideo = /\.(mp4|mov|webm)$/i.test(url);
          const isPDF   = /\.pdf$/i.test(url);
          const name = url.split('/').pop().split('?')[0].replace(/_[a-z0-9]{6,}\./,'.');
          return (
            <div key={i} className="file-viewer-item">
              {isImage && <img src={url} alt={name} className="file-viewer-img" onClick={()=>setLightbox(url)} />}
              {isVideo && <video controls className="file-viewer-video" preload="metadata"><source src={url}/></video>}
              {isPDF && <a href={url} target="_blank" rel="noopener noreferrer" className="file-viewer-pdf"><span>📄</span><span>{name}</span></a>}
              {!isImage&&!isVideo&&!isPDF && <a href={url} target="_blank" rel="noopener noreferrer" className="file-viewer-generic"><span>📎</span><span>{name}</span></a>}
            </div>
          );
        })}
      </div>
      {lightbox && (
        <div className="file-lightbox" onClick={()=>setLightbox(null)}>
          <img src={lightbox} alt="preview" className="file-lightbox-img"/>
          <button className="file-lightbox-close">✕</button>
        </div>
      )}
    </div>
  );
}