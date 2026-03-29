import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

function fmtSize(b){
  if(b<1024)return b+'B'
  if(b<1048576)return(b/1024).toFixed(1)+'KB'
  return(b/1048576).toFixed(1)+'MB'
}

export default function FileUploader({bucket,folder,existingFiles=[],onFilesChange,maxFiles=10,label='المرفقات'}){
  const[files,setFiles]=useState(
    existingFiles.map(u=>typeof u==='string'?{url:u,name:decodeURIComponent(u.split('/').pop().split('?')[0])}:u)
  )
  const[uploading,setUploading]=useState(false)
  const[error,setError]=useState('')
  const ref=useRef(null)

  async function upload(fileList){
    const sel=Array.from(fileList)
    if(!sel.length)return
    if(files.length+sel.length>maxFiles){setError('الحد الأقصى '+maxFiles+' ملفات');return}
    setError('')
    setUploading(true)
    const added=[]
    for(const f of sel){
      if(f.size>52428800){setError(f.name+' أكبر من 50MB');continue}
      const ext=f.name.split('.').pop()
      const path=folder+'/'+Date.now()+'_'+Math.random().toString(36).slice(2)+'.'+ext
      const{error:er}=await supabase.storage.from(bucket).upload(path,f)
      if(er){setError('خطأ في الرفع: '+er.message);continue}
      const{data}=supabase.storage.from(bucket).getPublicUrl(path)
      added.push({url:data.publicUrl,name:f.name,type:f.type,size:f.size})
    }
    const next=[...files,...added]
    setFiles(next)
    onFilesChange(next.map(x=>x.url))
    setUploading(false)
    if(ref.current)ref.current.value=''
  }

  async function remove(i){
    const f=files[i]
    if(f.url){
      const p=f.url.split('/storage/v1/object/public/'+bucket+'/')[1]
      if(p)await supabase.storage.from(bucket).remove([p])
    }
    const next=files.filter((_,j)=>j!==i)
    setFiles(next)
    onFilesChange(next.map(x=>x.url))
  }

  return(
    <div className="file-uploader">
      <div className="file-uploader-header">
        <span className="file-uploader-label">{label}</span>
        <span className="file-uploader-count">{files.length}/{maxFiles}</span>
      </div>
      {error&&<div className="file-uploader-error">⚠️ {error}</div>}
      <div
        className="file-drop-zone"
        onClick={()=>!uploading&&ref.current&&ref.current.click()}
        onDragOver={e=>e.preventDefault()}
        onDrop={e=>{e.preventDefault();e.dataTransfer&&e.dataTransfer.files&&upload(e.dataTransfer.files)}}
      >
        {uploading
          ?<span className="file-uploading">⏳ جارٍ الرفع...</span>
          :<>
            <span style={{fontSize:'28px'}}>📎</span>
            <span className="file-drop-text">اضغط لرفع ملف أو اسحب وأفلت</span>
            <span className="file-drop-hint">صور • فيديو • PDF — حتى 50MB</span>
          </>
        }
        <input ref={ref} type="file" multiple accept="image/*,video/*,.pdf"
          onChange={e=>upload(e.target.files)} style={{display:'none'}}/>
      </div>
      {files.length>0&&(
        <div className="file-list">
          {files.map((f,i)=>{
            const url=f.url||f
            const name=f.name||url.split('/').pop()
            const isImg=/\.(jpg|jpeg|png|gif|webp)$/i.test(url)||String(f.type).startsWith('image')
            const isVid=/\.(mp4|mov|webm)$/i.test(url)||String(f.type).startsWith('video')
            const isPdf=/\.pdf$/i.test(url)||f.type==='application/pdf'
            return(
              <div key={i} className="file-item">
                {isImg
                  ?<img src={url} alt={name} className="file-preview-img"/>
                  :<div className="file-preview-icon">{isVid?'🎬':isPdf?'📄':'📎'}</div>
                }
                <div className="file-item-info">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="file-item-name">{name}</a>
                  {f.size&&<span className="file-item-size">{fmtSize(f.size)}</span>}
                </div>
                <button className="file-item-remove" onClick={()=>remove(i)}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}