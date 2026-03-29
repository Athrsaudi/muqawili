import FileViewer from '../components/FileViewer';
import FileUploader from '../components/FileUploader';
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ContractorDashboard.css'
const CAT={cladding:'كلادينج',plumbing:'سباكة',electrical:'كهرباء',demolition:'هدم',finishing:'تشطيب',painting:'دهان',flooring:'أرضيات',hvac:'تكييف',general:'عام'}
const ALL_CITIES=['جدة','الرياض','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','حائل','القصيم','نجران','جازان']
// ====== ProfileTab ======
function ProfileTab({user,profile,onUpdate}){
  const[bio,setBio]=useState('')
  const[years,setYears]=useState(0)
  const[avail,setAvail]=useState(true)
  const[workCities,setWorkCities]=useState([])
  const[saving,setSaving]=useState(false)
  const[saved,setSaved]=useState(false)
  const[loadingCities,setLoadingCities]=useState(true)
  // FIX: تحديث القيم عند وصول profile من الداشبورد
  useEffect(()=>{
    if(!profile)return
    setBio(profile.bio||'')
    setYears(profile.years_experience||0)
    setAvail(profile.is_available??true)
    // جلب مدن العمل
    setLoadingCities(true)
    supabase.from('contractor_areas').select('city').eq('contractor_id',profile.id)
      .then(({data})=>{
        setWorkCities((data||[]).map(r=>r.city))
        setLoadingCities(false)
      })
  },[profile?.id])
  function toggleCity(c){
    setWorkCities(prev=>prev.includes(c)?prev.filter(x=>x!==c):[...prev,c])
  }
  async function save(){
    if(workCities.length===0){alert('اختر مدينة عمل واحدة على الأقل');return}
    setSaving(true)
    const{error:e1}=await supabase.from('contractor_profiles')
      .update({bio:bio.trim(),years_experience:years,is_available:avail})
      .eq('user_id',user.id)
    if(e1){alert('حدث خطأ أثناء الحفظ: '+e1.message);
    if (error) { console.error('Profile save error:', error); }setSaving(false);return}
    // حذف المدن القديمة وإضافة الجديدة
    await supabase.from('contractor_areas').delete().eq('contractor_id',profile.id)
    const{error:e2}=await supabase.from('contractor_areas')
      .insert(workCities.map(c=>({contractor_id:profile.id,city:c})))
    if(e2){alert('خطأ في حفظ المدن: '+e2.message);setSaving(false);return}
    setSaving(false);setSaved(true);setTimeout(()=>setSaved(false),2500);onUpdate()
  }
  if(!profile)return <div className='empty-state'>جارٍ التحميل...</div>
  return(
    <div className='profile-form'>
      {saved&&<div className='profile-saved-banner'>✅ تم حفظ التغييرات بنجاح</div>}
      <div className='form-field'><label>الاسم الكامل</label><input value={user?.full_name||''} disabled className='disabled'/></div>
      <div className='form-field'><label>الجوال</label><input value={user?.phone||''} disabled className='disabled'/></div>
      <div className='form-field'><label>مدينة الإقامة</label><input value={user?.city||''} disabled className='disabled'/></div>
      <div className='form-field'>
        <label>مدن العمل <span style={{color:'#64748b',fontSize:'12px'}}>(ستصلك إشعارات الطلبات الجديدة في هذه المدن)</span></label>
        {loadingCities?<div style={{color:'#94a3b8',fontSize:'13px'}}>جارٍ تحميل المدن...</div>:(
          <div className='cities-grid-dark'>
            {ALL_CITIES.map(c=>(
              <button key={c} type='button'
                className={'city-chip-dark '+(workCities.includes(c)?'active':'')}
                onClick={()=>toggleCity(c)}>
                {workCities.includes(c)?'✓ ':''}{c}
              </button>
            ))}
          </div>
        )}
        {workCities.length>0&&<p style={{fontSize:'12px',color:'#3b82f6',marginTop:'6px'}}>{workCities.length} مدينة مختارة</p>}
      </div>
      <div className='form-field'><label>نبذة عنك</label><textarea rows={4} value={bio} onChange={e=>setBio(e.target.value)} placeholder='اكتب نبذة مختصرة عن خبرتك...'/></div>
      <div className='form-field'><label>سنوات الخبرة</label><input type='number' value={years} onChange={e=>setYears(Number(e.target.value))} min={0} max={50}/></div>
      <div className='form-field form-toggle'><label>متاح للعمل</label><button className={'toggle-btn '+(avail?'on':'off')} onClick={()=>setAvail(!avail)}>{avail?'نعم':'لا'}</button></div>
      <button className='save-btn' onClick={save} disabled={saving}>{saving?'جارِ الحفظ...':'حفظ التغييرات'}</button>
    </div>
  )
}
// ====== PortfolioTab ======
function PortfolioTab({contractorId}){
  const[items,setItems]=useState([])
  const[loading,setLoading]=useState(true)
  const[showForm,setShowForm]=useState(false)
  const[title,setTitle]=useState('')
  const[desc,setDesc]=useState('')
  const[imgUrl,setImgUrl]=useState('')
  const[saving,setSaving]=useState(false)
  const[err,setErr]=useState('')
  const[uploadedFiles,setUploadedFiles]=useState([])
  useEffect(()=>{if(contractorId)load()},[contractorId])
  async function load(){
    const{data}=await supabase.from('contractor_portfolio').select('*').eq('contractor_id',contractorId).order('created_at',{ascending:false})
    setItems(data||[]);setLoading(false)
  }
  async function add(){
    setErr('')
    if(!title.trim()){setErr('أدخل عنوان العمل');return}
    if(uploadedFiles.length===0){setErr('أرفق صورة أو ملف واحد على الأقل');return}
    setSaving(true)
    const{error}=await supabase.from('contractor_portfolio').insert({contractor_id:contractorId,title:title.trim(),description:desc.trim()||null,image_url: uploadedFiles[0] || imgUrl.trim(), files: uploadedFiles})
    setSaving(false)
    if(error){setErr('حدث خطأ: '+error.message);return}
    setTitle('');setDesc('');setImgUrl('');setUploadedFiles([]);setShowForm(false);load()
  }
  async function del(id){if(!confirm('حذف هذا العمل?'))return;await supabase.from('contractor_portfolio').delete().eq('id',id);load()}
  if(loading)return <div className='empty-state'>جارٍ التحميل...</div>
  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
        <span style={{color:'#94a3b8',fontSize:'14px'}}>{items.length} عمل</span>
        <button className='add-portfolio-btn' onClick={()=>setShowForm(!showForm)}>{showForm?'إلغاء':'+ إضافة عمل جديد'}</button>
      </div>
      {showForm&&(
        <div className='portfolio-add-form'>
          <div className='field'><label>عنوان العمل *</label><input type='text' placeholder='مثال: تركيب كلادينج' value={title} onChange={e=>setTitle(e.target.value)}/></div>
          <div className='field'><label>وصف العمل</label><textarea rows={2} value={desc} onChange={e=>setDesc(e.target.value)}/></div>
          <FileUploader
            bucket="portfolio-images"
            folder={profile?.id || 'portfolio'}
            label="صور وفيديوهات العمل *"
            maxFiles={8}
            existingFiles={uploadedFiles}
            onFilesChange={(urls) => setUploadedFiles(urls)}
          />