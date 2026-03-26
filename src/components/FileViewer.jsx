import React,{useState}from 'react';
export default function FileViewer({files=[],title='المرفقات'}){
  const[lb,setLb]=useState(null);
  const all=[...new Set((files||[]).filter(Boolean))];
  if(!all.length)return null;
  return(
    <div className="file-viewer">
      {title&&<div className="file-viewer-title">{title} ({all.length})</div>}
      <div className="file-viewer-grid">
        {all.map((url,i)=>{
          const isImg=/\.(jpg|jpeg|png|gif|webp)$/i.test(url);
          const isVid=/\.(mp4|mov|webm)$/i.test(url);
          const isPdf=/\.pdf$/i.test(url);
          const name=decodeURIComponent(url.split('/').pop().split('?')[0]);
          return(
            <div key={i} className="file-viewer-item">
              {isImg&&<img src={url} alt={name} className="file-viewer-img" onClick={()=>setLb(url)}/>}
              {isVid&&<video controls className="file-viewer-video" preload="metadata"><source src={url}/></video>}
              {isPdf&&<a href={url} target="_blank" rel="noopener noreferrer" className="file-viewer-pdf"><span>📄</span><span>{name}</span></a>}
              {!isImg&&!isVid&&!isPdf&&<a href={url} target="_blank" rel="noopener noreferrer" className="file-viewer-generic"><span>📎</span><span>{name}</span></a>}
            </div>
          );
        })}
      </div>
      {lb&&<div className="file-lightbox" onClick={()=>setLb(null)}><img src={lb} alt="preview" className="file-lightbox-img"/><button className="file-lightbox-close">✕</button></div>}
    </div>
  );
}