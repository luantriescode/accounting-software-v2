import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8002`
//const API = 'http://127.0.0.1:8002'
//const API = 'http://0.0.0.0:8002'
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n||0))
const fmtN = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n||0))
const fmtDate = (d) => { if(!d) return '-'; try{ const p=d.split('T')[0].split('-'); return `${p[2]}/${p[1]}/${p[0]}` }catch{ return d } }
const today = () => new Date().toISOString().slice(0,10)

const genSoCT = (prefix, list, field='SoCT') => {
  const ym = new Date().toISOString().slice(0,7).replace('-','')
  const existing = (list||[]).filter(r => (r[field]||r.so_chung_tu||'').startsWith(`${prefix}-${ym}`))
  const maxNum = existing.reduce((mx, r) => {
    const parts = (r[field]||r.so_chung_tu||'').split('-')
    const n = parseInt(parts[parts.length-1]) || 0
    return n > mx ? n : mx
  }, 0)
  return `${prefix}-${ym}-${String(maxNum+1).padStart(3,'0')}`
}

// Hook load kỳ kế toán từ API - dùng chung toàn app
const useKyKeToan = () => {
  const [kyList, setKyList] = useState([])
  useEffect(() => {
    api('GET', '/categories/ky-ke-toan').then(d => {
      if (Array.isArray(d) && d.length) setKyList(d)
    })
  }, [])

  // Tìm kỳ tháng hiện tại, fallback về kỳ đầu tiên trong DB
  const currentMonth = new Date().toISOString().slice(0, 7) // "2026-05"
  const currentKy = kyList.find(k => k.NgayBatDau?.slice(0, 7) === currentMonth)
  const firstKy = kyList[0]

  const options = kyList.length
    ? kyList.map(k => ({ value: k.id, label: `${k.TenKy} (${k.NgayBatDau?.slice(0,7)})` }))
    : []

  // defaultKy luôn lấy từ DB — không bao giờ hardcode số
  const defaultKy = currentKy?.id || firstKy?.id || null

  return { kyList, options, defaultKy }
}

const api = async (method, path, body) => {
  try {
    const r = await fetch(API+path, { method, headers:{'Content-Type':'application/json'}, body:body?JSON.stringify(body):undefined })
    if(!r.ok){
      let msg='Lỗi server'
      try{ const e=await r.json(); msg=e.detail||JSON.stringify(e)||msg }catch(_){}
      console.error('API Error ['+method+' '+path+']:', msg)
      return {__error:true, message:msg}
    }
    return await r.json()
  } catch(e){
    const msg=e.message||'Không kết nối được backend'
    console.error('API Error ['+method+' '+path+']:', msg)
    return {__error:true, message:msg}
  }
}
const isErr=r=>!r||r.__error===true

// ══ UI BASE
const Card=({children,className=''})=><div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>{children}</div>
const CH=({children,className=''})=><div className={`px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap ${className}`}>{children}</div>
const CB=({children,className=''})=><div className={`p-4 ${className}`}>{children}</div>
const CF=({children})=><div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 rounded-b-lg">{children}</div>

const Btn=({children,v='primary',size='md',onClick,disabled,className=''})=>{
  const V={primary:'bg-blue-600 text-white hover:bg-blue-700',success:'bg-green-600 text-white hover:bg-green-700',
    danger:'bg-red-600 text-white hover:bg-red-700',outline:'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    ghost:'text-gray-600 hover:bg-gray-100',excel:'bg-green-700 text-white hover:bg-green-800',pdf:'bg-red-700 text-white hover:bg-red-800',
    warning:'bg-yellow-500 text-white hover:bg-yellow-600'}
  const S={md:'px-3 py-1.5 text-sm',sm:'px-2 py-1 text-xs',lg:'px-4 py-2 text-sm'}
  return <button onClick={onClick} disabled={disabled}
    className={`rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${V[v]} ${S[size]} disabled:opacity-50 ${className}`}>{children}</button>
}

const Badge=({children,v='gray'})=>{
  const V={success:'bg-green-100 text-green-800',warning:'bg-yellow-100 text-yellow-800',danger:'bg-red-100 text-red-800',primary:'bg-blue-100 text-blue-800',gray:'bg-gray-100 text-gray-800'}
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${V[v]}`}>{children}</span>
}

const Inp=({label,req,error,hint,className='',...p})=>(
  <div className="flex flex-col gap-1">
    {label&&<label className="text-xs font-semibold text-gray-600">{label}{req&&<span className="text-red-500 ml-0.5">*</span>}</label>}
    {hint&&<span className="text-xs text-blue-500">{hint}</span>}
    <input className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error?'border-red-400':''} ${className}`} {...p}/>
    {error&&<span className="text-xs text-red-500">{error}</span>}
  </div>
)

const Sel=({label,req,options=[],className='',...p})=>(
  <div className="flex flex-col gap-1">
    {label&&<label className="text-xs font-semibold text-gray-600">{label}{req&&<span className="text-red-500 ml-0.5">*</span>}</label>}
    <select className={`px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${className}`} {...p}>
      <option value="">-- Chọn --</option>
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  </div>
)

const Modal=({open,onClose,title,children,size='md'})=>{
  if(!open) return null
  const W={sm:'max-w-md',md:'max-w-xl',lg:'max-w-3xl',xl:'max-w-5xl'}
  return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-white rounded-xl shadow-xl w-full ${W[size]} max-h-[90vh] overflow-y-auto`} onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-base font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

const Tabs=({tabs,active,onChange})=>(
  <div className="flex gap-1 border-b border-gray-200 mb-4">
    {tabs.map(t=>(
      <button key={t.id} onClick={()=>onChange(t.id)}
        className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${active===t.id?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
        {t.label}
      </button>
    ))}
  </div>
)

const Alert=({msg,type='success',onClose})=>{
  if(!msg) return null
  const S={success:'bg-green-50 border-green-400 text-green-800',danger:'bg-red-50 border-red-400 text-red-800',
    info:'bg-blue-50 border-blue-400 text-blue-800',warning:'bg-yellow-50 border-yellow-400 text-yellow-800'}
  const I={success:'✅',danger:'❌',info:'ℹ️',warning:'⚠️'}
  return(
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] min-w-[320px] max-w-[500px] shadow-lg animate-bounce-in"
      style={{animation:'slideDown 0.3s ease-out'}}>
      <div className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg border-2 text-sm ${S[type]}`}>
        <span className="flex-1 font-medium">{I[type]} {msg}</span>
        {onClose&&<button onClick={onClose} className="opacity-60 hover:opacity-100 flex-shrink-0 text-lg leading-none">✕</button>}
      </div>
    </div>
  )
}

const Empty=({msg='Chưa có dữ liệu'})=>(
  <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-3">📭</div><p className="text-sm">{msg}</p></div>
)
const Loading=()=>(
  <div className="text-center py-12"><div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"/></div>
)

const Tbl=({cols,data,loading,empty})=>(
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50 border-b-2 border-gray-200">
        <tr>{cols.map(c=><th key={c.k} className={`px-3 py-2.5 text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap ${c.r?'text-right':'text-left'}`} style={{width:c.w}}>{c.l}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {loading?<tr><td colSpan={cols.length}><Loading/></td></tr>
        :!data.length?<tr><td colSpan={cols.length}><Empty msg={empty}/></td></tr>
        :data.map((row,i)=>(
          <tr key={i} className="hover:bg-blue-50/30 transition-colors">
            {cols.map(c=><td key={c.k} className={`px-3 py-2.5 ${c.r?'text-right font-mono text-xs':''}`}>
              {c.fn?c.fn(row[c.k],row,i):(row[c.k]??'-')}
            </td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

const Code=({v})=><code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{v||'-'}</code>
const StatusBadge=({v})=><Badge v={v?'success':'gray'}>{v?'Dùng':'Ngừng'}</Badge>

const useAlert=()=>{
  const [alert,setAlert]=useState(null)
  const show=(msg,type='success')=>{ setAlert({msg,type}); setTimeout(()=>setAlert(null),6000) }
  return [alert,show,()=>setAlert(null)]
}

const useList=(path)=>{
  const [data,setData]=useState([]); const [loading,setLoading]=useState(true)
  const load=async()=>{setLoading(true);const d=await api('GET',path);setData(Array.isArray(d)?d:[]);setLoading(false)}
  useEffect(()=>{load()},[path])
  return [data,loading,load]
}

const useSearch=(data,keys)=>{
  const [q,setQ]=useState('')
  const filtered=data.filter(r=>!q||keys.some(k=>String(r[k]||'').toLowerCase().includes(q.toLowerCase())))
  return [filtered,q,setQ]
}

// ══ NAV DATA
const NAV=[
  {id:'dashboard',label:'Tổng Quan',icon:'🏠'},
  {id:'system',label:'Khai Báo Hệ Thống',icon:'⚙️',sub:[
    {id:'sys-company',label:'Thông Tin Doanh Nghiệp'},{id:'sys-fiscal',label:'Khai Báo Năm Tài Chính'},
    {id:'sys-currency',label:'Danh Mục Ngoại Tệ'},{id:'sys-doctype',label:'Khai Báo Mẫu Chứng Từ'},
    {id:'sys-params',label:'Thiết Lập Tham Số'},{id:'sys-renum',label:'Đánh Lại Số Chứng Từ'},
    {id:'sys-repost',label:'Ghi Lại Chứng Từ'},{id:'sys-users',label:'Danh Sách Người Dùng'},
  ]},
  {id:'catalog',label:'Danh Mục',icon:'📋',sub:[
    {id:'dm-customers',label:'Khách Hàng'},{id:'dm-suppliers',label:'Nhà Cung Cấp'},
    {id:'dm-products',label:'Vật Tư / Hàng Hóa'},{id:'dm-warehouse',label:'Danh Mục Kho'},
    {id:'dm-unit',label:'Đơn Vị Tính'},{id:'dm-transaction-type',label:'Loại Giao Dịch'},{id:'dm-product-group',label:'Nhóm Vật Tư HH'},
    {id:'dm-price',label:'Danh Mục Giá Bán'},{id:'dm-fund',label:'Danh Mục Quỹ'},
    {id:'dm-costitem',label:'Khoản Mục Phí'},{id:'dm-taxgroup',label:'Nhóm Ngành Thuế'},
    {id:'dm-invoice-template',label:'Mẫu Hóa Đơn'},{id:'dm-lot',label:'Danh Mục Lô'},
    {id:'dm-contract',label:'Hợp Đồng'},{id:'dm-bom',label:'Định Mức Thành Phẩm'},
    {id:'dm-employees',label:'Nhân Viên'},{id:'dm-accounts',label:'Tài Khoản Kế Toán'},
    {id:'dm-periods',label:'Kỳ Kế Toán'},
  ]},
  {id:'opening',label:'Số Dư',icon:'💰',sub:[
    {id:'ob-inventory',label:'Tồn Kho Vật Tư HH'},{id:'ob-fund',label:'Số Dư Quỹ'},
    {id:'ob-tax',label:'Nghĩa Vụ Thuế NSNN'},{id:'ob-payroll',label:'Lương - Bảo Hiểm'},
    {id:'ob-debt',label:'Công Nợ'},{id:'ob-transfer-stock',label:'Chuyển Tồn Kho Sang Năm'},
    {id:'ob-transfer-balance',label:'Chuyển Số Dư Sang Năm'},
  ]},
  {id:'operations',label:'Nghiệp Vụ',icon:'📊',sub:[
    {id:'nv-pt',label:'Phiếu Thu'},{id:'nv-pc',label:'Phiếu Chi'},
    {id:'nv-ttg',label:'Báo Có - Thu Tiền Gửi'},{id:'nv-ctg',label:'Báo Nợ - Chi Tiền Gửi'},
    {id:'nv-pnm',label:'Phiếu Nhập Mua'},{id:'nv-pbh',label:'Phiếu Bán Hàng'},
    {id:'nv-bl',label:'Phiếu Bán Lẻ'},{id:'nv-pnk',label:'Phiếu Nhập Kho'},
    {id:'nv-pxk',label:'Phiếu Xuất Kho'},{id:'nv-htk',label:'Tính Giá Tồn Kho'},
    {id:'nv-payroll',label:'Thanh Toán Lương'},{id:'nv-payroll-config',label:'Cấu Hình Bảo Hiểm'},
  ]},
  {id:'reports',label:'Báo Cáo',icon:'📈',sub:[
    {id:'rpt-tonkho',label:'Báo Cáo Tồn Kho HTK'},{id:'rpt-nhapxuat',label:'Nhập Xuất Tồn'},
    {id:'rpt-bank',label:'Số Dư TK NH'},{id:'rpt-ttg-ctg',label:'Sổ TTG / CTG'},
    {id:'rpt-payroll',label:'Bảng Lương'},{id:'rpt-debt',label:'Báo Cáo Công Nợ'},
  ]},
]

const BREAD={
  dashboard:[],'sys-company':['Hệ Thống','Thông Tin DN'],'sys-fiscal':['Hệ Thống','Năm Tài Chính'],
  'sys-currency':['Hệ Thống','Ngoại Tệ'],'sys-doctype':['Hệ Thống','Mẫu CT'],
  'sys-params':['Hệ Thống','Tham Số'],'sys-renum':['Hệ Thống','Đánh Lại Số'],
  'sys-repost':['Hệ Thống','Ghi Lại CT'],'sys-users':['Hệ Thống','Người Dùng'],
  'dm-customers':['Danh Mục','Khách Hàng'],'dm-suppliers':['Danh Mục','Nhà Cung Cấp'],
  'dm-products':['Danh Mục','Vật Tư HH'],'dm-warehouse':['Danh Mục','Kho'],
  'dm-unit':['Danh Mục','ĐVT'],'dm-price':['Danh Mục','Giá Bán'],
  'dm-fund':['Danh Mục','Quỹ'],'dm-costitem':['Danh Mục','Khoản Mục Phí'],
  'dm-taxgroup':['Danh Mục','Nhóm Thuế'],'dm-invoice-template':['Danh Mục','Mẫu HĐ'],
  'dm-lot':['Danh Mục','Lô'],'dm-contract':['Danh Mục','Hợp Đồng'],
  'dm-bom':['Danh Mục','Định Mức'],'dm-employees':['Danh Mục','Nhân Viên'],
  'dm-accounts':['Danh Mục','TK Kế Toán'],'dm-periods':['Danh Mục','Kỳ KT'],
  'dm-product-group':['Danh Mục','Nhóm VT HH'],
  'ob-inventory':['Số Dư','Tồn Kho'],'ob-fund':['Số Dư','Quỹ'],
  'ob-tax':['Số Dư','Thuế NSNN'],'ob-payroll':['Số Dư','Lương BH'],
  'ob-debt':['Số Dư','Công Nợ'],'ob-transfer-stock':['Số Dư','Chuyển Tồn Kho'],
  'ob-transfer-balance':['Số Dư','Chuyển Số Dư'],
  'nv-pt':['Nghiệp Vụ','Phiếu Thu'],'nv-pc':['Nghiệp Vụ','Phiếu Chi'],
  'nv-ttg':['Nghiệp Vụ','TTG'],'nv-ctg':['Nghiệp Vụ','CTG'],
  'nv-pnm':['Nghiệp Vụ','Phiếu Nhập Mua'],'nv-pbh':['Nghiệp Vụ','Phiếu Bán Hàng'],
  'nv-bl':['Nghiệp Vụ','Phiếu Bán Lẻ'],'nv-pnk':['Nghiệp Vụ','Phiếu Nhập Kho'],
  'nv-pxk':['Nghiệp Vụ','Phiếu Xuất Kho'],'nv-htk':['Nghiệp Vụ','Tính Giá HTK'],
  'nv-payroll':['Nghiệp Vụ','Thanh Toán Lương'],'nv-payroll-config':['Nghiệp Vụ','Cấu Hình BH'],
  'rpt-tonkho':['Báo Cáo','Tồn Kho HTK'],'rpt-nhapxuat':['Báo Cáo','Nhập Xuất Tồn'],
  'rpt-bank':['Báo Cáo','Số Dư NH'],'rpt-ttg-ctg':['Báo Cáo','Sổ TTG/CTG'],
  'rpt-payroll':['Báo Cáo','Bảng Lương'],'rpt-debt':['Báo Cáo','Công Nợ'],
}

const Sidebar=({page,onNav,open:sidebarOpen=true})=>{
  const [open,setOpen]=useState({system:true})
  return(
    <aside className={`fixed left-0 top-0 w-[260px] h-screen bg-[#0f1923] flex flex-col z-50 transition-transform duration-300 ${sidebarOpen?'translate-x-0':'-translate-x-full'}`}>
      <div className="h-[52px] px-4 flex items-center gap-3 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-base flex-shrink-0">📊</div>
        <div><div className="text-white text-xs font-bold">ACCOUNTING-APP</div><div className="text-white/40 text-[10px]">V2.0 | Hộ Kinh Doanh</div></div>
      </div>
      <nav className="flex-1 overflow-y-auto py-2" style={{scrollbarWidth:'thin',scrollbarColor:'rgba(255,255,255,0.1) transparent'}}>
        {NAV.map(m=>(
          <div key={m.id}>
            <button onClick={()=>m.sub?setOpen(o=>({...o,[m.id]:!o[m.id]})):onNav(m.id)}
              className={`w-[calc(100%-8px)] mx-1 flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all ${page===m.id?'bg-blue-600 text-white':open[m.id]?'bg-white/[0.07] text-white':'text-white/65 hover:bg-white/[0.07] hover:text-white'}`}>
              <span className="w-5 text-center text-base flex-shrink-0">{m.icon}</span>
              <span className="flex-1 text-left truncate">{m.label}</span>
              {m.sub&&<span className={`text-white/35 text-xs transition-transform duration-200 ${open[m.id]?'rotate-90':''}`}>›</span>}
            </button>
            {m.sub&&open[m.id]&&(
              <div className="ml-4 pl-3 border-l border-white/10 mt-0.5 mb-1">
                {m.sub.map(c=>(
                  <button key={c.id} onClick={()=>onNav(c.id)}
                    className={`w-full text-left px-3 py-1.5 rounded text-[12px] transition-all block mb-px ${page===c.id?'bg-blue-600 text-white font-semibold':'text-white/50 hover:bg-white/[0.07] hover:text-white'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      <div className="px-4 py-2 border-t border-white/10 text-center text-[10px] text-white/30 flex-shrink-0">© MrLuan Accounting-App HKD</div>
    </aside>
  )
}

const Topbar=({page, onNav, onToggleSidebar, sidebarOpen})=>{
  const c=BREAD[page]||[]
  const groupFirstPage={
    'Khai Báo Hệ Thống':'sys-company',
    'Danh Mục':'dm-customers',
    'Số Dư':'ob-cash',
    'Nghiệp Vụ':'nv-pt',
    'Báo Cáo':'rpt-tonkho',
  }
  return(
    <div className={`fixed top-0 right-0 h-[52px] bg-white border-b border-gray-200 flex items-center px-4 gap-3 z-40 transition-all duration-300 ${sidebarOpen?'left-[260px]':'left-0'}`}>
      {/* Nút ☰ toggle sidebar */}
      <button onClick={onToggleSidebar}
        className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="2" y1="4" x2="16" y2="4"/>
          <line x1="2" y1="9" x2="16" y2="9"/>
          <line x1="2" y1="14" x2="16" y2="14"/>
        </svg>
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <button onClick={()=>onNav('dashboard')}
          className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
          Trang Chủ
        </button>
        {c.map((x,i)=>(
          <React.Fragment key={i}>
            <span className="text-gray-300 mx-0.5">/</span>
            {i===c.length-1
              ?<span className="font-semibold text-gray-900">{x}</span>
              :groupFirstPage[x]
                ?<button onClick={()=>onNav(groupFirstPage[x])}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors">
                    {x}
                  </button>
                :<span className="text-gray-400">{x}</span>
            }
          </React.Fragment>
        ))}
      </div>

      {/* Right side — giữ nguyên */}
      <div className="ml-auto flex items-center gap-3">
        <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700">📅 Tháng 4/2026</span>
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">A</div>
      </div>
    </div>
  )
}
const ComboSelect=({value,onChange,items=[],placeholder='-- Chọn --',onRequestCreate})=>{
  const [query,setQuery]=useState('')
  const [open,setOpen]=useState(false)
  const ref=React.useRef(null)

  // Đóng dropdown khi click ngoài
  useEffect(()=>{
    const handler=e=>{if(ref.current&&!ref.current.contains(e.target)) setOpen(false)}
    document.addEventListener('mousedown',handler)
    return()=>document.removeEventListener('mousedown',handler)
  },[])

  const selectedItem=items.find(i=>String(i.id)===String(value))

  const filtered=query
    ?items.filter(i=>{
        const q=query.toLowerCase()
        return (i.code||'').toLowerCase().includes(q)||(i.name||'').toLowerCase().includes(q)
      })
    :items.slice(0,50) // giới hạn 50 khi chưa gõ

  const displayText=open?query:(selectedItem?`${selectedItem.code} - ${selectedItem.name}`:'')

  return(
    <div ref={ref} className="relative w-full">
      <input
        value={displayText}
        onChange={e=>{setQuery(e.target.value);setOpen(true)}}
        onFocus={()=>{setQuery('');setOpen(true)}}
        placeholder={selectedItem?`${selectedItem.code} - ${selectedItem.name}`:placeholder}
        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-400"
      />
      {open&&<div className="absolute z-50 left-0 top-full mt-0.5 w-64 bg-white border border-gray-200 rounded shadow-lg max-h-48 overflow-y-auto">
        {filtered.length===0&&!query&&<div className="px-3 py-2 text-xs text-gray-400">Gõ để tìm kiếm...</div>}
        {filtered.map(i=>(
          <div key={i.id}
            onMouseDown={()=>{onChange(i.id,i);setQuery('');setOpen(false)}}
            className={`px-3 py-2 text-xs cursor-pointer hover:bg-blue-50 ${String(i.id)===String(value)?'bg-blue-100 font-semibold':''}`}>
            <span className="font-mono text-gray-500 mr-1">{i.code}</span>
            <span>{i.name}</span>
          </div>
        ))}
        {/* Dòng tạo mới — hiện khi gõ và không tìm thấy chính xác */}
        {query&&filtered.length===0&&onRequestCreate&&(
          <div
            onMouseDown={()=>{onRequestCreate(query);setOpen(false)}}
            className="px-3 py-2 text-xs cursor-pointer bg-green-50 hover:bg-green-100 text-green-700 font-semibold border-t border-green-200">
            ✨ Tạo mới "{query}"
          </div>
        )}
        {query&&filtered.length>0&&onRequestCreate&&(
          <div
            onMouseDown={()=>{onRequestCreate(query);setOpen(false)}}
            className="px-3 py-2 text-xs cursor-pointer bg-green-50 hover:bg-green-100 text-green-700 font-semibold border-t border-green-200">
            ✨ Tạo mới "{query}"
          </div>
        )}
      </div>}
    </div>
  )
}
const CreateProductModal=({open,onClose,onCreated,initialName='',units=[],existingCodes=[]})=>{
  const [form,setForm]=useState({MaHH:'',TenHH:'',DVT:'',DanhMuc:'',GiaBan:0,TonKhoToiThieu:10})
  const [saving,setSaving]=useState(false)
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  // Auto-sinh mã SP khi mở
  useEffect(()=>{
    if(!open) return
    // Tìm số lớn nhất từ các mã SP dạng SPxxx
    const maxNum=(existingCodes||[]).reduce((mx,code)=>{
      const m=String(code||'').match(/^SP(\d+)$/)
      return m?Math.max(mx,+m[1]):mx
    },0)
    const autoCode=`SP${String(maxNum+1).padStart(3,'0')}`
    const dvt=units.length?(units[0].name||units[0].code||'Cái'):'Cái'
    setForm({MaHH:autoCode,TenHH:initialName,DVT:dvt,DanhMuc:'',GiaBan:0,TonKhoToiThieu:10})
  },[open,initialName,existingCodes])

  const unitOptions=units.filter(u=>u.is_active!==false).map(u=>({value:u.name||u.code,label:`${u.code} - ${u.name}`}))
  if(!unitOptions.length) unitOptions.push(
    {value:'Cái',label:'Cái'},{value:'Kg',label:'Kg'},
    {value:'Lít',label:'Lít'},{value:'Hộp',label:'Hộp'},{value:'Thùng',label:'Thùng'}
  )

  const save=async()=>{
    if(!form.MaHH||!form.TenHH){showAlert('Vui lòng nhập Mã HH và Tên HH!','danger');return}
    setSaving(true)
    const r=await api('POST','/products',{...form,GiaBan:+form.GiaBan,TonKhoToiThieu:+form.TonKhoToiThieu,ConHoatDong:true})
    setSaving(false)
    if(r&&!r.__error){
      onCreated(r)  // trả SP mới về cho caller
      onClose()
    } else showAlert('Lỗi: '+(r?.message||'Mã HH đã tồn tại hoặc lỗi server'),'danger')
  }

  if(!open) return null
  return(
    <Modal open={open} onClose={onClose} title="📦 Tạo Sản Phẩm Mới">
      {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã HH" req value={form.MaHH} onChange={sf('MaHH')} hint="Tự sinh, có thể sửa"/>
        <Inp label="Tên HH" req value={form.TenHH} onChange={sf('TenHH')}/>
        <Sel label="Đơn Vị Tính" req value={form.DVT} onChange={sf('DVT')} options={unitOptions}/>
        <Inp label="Danh Mục" value={form.DanhMuc} onChange={sf('DanhMuc')}/>
        <Inp label="Giá Bán" type="number" value={form.GiaBan} onChange={sf('GiaBan')}/>
        <Inp label="Tồn Tối Thiểu" type="number" value={form.TonKhoToiThieu} onChange={sf('TonKhoToiThieu')}/>
      </div>
      {!units.length&&<p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mt-3">
        ⚠️ Chưa có đơn vị tính — vào <b>Danh Mục → Đơn Vị Tính</b> để thêm trước.
      </p>}
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={onClose}>Hủy</Btn>
        <Btn onClick={save} disabled={saving}>{saving?'Đang lưu...':'💾 Tạo & Dùng Ngay'}</Btn>
      </div>
    </Modal>
  )
}
// ══ DETAIL TABLE for invoices
const DetailTbl=({rows,setRows,products,warehouses=[],color='blue',hasTax=false,hasWarehouse=false,warehouseLabel='Kho',units=[],onProductCreated=null})=>{
  const addRow=()=>setRows(r=>[...r,{product_id:'',quantity:1,unit_price:0,tax_rate:0,warehouse_id:''}])
  const upd=(i,k,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,[k]:v}:r))
  const del=(i)=>setRows(rs=>rs.filter((_,ri)=>ri!==i))
  const [createProdModal,setCreateProdModal]=useState(false)
  const [createProdForRow,setCreateProdForRow]=useState(null)
  const [createProdInitName,setCreateProdInitName]=useState('')

  const applyWarehouseDown=(i,whId)=>{
    if(!whId) return
    setRows(rs=>rs.map((r,ri)=>ri>=i?{...r,warehouse_id:whId}:r))
  }

  const tax=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price)*((+r.tax_rate||0)/100),0)

  return(<>
    <div className="border border-gray-200 rounded-lg overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead className={`bg-${color}-50`}><tr>
          <th className={`px-3 py-2 text-left text-xs font-bold text-${color}-700 w-44`}>Mã / Tên Hàng Hóa</th>
          {hasWarehouse&&<th className={`px-3 py-2 text-left text-xs font-bold text-${color}-700 w-36`}>
            {warehouseLabel}
            <span className="ml-1 text-gray-400 font-normal text-xs">(⬇ áp xuống)</span>
          </th>}
          <th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-24`}>SL</th>
          <th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-32`}>Đơn Giá</th>
          <th className="px-2 py-2 text-right text-xs font-bold text-orange-500 w-24">CPMH</th>
          <th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-32`}>Thành Tiền</th>
          {hasTax&&<th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-20`}>%Thuế</th>}
          {hasTax&&<th className={`px-3 py-2 text-right text-xs font-bold text-orange-500 w-32`}>Tiền Thuế</th>}
          <th className="w-8"></th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r,i)=>(
            <tr key={i}>
              <td className="px-2 py-1.5">
                <ComboSelect
                  value={r.product_id||''}
                  onChange={(id,item)=>{
                    upd(i,'product_id',id)
                    if(item) upd(i,'unit_price',item.GiaBan||item.unit_price||0)
                  }}
                  items={products.map(p=>({
                    id:p.id||p.MaHH,
                    code:p.MaHH||p.code||'',
                    name:p.TenHH||p.name||'',
                    GiaBan:p.GiaBan||p.unit_price||0
                  }))}
                  placeholder="-- Tìm SP --"
                  onRequestCreate={onProductCreated?(name=>{
                    setCreateProdForRow(i)
                    setCreateProdInitName(name)
                    setCreateProdModal(true)
                  }):null}
                />
              </td>
              {hasWarehouse&&<td className="px-2 py-1.5">
                <div className="flex items-center gap-1">
                  <select value={r.warehouse_id||''} onChange={e=>upd(i,'warehouse_id',e.target.value)}
                    className={`flex-1 px-2 py-1 border rounded text-xs focus:outline-none ${r.warehouse_id?'border-gray-300':'border-orange-300 bg-orange-50'}`}>
                    <option value="">--</option>
                    {warehouses.map(w=><option key={w.id} value={w.id}>{w.MaKho||w.code}</option>)}
                  </select>
                  {r.warehouse_id&&i<rows.length-1&&(
                    <button
                      title={`Áp dụng ${warehouses.find(w=>String(w.id)===String(r.warehouse_id))?.MaKho||'kho này'} cho ${rows.length-1-i} dòng phía dưới`}
                      onClick={()=>applyWarehouseDown(i+1,r.warehouse_id)}
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-bold transition-colors"
                    >⬇</button>
                  )}
                </div>
              </td>}
              <td className="px-2 py-1.5">
                <input type="number" min="0" value={r.quantity}
                  onChange={e=>upd(i,'quantity',+e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
              </td>
              <td className="px-2 py-1.5">
                <input type="number" min="0" value={r.unit_price}
                  onChange={e=>upd(i,'unit_price',+e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-sm text-orange-500">
                {fmtN(r.chi_phi_phan_bo||0)}
              </td>
              <td className="px-2 py-1.5 text-right font-mono text-sm font-semibold">
                {fmtN((+r.quantity)*(+r.unit_price)+(+r.chi_phi_phan_bo||0))}
              </td>
              {hasTax&&<td className="px-2 py-1.5">
                <input type="number" min="0" max="100" value={r.tax_rate||0}
                  onChange={e=>upd(i,'tax_rate',+e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
              </td>}
              {hasTax&&<td className="px-3 py-1.5 text-right font-mono text-xs text-orange-600">
                {fmtN((+r.quantity)*(+r.unit_price)*((+r.tax_rate||0)/100))}
              </td>}
              <td className="px-2 py-1.5 text-center">
                <button onClick={()=>del(i)} className="text-red-400 hover:text-red-600 text-base">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
          <tr>
            <td colSpan={hasTax?(hasWarehouse?5:4):(hasWarehouse?4:3)} className="px-3 py-2 text-sm font-bold text-blue-700">Tạm Tính:</td>
            <td className="px-2 py-2 text-right font-mono font-bold text-orange-500">
              {fmt(rows.reduce((s,r)=>s+(+r.chi_phi_phan_bo||0),0))}
            </td>
            <td className="px-2 py-2 text-right font-mono font-bold text-blue-700 text-base">
              {fmt(rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0))}
            </td>
            {hasTax&&<td></td>}
            {hasTax&&<td className="px-2 py-2 text-right font-mono font-bold text-orange-600">{fmt(tax)}</td>}
            <td></td>
          </tr>
          {hasTax&&<tr>
            <td colSpan={6} className="px-3 py-2 text-right font-bold text-blue-700">
              Tổng Thanh Toán: <span className="font-mono text-base ml-2">
                {fmt(rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price)+(+r.chi_phi_phan_bo||0),0)
                  +rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price)*((+r.tax_rate||0)/100),0))}
              </span>
            </td>
          </tr>}
        </tfoot>
      </table>
      <div className="p-2">
        <button onClick={addRow}
          className={`px-3 py-1.5 bg-${color}-50 text-${color}-700 rounded text-xs font-semibold hover:bg-${color}-100`}>
          + Thêm Dòng
        </button>
      </div>
    </div>
    {onProductCreated&&<CreateProductModal
      open={createProdModal}
      onClose={()=>{setCreateProdModal(false);setCreateProdForRow(null)}}
      initialName={createProdInitName}
      units={units}
      existingCodes={products.map(p=>p.MaHH||p.code||'')}
      onCreated={(newProd)=>{
        if(createProdForRow!==null){
          upd(createProdForRow,'product_id',newProd.id||newProd.MaHH)
          upd(createProdForRow,'unit_price',newProd.GiaBan||newProd.unit_price||0)
        }
        onProductCreated(newProd)
        setCreateProdModal(false)
        setCreateProdForRow(null)
      }}
    />}
  </>)
}


// ══ EXCEL EXPORT UTILITY (dùng SheetJS)
const exportExcel = async (filename, sheetName, headers, rows) => {
  try {
    // Load SheetJS
    if (!window.XLSX) {
      await new Promise((res, rej) => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
        s.onload = res; s.onerror = rej
        document.head.appendChild(s)
      })
    }
    const XLSX = window.XLSX
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
    // Auto column width
    const colWidths = headers.map((h,i) => ({wch: Math.max(h.length+2, ...rows.map(r=>String(r[i]||'').length+1))}))
    ws['!cols'] = colWidths
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    XLSX.writeFile(wb, `${filename}.xlsx`)
  } catch(e) { alert('Lỗi xuất Excel: ' + e.message) }
}

// ══ DANH MỤC GIÁ BÁN (load từ products API)
const PriceList = () => {
  const [products, setProducts] = useState([])
  const [rows, setRows] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ product_id: '', ngay_ap_dung: today(), gia_ban: 0, nt: 'VND' })
  const [alert, showAlert, closeAlert] = useAlert()
  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    api('GET', '/products').then(d => {
      if (Array.isArray(d)) setProducts(d)
    })
  }, [])

  const getProduct = id => products.find(p => p.id == id || p.code == id)

  const addRow = () => {
    const p = getProduct(form.product_id)
    if (!p) { showAlert('Vui lòng chọn sản phẩm!', 'danger'); return }
    setRows(r => [...r, {
      ngay: form.ngay_ap_dung,
      ma: p.code || p.MaHH || '',
      ten: p.name || p.TenHH || '',
      dvt: p.unit || p.DVT || '',
      gia: +form.gia_ban || p.unit_price || p.GiaBan || 0,
      nt: form.nt,
    }])
    showAlert('Thêm thành công!')
    setModal(false)
    setForm({ product_id: '', ngay_ap_dung: today(), gia_ban: 0, nt: 'VND' })
  }

  const doExport = () => {
    exportExcel('DanhMucGiaBan', 'Giá Bán',
      ['Ngày Áp Dụng', 'Mã Hàng', 'Tên Vật Tư', 'ĐVT', 'Giá Bán', 'Ngoại Tệ'],
      rows.map(r => [r.ngay, r.ma, r.ten, r.dvt, r.gia, r.nt])
    )
  }

  return (
    <div className="space-y-4">
      {alert && <Alert msg={alert.msg} type={alert.type} onClose={closeAlert} />}
      <Card>
        <CH>
          <h3 className="font-bold">💲 Danh Mục Giá Bán</h3>
          <div className="ml-2 px-2 py-1 bg-blue-50 rounded text-xs text-blue-700">
            ✅ Mã hàng/Tên VT lấy từ bảng <code>products</code> (DB)
          </div>
          <div className="ml-auto flex gap-2">
            <Btn size="sm" onClick={() => setModal(true)}>+ Thêm</Btn>
            <Btn v="excel" size="sm" onClick={doExport}>⬇ Excel</Btn>
          </div>
        </CH>
        <Tbl data={rows} loading={false} empty="Chưa có giá bán. Nhấn + Thêm để thêm từ danh mục sản phẩm." cols={[
          { k: 'ngay', l: 'Ngày Áp Dụng', w: '120px' },
          { k: 'ma', l: 'Mã Hàng', w: '100px', fn: v => <Code v={v} /> },
          { k: 'ten', l: 'Tên Vật Tư', fn: v => <span className="font-medium">{v}</span> },
          { k: 'dvt', l: 'ĐVT', w: '80px' },
          { k: 'gia', l: 'Giá Bán', w: '130px', r: true, fn: v => fmtN(v) },
          { k: 'nt', l: 'Mã NT', w: '80px' },
        ]} />
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="💲 Thêm Giá Bán">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Sel label="Chọn Sản Phẩm (từ bảng products)" req
              value={form.product_id} onChange={sf('product_id')}
              options={products.map(p => ({ value: p.id, label: `${p.code || p.MaHH} - ${p.name || p.TenHH} (${p.unit || p.DVT || '-'})` }))} />
          </div>
          <Inp label="Ngày Áp Dụng" req type="date" value={form.ngay_ap_dung} onChange={sf('ngay_ap_dung')} />
          <Inp label="Giá Bán" req type="number" value={form.gia_ban}
            placeholder={getProduct(form.product_id) ? `Giá gốc: ${fmtN(getProduct(form.product_id)?.unit_price || 0)}` : ''}
            onChange={sf('gia_ban')} />
          <Sel label="Mã Ngoại Tệ" value={form.nt} onChange={sf('nt')} options={['VND', 'USD', 'EUR']} />
        </div>
        {form.product_id && getProduct(form.product_id) && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
            <strong>{getProduct(form.product_id)?.name || getProduct(form.product_id)?.TenHH}</strong>
            {' | '}ĐVT: {getProduct(form.product_id)?.unit || getProduct(form.product_id)?.DVT || '-'}
            {' | '}Giá hiện tại: {fmtN(getProduct(form.product_id)?.unit_price || 0)}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Btn v="outline" onClick={() => setModal(false)}>Hủy</Btn>
          <Btn onClick={addRow}>💾 Thêm</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ══ ĐỊNH MỨC THÀNH PHẨM (dropdown từ products)
const BOMPage = () => {
  const [products, setProducts] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ product_id: '', tu_ngay: today(), den_ngay: '', ghi_chu: '' })
  const [alert, showAlert, closeAlert] = useAlert()
  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    api('GET', '/products').then(d => setProducts(Array.isArray(d) ? d : []))
  }, [])

  useEffect(() => {
    setLoading(true)
    api('GET', '/system-config/dinh_muc_tp').then(d => {
      setItems(Array.isArray(d?.data) ? d.data : [])
      setLoading(false)
    })
  }, [])

  const save = async () => {
    const p = products.find(x => x.id == form.product_id)
    if (!p) { showAlert('Vui lòng chọn sản phẩm!', 'danger'); return }
    const newItem = {
      code: p.code || p.MaHH,
      name: p.name || p.TenHH,
      tu_ngay: form.tu_ngay,
      den_ngay: form.den_ngay || '',
      ghi_chu: form.ghi_chu
    }
    const r = await api('POST', '/system-config/dinh_muc_tp/add-item', newItem)
    if (r && !r.__error && r.data) {
      showAlert('Thêm thành công!')
      setItems(r.data)
      setModal(false)
      setForm({ product_id: '', tu_ngay: today(), den_ngay: '', ghi_chu: '' })
    } else {
      showAlert('Lỗi: ' + (r?.message || 'Không lưu được'), 'danger')
    }
  }

  const del = async (idx) => {
    const item = items[idx]
    if (!confirm(`Xóa định mức "${item.name}"?`)) return
    const r = await api('DELETE', `/system-config/dinh_muc_tp/remove-item/${idx}`)
    if (r) { showAlert('Đã xóa!'); setItems(r.data) }
    else showAlert('Lỗi khi xóa!', 'danger')
  }

  return (
    <div className="space-y-4">
      {alert && <Alert msg={alert.msg} type={alert.type} onClose={closeAlert} />}
      <Card>
        <CH>
          <h3 className="font-bold">⚙️ Định Mức Thành Phẩm</h3>
          <div className="ml-auto"><Btn size="sm" onClick={() => setModal(true)}>+ Thêm</Btn></div>
        </CH>
        <Tbl data={items} loading={loading} empty="Chưa có định mức. Nhấn + Thêm để tạo." cols={[
          { k: 'code', l: 'Mã SP', w: '120px', fn: v => <Code v={v} /> },
          { k: 'name', l: 'Tên Sản Phẩm' },
          { k: 'tu_ngay', l: 'Ngày BĐ', w: '110px' },
          { k: 'den_ngay', l: 'Ngày KT', w: '110px', fn: v => v || '-' },
          { k: 'ghi_chu', l: 'Ghi Chú' },
          { k: '_act', l: '', w: '60px', fn: (v, r, i) => <button onClick={() => del(i)} className="text-xs text-red-500 hover:underline">Xóa</button> },
        ]} />
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title="⚙️ Thêm Định Mức Thành Phẩm">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Sel label="Mã SP Thành Phẩm (từ bảng products)" req
              value={form.product_id} onChange={sf('product_id')}
              options={products.map(p => ({ value: p.id, label: `${p.code || p.MaHH} - ${p.name || p.TenHH}` }))} />
          </div>
          <Inp label="Ngày Bắt Đầu" req type="date" value={form.tu_ngay} onChange={sf('tu_ngay')} />
          <Inp label="Ngày Kết Thúc" type="date" value={form.den_ngay} onChange={sf('den_ngay')} />
          <div className="col-span-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600">Ghi Chú</label>
              <textarea rows={2} value={form.ghi_chu} onChange={sf('ghi_chu')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Btn v="outline" onClick={() => setModal(false)}>Hủy</Btn>
          <Btn onClick={save}>💾 Lưu</Btn>
        </div>
      </Modal>
    </div>
  )
}


// ══ KHAI BÁO NĂM TÀI CHÍNH (có edit)
const FiscalYearFixed = () => (
  <LocalCatalog
    title="Năm Tài Chính" icon="📅"
    configKey="fiscal_years"
    cols={[
      {k:'nam', l:'Năm', w:'70px', fn:v=><span className="font-bold text-blue-700">{v}</span>},
      {k:'tu_ngay', l:'Từ Ngày', w:'110px'},
      {k:'den_ngay', l:'Đến Ngày', w:'110px'},
      {k:'mo_ta', l:'Mô Tả'},
      {k:'da_khoa', l:'Trạng Thái', w:'110px', fn:v=><span className={`text-xs px-2 py-0.5 rounded font-medium ${v?'bg-gray-100 text-gray-500':'bg-green-100 text-green-700'}`}>{v?'🔒 Đã khóa':'✅ Đang dùng'}</span>},
    ]}
    modalFields={[
      {key:'nam', label:'Năm TC', req:true, placeholder:'2027'},
      {key:'mo_ta', label:'Mô Tả', placeholder:'Năm tài chính 2027'},
      {key:'tu_ngay', label:'Từ Ngày (DD-MM-YYYY)', req:true, placeholder:'01-01-2027'},
      {key:'den_ngay', label:'Đến Ngày (DD-MM-YYYY)', req:true, placeholder:'31-12-2027'},
    ]}
    initForm={{nam:'', tu_ngay:'', den_ngay:'', mo_ta:'', da_khoa:false}}
  />
)
// Phiếu nhập kho
const WarehouseReceiptPage=({autoOpenPnkId=null,onAutoOpenDone=null,onNav=null})=>{
  const [data,loading,load]=useList('/documents/phieu-nhap-kho')
  const [tab,setTab]=useState('list')
  const [warehouses,setWarehouses]=useState([])
  const [products,setProducts]=useState([])
  const [suppliers,setSuppliers]=useState([])
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)
  const [editModal,setEditModal]=useState(false)
  const [editForm,setEditForm]=useState(null)
  const [editRows,setEditRows]=useState([])
  const [editLoading,setEditLoading]=useState(false)
  const [units,setUnits]=useState([])

  // ── Tự sinh số phiếu ──
  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PNK-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.so_phieu_nhap||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }

  const makeEmptyForm=(list=[])=>({
    so_phieu_nhap: makeNewSoCT(list),
    ngay_phieu_nhap: today(),
    loai_phieu_nhap: 'Nhập từ NCC',
    nha_cung_cap_id: '',
    nguoi_giao_dich: '',
    dien_giai: '',
    ky_ke_toan_id: kyDefault
  })
  const emptyRows=()=>[{product_id:'',warehouse_id:'',quantity:1,unit_price:0}]

  const [form,setForm]=useState(()=>makeEmptyForm())
  const [rows,setRows]=useState(emptyRows())
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/warehouses').then(d=>setWarehouses(Array.isArray(d)?d:[]))
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
    api('GET','/suppliers').then(d=>setSuppliers(Array.isArray(d)?d:[]))
  },[])

  // Cập nhật số phiếu khi data load xong
  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,so_phieu_nhap:makeNewSoCT(data)}))
  },[data,loading])
  useEffect(()=>{
    if(autoOpenPnkId){
      api('GET',`/documents/phieu-nhap-kho/${autoOpenPnkId}`).then(r=>{
        if(r&&!r.__error){
          setDetail(r)
          setDetailModal(true)
        }
        if(onAutoOpenDone) onAutoOpenDone()
      })
    }
  },[autoOpenPnkId])

  // ── Xem chi tiết ──
  const openDetail=async(row)=>{
  setDetailModal(true)
  setDetailLoading(true)
  setDetail(null)
  // Dùng row.id để fetch chi tiết
  const r=await api('GET',`/documents/phieu-nhap-kho/${row.id}`)
  if(r&&!r.__error){
    setDetail(r)
  } else {
    // Fallback dùng data từ row nếu API lỗi
    setDetail({
      SoCT: row.so_phieu_nhap,
      so_phieu_nhap: row.so_phieu_nhap,
      NgayCT: row.ngay_phieu_nhap,
      ngay_phieu_nhap: row.ngay_phieu_nhap,
      loai_phieu_nhap: row.loai_phieu_nhap||'',
      MaNCC: row.nha_cung_cap_id,
      TongTien: row.tong_tien||0,
      TrangThai: row.trang_thai||'DRAFT',
      items:[]
    })
  }
  setDetailLoading(false)
}

  const openEdit=(d)=>{
    // PNK tạo từ PNM → không cho sửa, hiện cảnh báo
    if(d.pnm_id){
      const goToPNM=window.confirm(
        `⚠️ Phiếu ${d.SoCT||d.so_phieu_nhap} được tạo tự động từ Phiếu Nhập Mua.\n\n`+
        `Để đảm bảo đồng bộ dữ liệu, vui lòng sửa tại Phiếu Nhập Mua liên kết.\n\n`+
        `Nhấn OK → chuyển đến Phiếu Nhập Mua liên kết\n`+
        `Nhấn Hủy → tự tìm thủ công`
      )
      if(goToPNM){
        setDetailModal(false)
        setDetail(null)
        // Chuyển sang tab PNM và tự mở chi tiết phiếu đó
        if(onNav) onNav('nv-pnm', d.pnm_id)
      }
      return
    }
    // PNK độc lập → cho sửa
    setEditForm({
      so_phieu_nhap: d.SoCT||d.so_phieu_nhap||'',
      ngay_phieu_nhap: String(d.NgayCT||d.ngay_phieu_nhap||today()).slice(0,10),
      loai_phieu_nhap: d.loai_phieu_nhap||'Nhập từ NCC',
      nha_cung_cap_id: d.MaNCC||d.nha_cung_cap_id||'',
      nguoi_giao_dich: d.nguoi_giao_dich||'',
      dien_giai: d.dien_giai||'',
      ky_ke_toan_id: d.ky_ke_toan_id||d.MaKyKeToan||kyDefault||''
    })
    setEditRows(
      d.items&&d.items.length>0
        ?d.items.map(i=>({
            product_id:String(i.product_id||''),
            warehouse_id:String(i.warehouse_id||''),
            quantity:i.quantity||1,
            unit_price:i.unit_price||0,
            chi_phi_phan_bo:i.chi_phi_phan_bo||0,
            tax_rate:0
          }))
        :[{product_id:'',warehouse_id:'',quantity:1,unit_price:0,chi_phi_phan_bo:0,tax_rate:0}]
    )
    setEditModal(true)
  }

  const saveEdit=async()=>{
    if(!editForm.ngay_phieu_nhap){showAlert('Vui lòng chọn Ngày Phiếu!','danger');return}
    if(!editForm.ky_ke_toan_id){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
    const validEditRows=editRows.filter(r=>r.product_id&&r.warehouse_id&&+r.quantity>0)
    if(!validEditRows.length){showAlert('Vui lòng thêm ít nhất 1 dòng hàng hóa có chọn kho!','danger');return}
    setEditLoading(true)
    const body={
      so_phieu_nhap: editForm.so_phieu_nhap,
      ngay_phieu_nhap: editForm.ngay_phieu_nhap,
      loai_phieu_nhap: editForm.loai_phieu_nhap||'Nhập từ NCC',
      nha_cung_cap_id: editForm.nha_cung_cap_id?+editForm.nha_cung_cap_id:null,
      nguoi_giao_dich: editForm.nguoi_giao_dich||null,
      dien_giai: editForm.dien_giai||null,
      ky_ke_toan_id: +editForm.ky_ke_toan_id,
      items: validEditRows.map(r=>({
        product_id: +r.product_id,
        warehouse_id: +r.warehouse_id,
        quantity: +r.quantity,
        unit_price: +r.unit_price,
        chi_phi_phan_bo: +r.chi_phi_phan_bo||0
      }))
    }
    const r=await api('PUT',`/documents/phieu-nhap-kho/${detail.id}`,body)
    setEditLoading(false)
    if(r&&!r.__error){
      showAlert('Cập nhật PNK thành công!')
      setEditModal(false);setDetailModal(false);setDetail(null);load()
    } else showAlert('Lỗi: '+(r?.message||'Cập nhật thất bại'),'danger')
  }

const reloadProducts=()=>{
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
  }
  // Helper tên NCC
  const getNCCLabel=(id)=>{
    if(!id) return '-'
    const s=suppliers.find(x=>String(x.id)===String(id))
    return s?`${s.TenNCC||s.name} (${s.MaNCC||s.code})`:`NCC #${id}`
  }
  const getWarehouseName=(id)=>{
    const w=warehouses.find(x=>String(x.id)===String(id))
    return w?`${w.MaKho||w.code}`:`Kho #${id}`
  }
  const upd=(i,k,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,[k]:v}:r))

  // ── Lưu phiếu ──
  const save=async()=>{
    if(!form.so_phieu_nhap){
      showAlert('Vui lòng nhập Số Phiếu!','danger'); return
    }
    const validRows=rows.filter(r=>r.product_id&&r.warehouse_id&&+r.quantity>0)
    if(!validRows.length){
      showAlert('Vui lòng thêm ít nhất 1 dòng hàng hợp lệ!','danger'); return
    }
    const body={
      so_phieu_nhap: form.so_phieu_nhap,
      ngay_phieu_nhap: form.ngay_phieu_nhap,
      loai_phieu_nhap: form.loai_phieu_nhap,
      nha_cung_cap_id: form.nha_cung_cap_id?+form.nha_cung_cap_id:null,
      nguoi_giao_dich: form.nguoi_giao_dich,
      dien_giai: form.dien_giai,
      ky_ke_toan_id: +form.ky_ke_toan_id,
      items: validRows.map(r=>({
        product_id: +r.product_id,
        warehouse_id: +r.warehouse_id,
        quantity: +r.quantity,
        unit_price: +r.unit_price
      }))
    }
    const r=await api('POST','/documents/phieu-nhap-kho',body)
    if(r&&!r.__error){
      showAlert(`Tạo PNK ${form.so_phieu_nhap} thành công!`)
      const newData=await api('GET','/documents/phieu-nhap-kho')
      const list=Array.isArray(newData)?newData:[]
      setForm(makeEmptyForm(list))
      setRows(emptyRows())
      load()
      setTab('list')
    } else {
      showAlert('Lỗi: '+(r?.message||'Tạo phiếu nhập kho thất bại'),'danger')
    }
  }

  const total=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)

  // ── Render chi tiết trong modal (có thêm kho) ──
  const PNKDetailModal=()=>{
  if(!detailModal) return null

  const getProductName=(id)=>{
    if(!id) return '-'
    const p=products.find(x=>String(x.id)===String(id))
    return p?`${p.MaHH||p.code||''} - ${p.TenHH||p.name||''}`:`SP #${id}`
  }

  const items=detail?.items||[]
  console.log('PNK items:', JSON.stringify(items))
  console.log('hasCPMH:', items.some(i=>+i.chi_phi_phan_bo>0))
  const totalItems=items.reduce((s,i)=>s+(i.total||(+i.quantity * +i.unit_price)||0),0)

  return(
    <Modal open={detailModal}
      onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`📥 Chi Tiết Phiếu Nhập Kho - ${detail?.SoCT||detail?.so_phieu_nhap||''}`}
      size="lg">
      {detailLoading||!detail
        ?<div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"/>
          <p className="text-sm text-gray-500 mt-3">Đang tải...</p>
        </div>
        :<>
          {/* ── THÔNG TIN HEADER ── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4 p-4 bg-blue-50 rounded-lg text-sm border border-blue-100">
            <div className="flex gap-2">
              <span className="text-gray-500 w-32 flex-shrink-0">Số Phiếu:</span>
              <strong className="font-mono text-blue-700">
                {detail.SoCT||detail.so_phieu_nhap||'-'}
              </strong>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-32 flex-shrink-0">Ngày Nhập:</span>
              <strong>{fmtDate(detail.NgayCT||detail.ngay_phieu_nhap)}</strong>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-32 flex-shrink-0">Loại Phiếu:</span>
              <Badge v="success">{detail.loai_phieu_nhap||'-'}</Badge>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-32 flex-shrink-0">Nhà CC:</span>
              <strong>
                {detail.ten_ncc||getNCCLabel(detail.MaNCC||detail.nha_cung_cap_id)||'-'}
              </strong>
            </div>
            {detail.nguoi_giao_dich&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Người GD:</span>
                <strong>{detail.nguoi_giao_dich}</strong>
              </div>
            )}
            {detail.dien_giai&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Diễn Giải:</span>
                <strong>{detail.dien_giai}</strong>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-500 w-32 flex-shrink-0">Tổng SL:</span>
              <strong>{fmtN(detail.tong_so_luong||0)}</strong>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-32 flex-shrink-0">Trạng Thái:</span>
              <Badge v={(detail.TrangThai||detail.trang_thai)==='POSTED'?'success':'warning'}>
                {detail.TrangThai||detail.trang_thai||'DRAFT'}
              </Badge>
            </div>
          </div>

          {/* ── BẢNG HÀNG HÓA ── */}
          <p className="text-xs font-bold text-gray-700 mb-2">
            📦 Chi Tiết Hàng Nhập
            <span className="ml-2 font-normal text-gray-400">({items.length} dòng)</span>
          </p>

          {items.length>0
            ?<div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-3 py-2 text-center text-xs font-bold text-blue-700 w-10">STT</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-700">Tên Hàng Hóa</th>
                    <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 w-20">Kho</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-16">SL</th>
                    <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-28">Đơn Giá</th>
                    {items.some(i=>+i.chi_phi_phan_bo>0)&&
                      <th className="px-3 py-2 text-right text-xs font-bold text-orange-500 w-24">CPMH</th>}
                    <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-28">Thành Tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item,i)=>(
                    <tr key={i} className="hover:bg-blue-50/30">
                      <td className="px-3 py-2.5 text-center text-gray-400 text-xs">{i+1}</td>
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-sm">{getProductName(item.product_id)}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                          {getWarehouseName(item.warehouse_id)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm font-semibold">
                        {fmtN(item.quantity)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm">
                        {fmtN(item.unit_price)}
                      </td>
                      {items.some(i=>+i.chi_phi_phan_bo>0)&&
                        <td className="px-3 py-2.5 text-right font-mono text-sm text-orange-500">
                          {fmtN(item.chi_phi_phan_bo||0)}
                        </td>}
                      <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-blue-700">
                        {fmtN(item.total||(+item.quantity * +item.unit_price)+(+item.chi_phi_phan_bo||0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                  <tr>
                    <td colSpan={items.some(i=>+i.chi_phi_phan_bo>0)?6:5} className="px-3 py-3 font-bold text-right text-sm text-blue-800">
                      Tổng Thanh Toán:
                    </td>
                    <td className="px-3 py-3 text-right font-bold font-mono text-blue-700 text-base">
                      {fmt(items.reduce((s,i)=>s+(i.total||(+i.quantity * +i.unit_price)+(+i.chi_phi_phan_bo||0)),0)||detail.TongTien||detail.tong_tien||0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            :<div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">Không có dữ liệu hàng hóa</p>
              <p className="text-xs text-gray-300 mt-1">
                ID phiếu: {detail.id} — items: {JSON.stringify(detail.items)}
              </p>
            </div>
          }

          <div className="flex justify-end gap-2 mt-4">
            {detail&&<Btn v="warning" onClick={()=>openEdit(detail)}>✏️ Sửa Phiếu</Btn>}
            <Btn v="outline" onClick={()=>{setDetailModal(false);setDetail(null)}}>Đóng</Btn>
          </div>
        </>
      }
    </Modal>
  )
}

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <PNKDetailModal/>

    {editModal&&editForm&&<Modal open={editModal} onClose={()=>setEditModal(false)}
      title={`✏️ Sửa Phiếu Nhập Kho - ${editForm.so_phieu_nhap}`} size="lg">
      {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Inp label="Số Phiếu" value={editForm.so_phieu_nhap} disabled hint="Không thể sửa số phiếu"/>
        <Inp label="Ngày Phiếu" req type="date" value={editForm.ngay_phieu_nhap}
          onChange={e=>setEditForm(f=>({...f,ngay_phieu_nhap:e.target.value}))}/>
        <Sel label="Kỳ Kế Toán" req value={editForm.ky_ke_toan_id||''}
          onChange={e=>setEditForm(f=>({...f,ky_ke_toan_id:e.target.value}))}
          options={kyOptions}/>
        <Sel label="Loại Phiếu" value={editForm.loai_phieu_nhap}
          onChange={e=>setEditForm(f=>({...f,loai_phieu_nhap:e.target.value}))}
          options={[
            {value:'Nhập từ NCC',label:'Nhập từ NCC'},
            {value:'Nhập thành phẩm',label:'Nhập thành phẩm'},
            {value:'Nhập kho mua hàng',label:'Nhập kho mua hàng'},
            {value:'Nhập khác',label:'Nhập khác'},
          ]}/>
        <div className="col-span-2">
          <Sel label="Nhà Cung Cấp" value={editForm.nha_cung_cap_id||''}
            onChange={e=>setEditForm(f=>({...f,nha_cung_cap_id:e.target.value}))}
            options={suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))}/>
        </div>
        <Inp label="Người Giao Dịch" value={editForm.nguoi_giao_dich||''}
          onChange={e=>setEditForm(f=>({...f,nguoi_giao_dich:e.target.value}))}/>
        <div className="col-span-3">
          <Inp label="Diễn Giải" value={editForm.dien_giai||''}
            onChange={e=>setEditForm(f=>({...f,dien_giai:e.target.value}))}/>
        </div>
      </div>
      <p className="text-xs font-bold text-gray-600 mb-1">📦 Danh Sách Hàng Nhập:</p>
      <DetailTbl
        rows={editRows} setRows={setEditRows}
        products={products} warehouses={warehouses}
        color="blue" hasWarehouse={true} warehouseLabel="Kho Nhập"
        units={units} onProductCreated={reloadProducts}/>
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between">
        <span className="text-sm font-bold text-blue-800">Tổng Thanh Toán:</span>
        <span className="text-lg font-bold text-blue-700 font-mono">
          {fmt(editRows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price)+(+r.chi_phi_phan_bo||0),0))}
        </span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
        <Btn v="success" onClick={saveEdit} disabled={editLoading}>
          {editLoading?'Đang lưu...':'💾 Lưu Thay Đổi'}
        </Btn>
      </div>
    </Modal>}
    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]}
      active={tab}
      onChange={t=>{
        setTab(t)
        if(t==='create'){setForm(makeEmptyForm(data));setRows(emptyRows())}
      }}/>

    {/* ── DANH SÁCH ── */}
    {tab==='list'&&<Card>
      <CH>
        <h3 className="font-bold">📥 Danh Sách Phiếu Nhập Kho</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={()=>exportExcel('PhieuNhapKho','Phiếu Nhập Kho',
            ['Số Phiếu','Ngày','Loại','Tổng SL','Tổng Tiền','Trạng Thái'],
            data.map(r=>[r.so_phieu_nhap,fmtDate(r.ngay_phieu_nhap),r.loai_phieu_nhap,r.tong_so_luong,r.tong_tien,r.trang_thai])
          )}>⬇ Excel</Btn>
        </div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-red-600 bg-blue-50 border-b border-blue-100">
        💡 Click vào Số Phiếu để xem chi tiết
      </p>
      <Tbl data={data} loading={loading} empty="Chưa có phiếu nhập kho" cols={[
        {k:'so_phieu_nhap',l:'Số Phiếu',w:'160px',fn:(v,r)=>(
          <button onClick={()=>openDetail(r)}
            className="text-blue-600 hover:underline font-mono text-xs font-semibold">
            {v||'-'}
          </button>
        )},
        {k:'ngay_phieu_nhap',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
        {
          k: 'loai_phieu_nhap', 
          l: 'Loại Phiếu', 
          w: '150px', 
          fn: (v, r) => (
            <Badge v="success">{v || r.loai_phieu_nhap || '-'}</Badge>
          )
        },
        {k:'nha_cung_cap_id',l:'Nhà Cung Cấp',fn:v=>(
          <span className="text-sm">{getNCCLabel(v)}</span>
        )},
        {k:'tong_so_luong',l:'Tổng SL',w:'100px',r:true,fn:v=><span className="font-semibold text-green-700">{fmt(v||0)}</span>},
        {k:'tong_tien',l:'Tổng Tiền',w:'130px',r:true,
          fn:v=><span className="font-semibold text-red-700">{fmt(v||0)}</span>
        },
        {k:'trang_thai',l:'Status',w:'90px',
          fn:v=><Badge v={v==='POSTED'?'success':'warning'}>{v||'DRAFT'}</Badge>
        },
      ]}/>
    </Card>}

    {/* ── TẠO MỚI ── */}
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">📥 Tạo Phiếu Nhập Kho</h3></CH>
      <CB>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Inp label="Số Phiếu Nhập" req value={form.so_phieu_nhap}
            onChange={sf('so_phieu_nhap')} hint="Tự sinh, có thể sửa"/>
          <Inp label="Ngày Phiếu Nhập" req type="date" value={form.ngay_phieu_nhap}
            onChange={sf('ngay_phieu_nhap')}/>
          <Sel label="Loại Phiếu Nhập" value={form.loai_phieu_nhap}
            onChange={sf('loai_phieu_nhap')}
            options={[
              {value:'Nhập từ NCC',label:'Nhập từ NCC'},
              {value:'Nhập thành phẩm',label:'Nhập thành phẩm'},
              {value:'Nhập kho mua hàng',label:'Nhập kho mua hàng'},
              {value:'Nhập khác',label:'Nhập khác'},
            ]}/>
          <div className="col-span-2">
            <Sel label="Nhà Cung Cấp" value={form.nha_cung_cap_id}
              onChange={sf('nha_cung_cap_id')}
              options={suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))}/>
          </div>
          <Inp label="Người Giao Dịch" value={form.nguoi_giao_dich}
            onChange={sf('nguoi_giao_dich')}/>
          <div className="col-span-3">
            <Inp label="Diễn Giải" value={form.dien_giai} onChange={sf('dien_giai')}/>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-600 mb-1">Chi Tiết Hàng Nhập:</p>
        <DetailTbl
          rows={rows} setRows={setRows}
          products={products} warehouses={warehouses}
          color="blue" hasWarehouse={true} warehouseLabel="Kho Nhập"
          units={units} onProductCreated={reloadProducts}/>
      </CB>
      <CF>
        <Btn v="outline" onClick={()=>{
          setTab('list')
          setForm(makeEmptyForm(data))
          setRows(emptyRows())
        }}>Hủy</Btn>
        <Btn v="success" onClick={save}>💾 Lưu & Đóng</Btn>
      </CF>
    </Card>}
  </div>)
}

// ══ PHIẾU XUẤT KHO - có form tạo + Excel
const WarehouseIssuePage=({autoOpenPxkId=null,onAutoOpenDone=null,onNav=null})=>{
  const [data,loading,load]=useList('/documents/phieu-xuat-kho')
  const [tab,setTab]=useState('list')
  const [warehouses,setWarehouses]=useState([])
  const [products,setProducts]=useState([])
  const [customers,setCustomers]=useState([])
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)
  const [editModal,setEditModal]=useState(false)
  const [editForm,setEditForm]=useState(null)
  const [editRows,setEditRows]=useState([])
  const [editLoading,setEditLoading]=useState(false)
  const [units,setUnits]=useState([])

  // ── Tự sinh số phiếu ──
  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PXK-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.so_phieu_xuat||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }

  const makeEmptyForm=(list=[])=>({
    so_phieu_xuat: makeNewSoCT(list),
    ngay_phieu_xuat: today(),
    loai_phieu_xuat: 'Xuất bán',
    khach_hang_id: '',
    nguoi_giao_dich: '',
    dien_giai: '',
    ky_ke_toan_id: kyDefault
  })
  const emptyRows=()=>[{product_id:'',warehouse_id:'',quantity:1,unit_price:0}]

  const [form,setForm]=useState(()=>makeEmptyForm())
  const [rows,setRows]=useState(emptyRows())
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/warehouses').then(d=>setWarehouses(Array.isArray(d)?d:[]))
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
    api('GET','/customers').then(d=>setCustomers(Array.isArray(d)?d:[]))
  },[])
  useEffect(()=>{
    if(autoOpenPxkId){
      api('GET',`/documents/phieu-xuat-kho/${autoOpenPxkId}`).then(r=>{
        if(r&&!r.__error){
          setDetail(r)
          setDetailModal(true)
        }
        if(onAutoOpenDone) onAutoOpenDone()
      })
    }
  },[autoOpenPxkId])

  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,so_phieu_xuat:makeNewSoCT(data)}))
  },[data,loading])

  // ── Xem chi tiết ──
  const openDetail=async(row)=>{
    setDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    const r=await api('GET',`/documents/phieu-xuat-kho/${row.id}`)
    if(r&&!r.__error){
      setDetail(r)
    } else {
      setDetail({
        SoCT: row.so_phieu_xuat,
        so_phieu_xuat: row.so_phieu_xuat,
        NgayCT: row.ngay_phieu_xuat,
        loai_phieu_xuat: row.loai_phieu_xuat||'',
        MaKH: row.khach_hang_id,
        TongTien: row.tong_tien||0,
        TrangThai: row.trang_thai||'DRAFT',
        items:[]
      })
    }
    setDetailLoading(false)
  }
  const openEdit=(d)=>{
    // PXK từ PBH
    if(d.pbh_id){
      const go=window.confirm(
        `⚠️ Phiếu ${d.SoCT||d.so_phieu_xuat} được tạo tự động từ Phiếu Bán Hàng.\n\n`+
        `Để đảm bảo đồng bộ, vui lòng sửa tại Phiếu Bán Hàng liên kết.\n\n`+
        `Nhấn OK → chuyển đến Phiếu Bán Hàng\nNhấn Hủy → tự tìm thủ công`
      )
      if(go&&onNav){onNav('nv-pbh',d.pbh_id)}
      return
    }
    // PXK từ BL
    if(d.bl_id){
      const go=window.confirm(
        `⚠️ Phiếu ${d.SoCT||d.so_phieu_xuat} được tạo tự động từ Phiếu Bán Lẻ.\n\n`+
        `Để đảm bảo đồng bộ, vui lòng sửa tại Phiếu Bán Lẻ liên kết.\n\n`+
        `Nhấn OK → chuyển đến Phiếu Bán Lẻ\nNhấn Hủy → tự tìm thủ công`
      )
      if(go&&onNav){onNav('nv-bl',d.bl_id)}
      return
    }
    // PXK độc lập → mở EditModal
    setEditForm({
      so_phieu_xuat: d.SoCT||d.so_phieu_xuat||'',
      ngay_phieu_xuat: String(d.NgayCT||d.ngay_phieu_xuat||today()).slice(0,10),
      loai_phieu_xuat: d.loai_phieu_xuat||'Xuất bán',
      khach_hang_id: String(d.MaKH||d.khach_hang_id||''),
      nguoi_giao_dich: d.nguoi_giao_dich||'',
      dien_giai: d.dien_giai||'',
      ky_ke_toan_id: String(d.ky_ke_toan_id||d.MaKyKeToan||kyDefault||'')
    })
    setEditRows(
      d.items&&d.items.length>0
        ?d.items.map(i=>({
            product_id:String(i.product_id||''),
            warehouse_id:String(i.warehouse_id||''),
            quantity:i.quantity||1,
            unit_price:i.unit_price||0,
            chi_phi_phan_bo:0,
            tax_rate:0
          }))
        :[{product_id:'',warehouse_id:'',quantity:1,unit_price:0,chi_phi_phan_bo:0,tax_rate:0}]
    )
    setEditModal(true)
  }
  const saveEdit=async()=>{
    if(!editForm.ngay_phieu_xuat){showAlert('Vui lòng chọn Ngày Phiếu!','danger');return}
    if(!editForm.ky_ke_toan_id){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
    const validEditRows=editRows.filter(r=>r.product_id&&r.warehouse_id&&+r.quantity>0)
    if(!validEditRows.length){showAlert('Vui lòng thêm ít nhất 1 dòng có chọn kho!','danger');return}
    setEditLoading(true)
    const body={
      so_phieu_xuat: editForm.so_phieu_xuat,
      ngay_phieu_xuat: editForm.ngay_phieu_xuat,
      loai_phieu_xuat: editForm.loai_phieu_xuat||'Xuất bán',
      khach_hang_id: editForm.khach_hang_id?+editForm.khach_hang_id:null,
      nguoi_giao_dich: editForm.nguoi_giao_dich||null,
      dien_giai: editForm.dien_giai||null,
      ky_ke_toan_id: +editForm.ky_ke_toan_id,
      items: validEditRows.map(r=>({
        product_id:+r.product_id,
        warehouse_id:+r.warehouse_id,
        quantity:+r.quantity,
        unit_price:+r.unit_price
      }))
    }
    const r=await api('PUT',`/documents/phieu-xuat-kho/${detail.id}`,body)
    setEditLoading(false)
    if(r&&!r.__error){
      showAlert('Cập nhật PXK thành công!')
      setEditModal(false);setDetailModal(false);setDetail(null);load()
    } else showAlert('Lỗi: '+(r?.message||'Cập nhật thất bại'),'danger')
  }

  const reloadProducts=()=>{
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
  }

  // ── Helpers ──
  const getKHLabel=(id)=>{
    if(!id) return '-'
    const c=customers.find(x=>String(x.id)===String(id))
    return c?`${c.TenKH||c.name} (${c.MaKH||c.code})`:`KH #${id}`
  }
  const getWarehouseName=(id)=>{
    if(!id) return '-'
    const w=warehouses.find(x=>String(x.id)===String(id))
    return w?`${w.MaKho||w.code}`:`Kho #${id}`
  }
  const getProductName=(id)=>{
    if(!id) return '-'
    const p=products.find(x=>String(x.id)===String(id))
    return p?`${p.MaHH||p.code||''} - ${p.TenHH||p.name||''}`:`SP #${id}`
  }
  const upd=(i,k,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,[k]:v}:r))

  // ── Lưu phiếu ──
  const save=async()=>{
    if(!form.so_phieu_xuat){
      showAlert('Vui lòng nhập Số Phiếu!','danger'); return
    }
    const validRows=rows.filter(r=>r.product_id&&r.warehouse_id&&+r.quantity>0)
    if(!validRows.length){
      showAlert('Vui lòng thêm ít nhất 1 dòng hàng hợp lệ!','danger'); return
    }
    const body={
      so_phieu_xuat: form.so_phieu_xuat,
      ngay_phieu_xuat: form.ngay_phieu_xuat,
      loai_phieu_xuat: form.loai_phieu_xuat,
      khach_hang_id: form.khach_hang_id?+form.khach_hang_id:null,
      nguoi_giao_dich: form.nguoi_giao_dich,
      dien_giai: form.dien_giai,
      ky_ke_toan_id: +form.ky_ke_toan_id,
      items: validRows.map(r=>({
        product_id: +r.product_id,
        warehouse_id: +r.warehouse_id,
        quantity: +r.quantity,
        unit_price: +r.unit_price
      }))
    }
    const r=await api('POST','/documents/phieu-xuat-kho',body)
    if(r&&!r.__error){
      showAlert(`Tạo PXK ${form.so_phieu_xuat} thành công!`)
      const newData=await api('GET','/documents/phieu-xuat-kho')
      const list=Array.isArray(newData)?newData:[]
      setForm(makeEmptyForm(list))
      setRows(emptyRows())
      load()
      setTab('list')
    } else {
      showAlert('Lỗi: '+(r?.message||'Tạo phiếu xuất kho thất bại'),'danger')
    }
  }

  const total=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)

  // ── Modal chi tiết ──
  const PXKDetailModal=()=>{
    if(!detailModal) return null
    const items=detail?.items||[]
    const totalItems=items.reduce((s,i)=>s+(i.total||(+i.quantity * +i.unit_price)||0),0)

    return(
      <Modal open={detailModal}
        onClose={()=>{setDetailModal(false);setDetail(null)}}
        title={`📤 Chi Tiết Phiếu Xuất Kho - ${detail?.SoCT||detail?.so_phieu_xuat||''}`}
        size="lg">
        {detailLoading||!detail
          ?<div className="py-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"/>
            <p className="text-sm text-gray-500 mt-3">Đang tải...</p>
          </div>
          :<>
            {/* ── THÔNG TIN HEADER ── */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4 p-4 bg-blue-50 rounded-lg text-sm border border-blue-100">
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Số Phiếu:</span>
                <strong className="font-mono text-blue-700">
                  {detail.SoCT||detail.so_phieu_xuat||'-'}
                </strong>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Ngày Xuất:</span>
                <strong>{fmtDate(detail.NgayCT||detail.ngay_phieu_xuat)}</strong>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Loại Phiếu:</span>
                <Badge v="success">{detail.loai_phieu_xuat||'-'}</Badge>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Khách Hàng:</span>
                <strong>
                  {detail.ten_khach_le?`${detail.ten_khach_le} (Khách lẻ)`:detail.khach_hang_ten||getKHLabel(detail.MaKH||detail.khach_hang_id)||'-'}
                </strong>
              </div>
              {detail.nguoi_giao_dich&&(
                <div className="flex gap-2">
                  <span className="text-gray-500 w-32 flex-shrink-0">Người GD:</span>
                  <strong>{detail.nguoi_giao_dich}</strong>
                </div>
              )}
              {detail.dien_giai&&(
                <div className="flex gap-2 col-span-2">
                  <span className="text-gray-500 w-32 flex-shrink-0">Diễn Giải:</span>
                  <strong>{detail.dien_giai}</strong>
                </div>
              )}
              {detail.updated_from_pnm_at&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Cập nhật từ PNM:</span>
                <strong className="text-orange-600 text-xs">{detail.updated_from_pnm_at.slice(0,16).replace('T',' ')}</strong>
              </div>
            )}
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Tổng SL:</span>
                <strong>{fmtN(detail.tong_so_luong||0)}</strong>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 flex-shrink-0">Trạng Thái:</span>
                <Badge v={(detail.TrangThai||detail.trang_thai)==='POSTED'?'success':'warning'}>
                  {detail.TrangThai||detail.trang_thai||'DRAFT'}
                </Badge>
              </div>
            </div>

            {/* ── BẢNG HÀNG HÓA ── */}
            <p className="text-xs font-bold text-gray-700 mb-2">
              📦 Chi Tiết Hàng Xuất
              <span className="ml-2 font-normal text-gray-400">({items.length} dòng)</span>
            </p>
            {items.length>0
              ?<div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-blue-50 border-b-2 border-blue-200">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs font-bold text-blue-700 w-10">STT</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700">Tên Hàng Hóa</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-blue-700 w-20">Kho</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-16">SL</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-28">Đơn Giá</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-28">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item,i)=>(
                      <tr key={i} className="hover:bg-red-50/30">
                        <td className="px-3 py-2.5 text-center text-gray-400 text-xs">{i+1}</td>
                        <td className="px-3 py-2.5 font-medium text-sm">
                          {getProductName(item.product_id)}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                            {getWarehouseName(item.warehouse_id)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm font-semibold">
                          {fmtN(item.quantity)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm">
                          {fmtN(item.unit_price)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-blue-700">
                          {fmtN(item.total||(+item.quantity * +item.unit_price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                    <tr>
                      <td colSpan={5} className="px-3 py-3 font-bold text-right text-sm text-blue-800">
                        Tổng Thanh Toán:
                      </td>
                      <td className="px-3 py-3 text-right font-bold font-mono text-blue-700 text-base">
                        {fmt(totalItems||detail.TongTien||detail.tong_tien||0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              :<div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <div className="text-3xl mb-2">📭</div>
                <p className="text-sm">Không có dữ liệu hàng hóa</p>
              </div>
            }

            <div className="flex justify-end gap-2 mt-4">
              {detail&&<Btn v="warning" onClick={()=>openEdit(detail)}>✏️ Sửa Phiếu</Btn>}
              <Btn v="outline" onClick={()=>{setDetailModal(false);setDetail(null)}}>Đóng</Btn>
            </div>
          </>
        }
      </Modal>
    )
  }

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <PXKDetailModal/>

    {editModal&&editForm&&<Modal open={editModal} onClose={()=>setEditModal(false)}
      title={`✏️ Sửa Phiếu Xuất Kho - ${editForm.so_phieu_xuat}`} size="lg">
      {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Inp label="Số Phiếu" value={editForm.so_phieu_xuat} disabled hint="Không thể sửa"/>
        <Inp label="Ngày Phiếu" req type="date" value={editForm.ngay_phieu_xuat}
          onChange={e=>setEditForm(f=>({...f,ngay_phieu_xuat:e.target.value}))}/>
        <Sel label="Kỳ Kế Toán" req value={editForm.ky_ke_toan_id||''}
          onChange={e=>setEditForm(f=>({...f,ky_ke_toan_id:e.target.value}))}
          options={kyOptions}/>
        <Sel label="Loại Phiếu" value={editForm.loai_phieu_xuat}
          onChange={e=>setEditForm(f=>({...f,loai_phieu_xuat:e.target.value}))}
          options={[
            {value:'Xuất bán',label:'Xuất bán'},
            {value:'Xuất hàng hỏng',label:'Xuất hàng hỏng'},
            {value:'Sử dụng nội bộ',label:'Sử dụng nội bộ'},
            {value:'Xuất chuyển kho',label:'Xuất chuyển kho'},
            {value:'Xuất khác',label:'Xuất khác'},
          ]}/>
        <div className="col-span-2">
          <Sel label="Khách Hàng" value={editForm.khach_hang_id||''}
            onChange={e=>setEditForm(f=>({...f,khach_hang_id:e.target.value}))}
            options={customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))}/>
        </div>
        <Inp label="Người Giao Dịch" value={editForm.nguoi_giao_dich||''}
          onChange={e=>setEditForm(f=>({...f,nguoi_giao_dich:e.target.value}))}/>
        <div className="col-span-2">
          <Inp label="Diễn Giải" value={editForm.dien_giai||''}
            onChange={e=>setEditForm(f=>({...f,dien_giai:e.target.value}))}/>
        </div>
      </div>
      <p className="text-xs font-bold text-gray-600 mb-1">📦 Danh Sách Hàng Xuất:</p>
      <DetailTbl
        rows={editRows} setRows={setEditRows}
        products={products} warehouses={warehouses}
        color="blue" hasWarehouse={true} warehouseLabel="Kho Xuất"
        units={units} onProductCreated={reloadProducts}/>
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between">
        <span className="text-sm font-bold text-blue-800">Tổng Thanh Toán:</span>
        <span className="text-lg font-bold text-blue-700 font-mono">
          {fmt(editRows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0))}
        </span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
        <Btn v="success" onClick={saveEdit} disabled={editLoading}>
          {editLoading?'Đang lưu...':'💾 Lưu Thay Đổi'}
        </Btn>
      </div>
    </Modal>}

    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]}
      active={tab}
      onChange={t=>{
        setTab(t)
        if(t==='create'){setForm(makeEmptyForm(data));setRows(emptyRows())}
      }}/>

    {/* ── DANH SÁCH ── */}
    {tab==='list'&&<Card>
      <CH>
        <h3 className="font-bold">📤 Danh Sách Phiếu Xuất Kho</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={()=>exportExcel('PhieuXuatKho','Phiếu Xuất Kho',
            ['Số Phiếu','Ngày','Loại','Tổng SL','Tổng Tiền','Trạng Thái'],
            data.map(r=>[r.so_phieu_xuat,fmtDate(r.ngay_phieu_xuat),r.loai_phieu_xuat,r.tong_so_luong,r.tong_tien,r.trang_thai])
          )}>⬇ Excel</Btn>
        </div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-red-600 bg-blue-50 border-b border-blue-100">
        💡 Click vào Số Phiếu để xem chi tiết
      </p>
      <Tbl data={data} loading={loading} empty="Chưa có phiếu xuất kho" cols={[
        {k:'so_phieu_xuat',l:'Số Phiếu',w:'160px',fn:(v,r)=>(
          <button onClick={()=>openDetail(r)}
            className="text-blue-600 hover:underline font-mono text-xs font-semibold">
            {v||'-'}
          </button>
        )},
        {k:'ngay_phieu_xuat',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
        {k:'loai_phieu_xuat',l:'Loại Phiếu',w:'150px',fn:v=>(
          <Badge v="danger">{v||'-'}</Badge>
        )},
        {k:'khach_hang_id',l:'Khách Hàng',fn:(v,r)=>{
          if(v){
            const kh=customers.find(x=>String(x.id)===String(v))
            const ten=kh?(kh.TenKH||kh.name):'-'
            return <span className="font-medium">{ten}</span>
          }
          if(r.ten_khach_le)
            return <span className="font-medium">{r.ten_khach_le} <span className="text-xs text-orange-500">(Khách lẻ)</span></span>
          return <span className="text-gray-400">-</span>
        }},
        {k:'tong_so_luong',l:'Tổng SL',w:'100px',r:true,fn:v=><span className="font-semibold text-green-700">{fmt(v||0)}</span>},
        {k:'tong_tien',l:'Tổng Tiền',w:'150px',r:true,
          fn:v=><span className="font-semibold text-red-700">{fmt(v||0)}</span>
        },
        {k:'trang_thai',l:'STATUS',w:'90px',
          fn:v=><Badge v={v==='POSTED'?'success':'warning'}>{v||'DRAFT'}</Badge>
        },
      ]}/>
    </Card>}

    {/* ── TẠO MỚI ── */}
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">📤 Tạo Phiếu Xuất Kho</h3></CH>
      <CB>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Inp label="Số Phiếu Xuất" req value={form.so_phieu_xuat}
            onChange={sf('so_phieu_xuat')} hint="Tự sinh, có thể sửa"/>
          <Inp label="Ngày Phiếu Xuất" req type="date" value={form.ngay_phieu_xuat}
            onChange={sf('ngay_phieu_xuat')}/>
          <Sel label="Loại Phiếu Xuất" value={form.loai_phieu_xuat}
            onChange={sf('loai_phieu_xuat')}
            options={[
              {value:'Xuất bán',label:'Xuất bán'},
              {value:'Xuất hàng hỏng',label:'Xuất hàng hỏng'},
              {value:'Sử dụng nội bộ',label:'Sử dụng nội bộ'},
              {value:'Xuất chuyển kho',label:'Xuất chuyển kho'},
              {value:'Xuất khác',label:'Xuất khác'},
            ]}/>
          <div className="col-span-2">
            <Sel label="Khách Hàng" value={form.khach_hang_id}
              onChange={sf('khach_hang_id')}
              options={customers.map(c=>({
                value:c.id,
                label:`${c.TenKH||c.name} (${c.MaKH||c.code})`
              }))}/>
          </div>
          <Inp label="Người Giao Dịch" value={form.nguoi_giao_dich}
            onChange={sf('nguoi_giao_dich')}/>
          <Sel label="Kỳ Kế Toán" req value={form.ky_ke_toan_id} onChange={sf('ky_ke_toan_id')} options={kyOptions}/>
          <div className="col-span-2">
            <Inp label="Diễn Giải" value={form.dien_giai} onChange={sf('dien_giai')}/>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-600 mb-1">Chi Tiết Hàng Xuất:</p>
        <DetailTbl
          rows={rows} setRows={setRows}
          products={products} warehouses={warehouses}
          color="blue" hasWarehouse={true} warehouseLabel="Kho Xuất"
          units={units} onProductCreated={reloadProducts}/>
      </CB>
      <CF>
        <Btn v="outline" onClick={()=>{
          setTab('list')
          setForm(makeEmptyForm(data))
          setRows(emptyRows())
        }}>Hủy</Btn>
        <Btn v="success" onClick={save}>💾 Lưu & Đóng</Btn>
      </CF>
    </Card>}
  </div>)
}



// ══ THANH TOÁN LƯƠNG - Tạo CTL + Tính lương + Xuất Excel
const PayrollPage=()=>{
  const {kyList,options:kyOptions}=useKyKeToan()
  const [data,setData]=useState([])
  const [loading,setLoading]=useState(false)
  const [employees,setEmployees]=useState([])

  // Detail modal
  const [detailOpen,setDetailOpen]=useState(false)
  const [detailData,setDetailData]=useState(null)
  const [detailLoading,setDetailLoading]=useState(false)

  // Edit modal
  const [editOpen,setEditOpen]=useState(false)
  const [editData,setEditData]=useState(null)
  const [editSaving,setEditSaving]=useState(false)
  const [alert,showAlert,closeAlert]=useAlert()
  const [filterNV,setFilterNV]=useState('')
  const [filterTuNgay,setFilterTuNgay]=useState('')
  const [filterDenNgay,setFilterDenNgay]=useState('')
  const [filterKy,setFilterKy]=useState('')

  const load=()=>{
    setLoading(true)
    api('GET','/payroll').then(d=>{setData(Array.isArray(d)?d:[]);setLoading(false)})
  }
  useEffect(()=>{
    load()
    api('GET','/employees').then(d=>setEmployees(Array.isArray(d)?d:[]))
  },[])
  const filteredData=data.filter(r=>{
  if(filterKy&&String(r.ky_ke_toan_id)!==String(filterKy)) return false
  if(filterTuNgay&&r.ngay_chung_tu<filterTuNgay) return false
  if(filterDenNgay&&r.ngay_chung_tu>filterDenNgay) return false
  if(filterNV){
    const q=filterNV.toLowerCase()
    const match=(r.ten_nv_list||[]).some(n=>n.toLowerCase().includes(q))
    if(!match) return false
  }
  return true
})

  const openDetail=async(row)=>{
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailData(null)
    const r=await api('GET',`/payroll/${row.id}`)
    setDetailData(r)
    setDetailLoading(false)
  }

  const openEdit=async(row)=>{
    setDetailOpen(false)
    setEditOpen(true)
    setEditSaving(false)
    const r=await api('GET',`/payroll/${row.id}`)
    setEditData({
      id: r.id,
      so_chung_tu: r.so_chung_tu,
      ngay_chung_tu: r.ngay_chung_tu,
      ky_ke_toan_id: String(r.ky_ke_toan_id),
      dien_giai: r.dien_giai||'',
      details: (r.details||[]).map(d=>({
        employee_id: String(d.employee_id),
        ma_nv: d.ma_nv,
        ten_nv: d.ten_nv,
        so_luong_sp: d.so_luong_sp||0,
        tien_luong_sp: d.tien_luong_sp||0,
        so_cong: d.so_cong||0,
        luong_thoi_gian: d.luong_thoi_gian||0,
        tien_luong_nghi: d.tien_luong_nghi||0,
        pc_tu_quy_luong: d.pc_tu_quy_luong||0,
        phu_cap_khac: d.phu_cap_khac||0,
        tien_thuong: d.tien_thuong||0,
      }))
    })
  }

  const saveEdit=async()=>{
    if(!editData.ky_ke_toan_id){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
    if(!editData.details?.length){showAlert('Danh sách nhân viên không được rỗng!','danger');return}
    setEditSaving(true)
    const body={
      so_chung_tu: editData.so_chung_tu,
      ngay_chung_tu: editData.ngay_chung_tu,
      ky_ke_toan_id: Number(editData.ky_ke_toan_id),
      dien_giai: editData.dien_giai,
      details: editData.details.map(d=>({
        employee_id: Number(d.employee_id),
        so_luong_sp: Number(d.so_luong_sp)||0,
        tien_luong_sp: Number(d.tien_luong_sp)||0,
        so_cong: Number(d.so_cong)||0,
        luong_thoi_gian: Number(d.luong_thoi_gian)||0,
        tien_luong_nghi: Number(d.tien_luong_nghi)||0,
        pc_tu_quy_luong: Number(d.pc_tu_quy_luong)||0,
        phu_cap_khac: Number(d.phu_cap_khac)||0,
        tien_thuong: Number(d.tien_thuong)||0,
      }))
    }
    const r=await api('PUT',`/payroll/${editData.id}`,body)
    if(r&&!r.__error){
      showAlert('✅ Lưu chứng từ lương thành công!')
      setEditOpen(false)
      load()
    }else{
      showAlert('Lỗi lưu: '+(r?.message||'Lỗi không xác định'),'danger')
    }
    setEditSaving(false)
  }

  const setEditRow=(i,field,val)=>{
    setEditData(prev=>({...prev,
      details: prev.details.map((d,idx)=>idx===i?{...d,[field]:val}:d)
    }))
  }

  const addEditRow=()=>{
    setEditData(prev=>({...prev,
      details:[...prev.details,{
        employee_id:'',ma_nv:'',ten_nv:'',
        so_luong_sp:0,tien_luong_sp:0,so_cong:0,
        luong_thoi_gian:0,tien_luong_nghi:0,
        pc_tu_quy_luong:0,phu_cap_khac:0,tien_thuong:0
      }]
    }))
  }

  const removeEditRow=(i)=>{
    setEditData(prev=>({...prev,
      details:prev.details.filter((_,idx)=>idx!==i)
    }))
  }

  const onSelectEmployee=(i,empId)=>{
    const emp=employees.find(e=>String(e.id)===String(empId))
    if(!emp) return
    setEditData(prev=>({...prev,
      details:prev.details.map((d,idx)=>idx===i?{
        ...d,
        employee_id:String(emp.id),
        ma_nv:emp.ma_nv,
        ten_nv:emp.ten_nv,
        luong_thoi_gian:emp.luong_co_ban||0,
      }:d)
    }))
  }

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}

    <Card>
      <CH>
        <h3 className="font-bold">👥 Chứng Từ Thanh Toán Lương</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={()=>exportExcel(
              'BangLuong',`Bảng Lương`,
              ['Số CT','Ngày','Kỳ KT','Tổng Thu Nhập','Tổng Giảm Trừ','Thực Lãnh','Trạng Thái'],
              filteredData.map(r=>[
                r.so_chung_tu,
                fmtDate(r.ngay_chung_tu),
                kyList.find(k=>String(k.id)===String(r.ky_ke_toan_id))?.TenKy||r.ky_ke_toan_id,
                r.tong_thu_nhap,
                r.tong_giam_tru,
                r.tong_thuc_lanh,
                r.trang_thai||'DRAFT'
              ])
            )}>⬇ Bảng Lương</Btn>
        </div>
      </CH>
      <div className="flex gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
        <div className="w-44">
          <label className="text-xs text-gray-500 mb-1 block">📅 Kỳ KT</label>
          <select value={filterKy} onChange={e=>setFilterKy(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white">
            <option value="">Tất cả kỳ</option>
            {kyOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="w-36">
          <label className="text-xs text-gray-500 mb-1 block">📅 Từ ngày</label>
          <input type="date" value={filterTuNgay} onChange={e=>setFilterTuNgay(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"/>
        </div>
        <div className="w-36">
          <label className="text-xs text-gray-500 mb-1 block">📅 Đến ngày</label>
          <input type="date" value={filterDenNgay} onChange={e=>setFilterDenNgay(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"/>
        </div>
        <div className="flex-1 min-w-36">
          <label className="text-xs text-gray-500 mb-1 block">👤 Tên Nhân Viên</label>
          <input value={filterNV} onChange={e=>setFilterNV(e.target.value)}
            placeholder="Tìm tên NV..."
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"/>
        </div>
        {(filterKy||filterTuNgay||filterDenNgay||filterNV)&&
          <div className="flex items-end">
            <button onClick={()=>{setFilterKy('');setFilterTuNgay('');setFilterDenNgay('');setFilterNV('')}}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 border border-gray-300 rounded">
              ✕ Xóa lọc
            </button>
          </div>
        }
        <div className="flex items-end ml-auto">
          <span className="text-xs text-gray-400">{filteredData.length}/{data.length} phiếu</span>
        </div>
      </div>
      <Tbl data={filteredData} loading={loading} empty="Chưa có chứng từ lương" cols={[
          {k:'so_chung_tu',l:'Số CT',w:'150px',fn:(v,r)=>(
            <button onClick={()=>openDetail(r)}
              className="text-blue-600 hover:underline font-mono text-xs font-semibold">
              {v||'-'}
            </button>
          )},
          {k:'ngay_chung_tu',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
          {k:'ky_ke_toan_id',l:'Kỳ KT',w:'80px',fn:v=>{
            const ky=kyList.find(k=>String(k.id)===String(v))
            return<span className="text-xs">{ky?.MaKy||ky?.period_code||v}</span>
          }},
          {k:'tong_thu_nhap',l:'Tổng Thu Nhập',r:true,fn:v=>fmt(v)},
          {k:'tong_giam_tru',l:'Tổng Giảm Trừ',r:true,fn:v=><span className="text-red-600">{fmt(v)}</span>},
          {k:'tong_thuc_lanh',l:'Thực Lãnh',r:true,fn:v=><span className="text-green-700 font-bold">{fmt(v)}</span>},
          {k:'trang_thai',l:'TT',w:'90px',fn:v=><Badge v={v==='POSTED'?'success':'warning'}>{v||'DRAFT'}</Badge>},
          {k:'id',l:'',w:'50px',fn:(_,r)=>(
            <button title="Xuất Excel chi tiết"
              onClick={async(e)=>{
                e.stopPropagation()
                const detail=await api('GET',`/payroll/${r.id}`)
                if(!detail||detail.__error){return}
                const kyName=kyList.find(k=>String(k.id)===String(r.ky_ke_toan_id))?.TenKy||r.ky_ke_toan_id
                exportExcel(
                    `BL_${r.so_chung_tu}`.slice(0,31),
                    `Bảng Lương — ${r.so_chung_tu} — ${kyName}`,
                  ['Mã NV','Họ Tên','Chức Vụ','Phòng Ban','Lương SP','Số Công','Lương TG',
                  'Lương Nghỉ','PC Quỹ','PC Khác','Thưởng','Tổng TN','BHXH','BHYT','BHTN','Tổng KT','Thực Lãnh'],
                  (detail.details||[]).map(d=>[
                    d.ma_nv, d.ten_nv, d.chuc_vu||'', d.phong_ban||'',
                    d.tien_luong_sp, d.so_cong, d.luong_thoi_gian,
                    d.tien_luong_nghi, d.pc_tu_quy_luong, d.phu_cap_khac, d.tien_thuong,
                    d.tong_tien, d.tru_bhxh, d.tru_bhyt, d.tru_bhtn, d.tong_tru, d.thuc_lanh
                  ])
                )
              }}
              className="text-green-600 hover:text-green-800 text-lg">
             📊
            </button>
          )},
        ]}/>
    </Card>

    {/* ── DETAIL MODAL ── */}
    <Modal open={detailOpen} title={`📋 Chi Tiết CTL — ${detailData?.so_chung_tu||''}`} onClose={()=>setDetailOpen(false)} size="xl">
      {detailLoading?<div className="py-8 text-center text-gray-400">Đang tải...</div>:detailData&&<>
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div><span className="text-gray-500">Số CT:</span> <strong>{detailData.so_chung_tu}</strong></div>
          <div><span className="text-gray-500">Ngày:</span> <strong>{fmtDate(detailData.ngay_chung_tu)}</strong></div>
          <div><span className="text-gray-500">Kỳ KT:</span> <strong>{kyList.find(k=>String(k.id)===String(detailData.ky_ke_toan_id))?.TenKy||detailData.ky_ke_toan_id}</strong></div>
          <div><span className="text-gray-500">Trạng thái:</span> <Badge v="warning">{detailData.trang_thai}</Badge></div>
          {detailData.dien_giai&&<div className="col-span-2"><span className="text-gray-500">Diễn giải:</span> {detailData.dien_giai}</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-2 py-2 text-left">Mã NV</th>
                <th className="px-2 py-2 text-left">Họ Tên</th>
                <th className="px-2 py-2 text-left">Chức Vụ</th>
                <th className="px-2 py-2 text-right">SL SP</th>
                <th className="px-2 py-2 text-right">Lương SP</th>
                <th className="px-2 py-2 text-right">Số Công</th>
                <th className="px-2 py-2 text-right">Lương TG</th>
                <th className="px-2 py-2 text-right">Phụ Cấp</th>
                <th className="px-2 py-2 text-right">Thưởng</th>
                <th className="px-2 py-2 text-right font-bold">Tổng TN</th>
                <th className="px-2 py-2 text-right text-red-600">BHXH</th>
                <th className="px-2 py-2 text-right text-red-600">BHYT</th>
                <th className="px-2 py-2 text-right text-red-600">BHTN</th>
                <th className="px-2 py-2 text-right font-bold text-green-700">Thực Lãnh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(detailData.details||[]).map((d,i)=>(
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5"><Code v={d.ma_nv}/></td>
                  <td className="px-2 py-1.5 font-medium">{d.ten_nv}</td>
                  <td className="px-2 py-1.5 text-gray-500">{d.chuc_vu||'—'}</td>
                  <td className="px-2 py-1.5 text-right">{fmtN(d.so_luong_sp)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(d.tien_luong_sp)}</td>
                  <td className="px-2 py-1.5 text-right">{fmtN(d.so_cong)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(d.luong_thoi_gian)}</td>
                  <td className="px-2 py-1.5 text-right">{fmt((+d.pc_tu_quy_luong||0)+(+d.phu_cap_khac||0))}</td>
                  <td className="px-2 py-1.5 text-right">{fmt(d.tien_thuong)}</td>
                  <td className="px-2 py-1.5 text-right font-bold">{fmt(d.tong_tien)}</td>
                  <td className="px-2 py-1.5 text-right text-red-600">{fmt(d.tru_bhxh)}</td>
                  <td className="px-2 py-1.5 text-right text-red-600">{fmt(d.tru_bhyt)}</td>
                  <td className="px-2 py-1.5 text-right text-red-600">{fmt(d.tru_bhtn)}</td>
                  <td className="px-2 py-1.5 text-right font-bold text-green-700">{fmt(d.thuc_lanh)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan={9} className="px-2 py-2 font-bold text-sm">Tổng:</td>
                <td className="px-2 py-2 text-right font-bold">{fmt(detailData.tong_thu_nhap)}</td>
                <td colSpan={3} className="px-2 py-2 text-right font-bold text-red-600">{fmt(detailData.tong_giam_tru)}</td>
                <td className="px-2 py-2 text-right font-bold text-green-700">{fmt(detailData.tong_thuc_lanh)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          {detailData.trang_thai!=='POSTED'&&
            <Btn v="warning" onClick={()=>openEdit(detailData)}>✏️ Sửa Phiếu</Btn>}
          <Btn onClick={()=>setDetailOpen(false)}>Đóng</Btn>
        </div>
      </>}
    </Modal>
    

    {/* ── EDIT MODAL ── */}
    <Modal open={editOpen&&!!editData} title={`✏️ Sửa CTL — ${editData?.so_chung_tu||''}`} onClose={()=>setEditOpen(false)} size="xl">
  {!editData?<div className="py-8 text-center text-gray-400">Đang tải...</div>:
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Inp label="Số Chứng Từ" req value={editData.so_chung_tu}
            onChange={e=>setEditData(p=>({...p,so_chung_tu:e.target.value}))}/>
          <Inp label="Ngày" req type="date" value={editData.ngay_chung_tu}
            onChange={e=>setEditData(p=>({...p,ngay_chung_tu:e.target.value}))}/>
          <Sel label="Kỳ Kế Toán" req value={editData.ky_ke_toan_id}
            onChange={e=>setEditData(p=>({...p,ky_ke_toan_id:e.target.value}))}
            options={kyOptions}/>
          <Inp label="Diễn Giải" value={editData.dien_giai}
            onChange={e=>setEditData(p=>({...p,dien_giai:e.target.value}))}/>
        </div>

        {/* Bảng nhân viên */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm">Danh Sách Nhân Viên</span>
            <Btn size="sm" onClick={addEditRow}>+ Thêm dòng</Btn>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 text-left w-44">Nhân Viên</th>
                  <th className="px-2 py-2 text-right w-20">SL SP</th>
                  <th className="px-2 py-2 text-right w-24">Lương SP</th>
                  <th className="px-2 py-2 text-right w-20">Số Công</th>
                  <th className="px-2 py-2 text-right w-28">Lương TG</th>
                  <th className="px-2 py-2 text-right w-24">Lương Nghỉ</th>
                  <th className="px-2 py-2 text-right w-24">PC Quỹ</th>
                  <th className="px-2 py-2 text-right w-24">PC Khác</th>
                  <th className="px-2 py-2 text-right w-24">Thưởng</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {editData.details.map((d,i)=>(
                  <tr key={i}>
                    <td className="px-1 py-1">
                      <select value={d.employee_id||''} onChange={e=>onSelectEmployee(i,e.target.value)}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs bg-white">
                        <option value="">-- Chọn NV --</option>
                        {employees.map(e=><option key={e.id} value={e.id}>{e.ma_nv} — {e.ten_nv}</option>)}
                      </select>
                    </td>
                    {['so_luong_sp','tien_luong_sp','so_cong','luong_thoi_gian',
                      'tien_luong_nghi','pc_tu_quy_luong','phu_cap_khac','tien_thuong'].map(f=>(
                      <td key={f} className="px-1 py-1">
                        <input type="number" value={d[f]||0} onChange={e=>setEditRow(i,f,e.target.value)}
                          className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs text-right"/>
                      </td>
                    ))}
                    <td className="px-1 py-1 text-center">
                      <button onClick={()=>removeEditRow(i)}
                        className="text-red-400 hover:text-red-600 text-sm font-bold">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Btn onClick={()=>setEditOpen(false)}>Hủy</Btn>
          <Btn v="success" onClick={saveEdit} disabled={editSaving}>
            {editSaving?'⏳ Đang lưu...':'💾 Lưu'}
          </Btn>
        </div>
      </div>
      }
    </Modal>
  </div>)
}

// ══ BÁO CÁO BẢNG LƯƠNG (Excel)
const RptPayrollFixed = () => {
  const [data, loading] = useList('/employees')
  const [cfg, setCfg] = useState(null)
  useEffect(() => { api('GET', '/payroll-config').then(d => setCfg(d)) }, [])

  const rows = data.map(e => ({
    ma: e.ma_nv, ten: e.ten_nv, luong: e.luong_co_ban || 0,
    bhxh: Math.round((e.luong_co_ban || 0) * (cfg?.ty_le_bhxh || 8) / 100),
    bhyt: Math.round((e.luong_co_ban || 0) * (cfg?.ty_le_bhyt || 1.5) / 100),
    bhtn: Math.round((e.luong_co_ban || 0) * (cfg?.ty_le_bhtn || 1) / 100),
    thuc: Math.round((e.luong_co_ban || 0) * (1 - ((cfg?.ty_le_bhxh || 8) + (cfg?.ty_le_bhyt || 1.5) + (cfg?.ty_le_bhtn || 1)) / 100)),
  }))

  const doExcel = () => exportExcel('BaoCaoBangLuong', 'Bảng Lương',
    ['Mã NV', 'Tên NV', 'Lương CB', 'BHXH', 'BHYT', 'BHTN', 'Thực Lãnh'],
    rows.map(r => [r.ma, r.ten, r.luong, r.bhxh, r.bhyt, r.bhtn, r.thuc])
  )

  return (
    <Card>
      <CH>
        <h3 className="font-bold">💼 Bảng Lương - Tháng 4/2026</h3>
        <div className="ml-auto"><Btn v="excel" size="sm" onClick={doExcel}>⬇ Xuất Excel</Btn></div>
      </CH>
      <Tbl data={rows} loading={loading} empty="Chưa có nhân viên" cols={[
        { k: 'ma', l: 'Mã NV', w: '100px', fn: v => <Code v={v} /> },
        { k: 'ten', l: 'Tên NV', fn: v => <span className="font-medium">{v}</span> },
        { k: 'luong', l: 'Lương CB', r: true, fn: v => fmtN(v) },
        { k: 'bhxh', l: 'BHXH', r: true, fn: v => <span className="text-orange-600">{fmtN(v)}</span> },
        { k: 'bhyt', l: 'BHYT', r: true, fn: v => <span className="text-orange-600">{fmtN(v)}</span> },
        { k: 'bhtn', l: 'BHTN', r: true, fn: v => <span className="text-orange-600">{fmtN(v)}</span> },
        { k: 'thuc', l: 'Thực Lãnh', r: true, fn: v => <span className="text-green-700 font-bold">{fmt(v)}</span> },
      ]} />
      {rows.length > 0 && (
        <div className="px-4 py-2.5 bg-gray-100 border-t-2 border-gray-300 grid grid-cols-7 gap-4 text-sm font-bold">
          <span className="col-span-2">TỔNG CỘNG</span>
          <span className="text-right font-mono">{fmtN(rows.reduce((s, r) => s + r.luong, 0))}</span>
          <span className="text-right font-mono text-orange-600">{fmtN(rows.reduce((s, r) => s + r.bhxh, 0))}</span>
          <span className="text-right font-mono text-orange-600">{fmtN(rows.reduce((s, r) => s + r.bhyt, 0))}</span>
          <span className="text-right font-mono text-orange-600">{fmtN(rows.reduce((s, r) => s + r.bhtn, 0))}</span>
          <span className="text-right font-mono text-green-700">{fmt(rows.reduce((s, r) => s + r.thuc, 0))}</span>
        </div>
      )}
    </Card>
  )
}

// ══ PAGES ════════════════════════════════════════

// DASHBOARD
const Dashboard=({onNav})=>{
  const [stats,setStats]=useState({thu:0,chi:0,bank:0,sp:0}); const [loading,setLoading]=useState(true)
  useEffect(()=>{
    Promise.all([api('GET','/documents/phieu-thu'),api('GET','/documents/phieu-chi'),api('GET','/banking/accounts'),api('GET','/products')])
    .then(([pt,pc,acc,prod])=>{
      setStats({
        thu:Array.isArray(pt)?pt.reduce((s,p)=>s+(p.TienThu||p.so_tien||0),0):0,
        chi:Array.isArray(pc)?pc.reduce((s,p)=>s+(p.TienChi||p.so_tien||0),0):0,
        bank:Array.isArray(acc)?acc.reduce((s,a)=>s+(a.so_du_hien_tai||0),0):0,
        sp:Array.isArray(prod)?prod.length:0,
      })
      setLoading(false)
    })
  },[])
  return(
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[{icon:'💰',l:'Tổng Thu',v:fmt(stats.thu),bg:'bg-green-50 border-green-200',tc:'text-green-700',ic:'bg-green-100'},
          {icon:'💸',l:'Tổng Chi',v:fmt(stats.chi),bg:'bg-red-50 border-red-200',tc:'text-red-700',ic:'bg-red-100'},
          {icon:'🏦',l:'Số Dư NH',v:fmt(stats.bank),bg:'bg-blue-50 border-blue-200',tc:'text-blue-700',ic:'bg-blue-100'},
          {icon:'📦',l:'Sản Phẩm',v:stats.sp+' SP',bg:'bg-yellow-50 border-yellow-200',tc:'text-yellow-700',ic:'bg-yellow-100'},
        ].map((s,i)=>(
          <div key={i} className={`rounded-lg border p-4 flex items-center gap-3 ${s.bg}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${s.ic}`}>{s.icon}</div>
            <div><div className="text-xs text-gray-500 font-medium">{s.l}</div><div className={`text-base font-bold font-mono ${s.tc}`}>{loading?'...':s.v}</div></div>
          </div>
        ))}
      </div>
      <Card><CH><h3 className="font-bold">🚀 Nghiệp Vụ Nhanh</h3></CH>
        <CB><div className="grid grid-cols-4 gap-3">
          {[['💰 Phiếu Thu','nv-pt','primary'],['📥 Nhập Kho','nv-pnk','outline'],['🏦 TTG','nv-ttg','outline'],['👥 Thanh Toán Lương','nv-payroll','outline']]
            .map(([l,p,v])=><Btn key={p} v={v} onClick={()=>onNav(p)} className="w-full justify-center">{l}</Btn>)}
        </div></CB>
      </Card>
    </div>
  )
}

// HỆ THỐNG: đơn giản
const CompanyInfo=()=>{
  const [form,setForm]=useState({name:'',address:'',tax_code:'',director:'',accountant:'',phone:'',email:'',bank:'',bank_account:'',regime:'TT133'})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">🏢 Thông Tin Doanh Nghiệp</h3></CH>
      <CB><div className="grid grid-cols-3 gap-3">
        <div className="col-span-2"><Inp label="Tên Công Ty / Hộ Kinh Doanh" req value={form.name} onChange={sf('name')}/></div>
        <Inp label="Mã Số Thuế" value={form.tax_code} onChange={sf('tax_code')}/>
        <div className="col-span-3"><Inp label="Địa Chỉ" value={form.address} onChange={sf('address')}/></div>
        <Inp label="Giám Đốc" value={form.director} onChange={sf('director')}/><Inp label="Kế Toán Trưởng" value={form.accountant} onChange={sf('accountant')}/>
        <Inp label="Điện Thoại" value={form.phone} onChange={sf('phone')}/>
        <Inp label="Email" type="email" value={form.email} onChange={sf('email')}/>
        <Inp label="Ngân Hàng" value={form.bank} onChange={sf('bank')}/><Inp label="Số TK" value={form.bank_account} onChange={sf('bank_account')}/>
        <Sel label="Chế Độ Kế Toán" value={form.regime} onChange={sf('regime')} options={[{value:'TT133',label:'Thông tư 133/2016'},{value:'TT200',label:'Thông tư 200/2014'}]}/>
      </div></CB>
      <CF><Btn onClick={()=>showAlert('Lưu thành công!')}>💾 Lưu</Btn></CF>
    </Card>
  </div>)
}

const FiscalYear=()=>{
  const [modal,setModal]=useState(false)
  const [rows,setRows]=useState([{year:2026,start:'01/01/2026',end:'31/12/2026',close:'-',status:true},{year:2025,start:'01/01/2025',end:'31/12/2025',close:'31/01/2026',status:false}])
  const [form,setForm]=useState({year:'',start:'',end:'',close:''})
  const [alert,showAlert,closeAlert]=useAlert()
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">📅 Khai Báo Năm Tài Chính</h3><div className="ml-auto"><Btn size="sm" onClick={()=>setModal(true)}>+ Thêm</Btn></div></CH>
      <Tbl data={rows} loading={false} cols={[{k:'year',l:'Năm TC',w:'80px',fn:v=><strong>{v}</strong>},{k:'start',l:'Ngày Đầu',w:'120px'},{k:'end',l:'Ngày Kết Thúc',w:'130px'},{k:'close',l:'Ngày Khóa',w:'120px'},{k:'status',l:'TT',w:'100px',fn:v=><Badge v={v?'success':'gray'}>{v?'Đang Dùng':'Đã Khóa'}</Badge>}]}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="📅 Thêm Năm Tài Chính">
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Năm TC" req type="number" value={form.year} onChange={e=>setForm(f=>({...f,year:e.target.value}))}/>
        <Inp label="Ngày Đầu Năm" req type="date" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))}/>
        <Inp label="Ngày Kết Thúc" req type="date" value={form.end} onChange={e=>setForm(f=>({...f,end:e.target.value}))}/>
        <Inp label="Ngày Khóa" type="date" value={form.close} onChange={e=>setForm(f=>({...f,close:e.target.value}))}/>
      </div>
      <div className="flex justify-end gap-2 mt-4"><Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn>
        <Btn onClick={()=>{setRows(r=>[{year:form.year,start:form.start,end:form.end,close:form.close||'-',status:true},...r]);showAlert('Thêm thành công!');setModal(false)}}>💾 Lưu</Btn></div>
    </Modal>
  </div>)
}

const Currency = () => (
  <LocalCatalog
    title="Danh Mục Ngoại Tệ" icon="💱"
    configKey="currencies"
    cols={[
      {k:'code', l:'Mã NT', w:'80px', fn:v=><Code v={v}/>},
      {k:'name', l:'Tên Ngoại Tệ'},
      {k:'ky_hieu', l:'Ký Hiệu', w:'70px', fn:v=>v||'-'},
      {k:'ty_gia', l:'Tỷ Giá (VND)', w:'130px', r:true, fn:v=>fmtN(v||0)},
      {k:'is_active', l:'TT', w:'60px', fn:v=><StatusBadge v={v}/>},
    ]}
    modalFields={[
      {key:'code', label:'Mã NT', req:true, placeholder:'USD'},
      {key:'name', label:'Tên Ngoại Tệ', req:true, placeholder:'Đô la Mỹ'},
      {key:'ky_hieu', label:'Ký Hiệu', placeholder:'$'},
      {key:'ty_gia', label:'Tỷ Giá (VND)', placeholder:'25400'},
    ]}
    initForm={{code:'', name:'', ky_hieu:'', ty_gia:1, is_active:true}}
  />
)

const DocType=()=>(
  <Card><CH><h3 className="font-bold">📄 Khai Báo Mẫu Chứng Từ</h3></CH>
    <Tbl loading={false} data={['PT','PC','TTG','CTG','PNM','PBH','BL1','PN','PX'].map((ma,i)=>({ma,ten:['Phiếu Thu','Phiếu Chi','Thu Tiền Gửi','Chi Tiền Gửi','Phiếu Nhập Mua','Phiếu Bán Hàng','Phiếu Bán Lẻ','Phiếu Nhập Kho','Phiếu Xuất Kho'][i],active:true}))} cols={[{k:'ma',l:'Mã CT',w:'80px',fn:v=><Code v={v}/>},{k:'ten',l:'Tên Chứng Từ'},{k:'active',l:'Sử Dụng',w:'80px',fn:v=><StatusBadge v={v}/>}]}/>
  </Card>
)

const Users=()=>(
  <Card><CH><h3 className="font-bold">👤 Danh Sách Người Dùng</h3><div className="ml-auto"><Badge v="warning">Cập Nhật Sau</Badge></div></CH>
    <Tbl loading={false} data={[{username:'admin',fullname:'Quản Trị Viên',role:'Admin',email:'admin@hkd.com',active:true}]} cols={[{k:'username',l:'Tên ĐN',w:'140px',fn:v=><Code v={v}/>},{k:'fullname',l:'Họ Tên'},{k:'role',l:'Vai Trò',w:'80px',fn:v=><Badge v="primary">{v}</Badge>},{k:'email',l:'Email'},{k:'active',l:'TT',w:'70px',fn:v=><StatusBadge v={v}/>}]}/>
  </Card>
)

const SystemParams=()=>{
  const [tab,setTab]=useState('sl')
  const P={
    sl:[['Số thập phân số lượng','2',''],['Số thập phân trường giá','0',''],['Ký hiệu ngăn cách nguyên-thập phân',',',''],['Ký hiệu phân cách nghìn','.',''],['Định dạng SL in','{0:#,##0.##}',''],['Định dạng tiền in','{0:#,##0}',''],['Định dạng ngày in','{0:dd/MM/yyyy}','']],
    hk:[['Kê khai DT trước hay sau giảm thuế?','0','0-Trước GTGT; 1-Sau GTGT'],['Xử lý chênh lệch giá trung bình','1','0-Không; 1-Tạo PX điều chỉnh'],['Tự động thu khi lập HĐBH?','2','0-Không; 1-Tạo PT; 2-Dùng HĐ'],['DS quỹ tự động tạo PT','TM;NH1',''],['Tự động xuất kho khi lập HĐBH?','2','0-Không; 2-Dùng HĐ'],['Cảnh báo xuất kho không đủ tồn','0','0-Không; 1-Cảnh báo; 2-Cấm xuất âm'],['Thuế suất TNCN (%)','15','']],
    inv:[['NCC hóa đơn điện tử','NoInvoice',''],['TK đăng nhập Portal','',''],['URL API','',''],['Content-type','application/json',''],['Hình thức ký số','USB','']],
  }
  const [vals,setVals]=useState(P)
  const [alert,showAlert,closeAlert]=useAlert()
  return(
    <Card><CH><h3 className="font-bold">⚙️ Thiết Lập Tham Số Hệ Thống</h3></CH>
      <CB>
        {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
        <div className="flex gap-1 border-b border-gray-200 mb-4">
          {[{id:'sl',l:'SL - Hệ Thống'},{id:'hk',l:'HK - Hộ Kinh Doanh'},{id:'inv',l:'Invoice - HĐĐT'}].map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab===t.id?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>{t.l}</button>
          ))}
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 border-b-2 border-gray-200"><tr><th className="px-3 py-2.5 text-left text-xs font-bold uppercase w-10">STT</th><th className="px-3 py-2.5 text-left text-xs font-bold uppercase">Tên Tham Số</th><th className="px-3 py-2.5 text-left text-xs font-bold uppercase w-48">Giá Trị</th><th className="px-3 py-2.5 text-left text-xs font-bold uppercase">Mô Tả</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {vals[tab].map((r,i)=>(
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-center text-gray-400 font-mono text-xs">{i+1}</td>
                <td className="px-3 py-2 text-gray-700">{r[0]}</td>
                <td className="px-3 py-2"><input value={r[1]} onChange={e=>setVals(p=>({...p,[tab]:p[tab].map((row,ri)=>ri===i?[row[0],e.target.value,row[2]]:row)}))} className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/></td>
                <td className="px-3 py-2 text-gray-400 text-xs">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </CB>
      <CF><Btn onClick={()=>showAlert('Lưu tham số thành công!')}>💾 Lưu</Btn></CF>
    </Card>
  )
}

const ReProcess=({type})=>{
  const [form,setForm]=useState({loai:'',tu:'',den:''}); const [alert,showAlert,closeAlert]=useAlert()
  return(<div className="max-w-lg space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">{type==='renum'?'🔢 Đánh Lại Số CT':'🔁 Ghi Lại CT'}</h3></CH>
      <CB><div className="space-y-3">
        <Sel label="Loại CT" req value={form.loai} onChange={e=>setForm(f=>({...f,loai:e.target.value}))} options={['BL1 - Bán Lẻ','TTG - Thu TG','CTG - Chi TG','PT - Phiếu Thu','PC - Phiếu Chi','PNM - Phiếu Nhập Mua','PN - Phiếu Nhập Kho']}/>
        <div className="grid grid-cols-2 gap-3"><Inp label="Từ Tháng" type="date" value={form.tu} onChange={e=>setForm(f=>({...f,tu:e.target.value}))}/><Inp label="Đến Tháng" type="date" value={form.den} onChange={e=>setForm(f=>({...f,den:e.target.value}))}/></div>
        <Alert msg="⚠️ Thao tác này không thể hoàn tác!" type="warning"/>
      </div></CB>
      <CF><Btn v="danger" onClick={()=>showAlert('Thực hiện thành công!','success')}>🔄 Thực Hiện</Btn></CF>
    </Card>
  </div>)
}

// ══ DANH MỤC - dùng đúng field API

// KHÁCH HÀNG - API dùng MaKH, TenKH, SDT, Email, MST, HanMucTinDung, ConHoatDong
const Customers=()=>{
  const [data,loading,load]=useList('/customers')
  const [filtered,q,setQ]=useSearch(data,['TenKH','MaKH','SDT','name','code'])
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState({MaKH:'',TenKH:'',SDT:'',Email:'',DiaChi:'',MST:'',HanMucTinDung:0,ConHoatDong:true})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    if(!form.MaKH||!form.TenKH){showAlert('Vui lòng nhập Mã KH và Tên KH!','danger');return}
    const r=await api('POST','/customers',{...form,HanMucTinDung:+form.HanMucTinDung})
    if(r){showAlert(`Tạo KH ${r.MaKH||r.code||form.MaKH} thành công!`);setModal(false);setForm({MaKH:'',TenKH:'',SDT:'',Email:'',DiaChi:'',MST:'',HanMucTinDung:0,ConHoatDong:true});load()}
    else showAlert('Lỗi! Kiểm tra Mã KH đã tồn tại chưa.','danger')
  }
  const getVal=(row,keys)=>{ for(const k of keys){ if(row[k]!==undefined&&row[k]!==null) return row[k] } return '-' }
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">👥 Danh Mục Khách Hàng</h3>
      <div className="ml-auto flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Tìm..." className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"/>
        <Btn size="sm" onClick={()=>setModal(true)}>+ Thêm</Btn><Btn v="excel" size="sm">⬇ Excel</Btn>
      </div>
    </CH>
      <Tbl data={filtered} loading={loading} empty="Chưa có khách hàng" cols={[
        {k:'MaKH',l:'Mã KH',w:'100px',fn:(v,r)=><Code v={v||r.code}/>},
        {k:'TenKH',l:'Tên KH',fn:(v,r)=><span className="font-medium">{v||r.name}</span>},
        {k:'SDT',l:'Điện Thoại',w:'120px',fn:(v,r)=>v||r.phone||'-'},
        {k:'DiaChi',l:'Địa Chỉ',fn:(v,r)=>v||r.address||'-'},
        {k:'MST',l:'MST',w:'110px',fn:(v,r)=>v||r.tax_code||'-'},
        {k:'HanMucTinDung',l:'Hạn Mức',w:'120px',r:true,fn:(v,r)=>fmtN(v||r.credit_limit||0)},
        {k:'ConHoatDong',l:'TT',w:'70px',fn:(v,r)=><StatusBadge v={v!==undefined?v:(r.is_active!==undefined?r.is_active:true)}/>},
      ]}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="👥 Thêm Khách Hàng">
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã KH (MaKH)" req value={form.MaKH} onChange={sf('MaKH')} placeholder="KH-001"/>
        <Inp label="Tên Khách Hàng (TenKH)" req value={form.TenKH} onChange={sf('TenKH')}/>
        <Inp label="Số ĐT (SDT)" value={form.SDT} onChange={sf('SDT')}/>
        <Inp label="Email" type="email" value={form.Email} onChange={sf('Email')}/>
        <div className="col-span-2"><Inp label="Địa Chỉ (DiaChi)" value={form.DiaChi} onChange={sf('DiaChi')}/></div>
        <Inp label="Mã Số Thuế (MST)" value={form.MST} onChange={sf('MST')}/>
        <Inp label="Hạn Mức Tín Dụng" type="number" value={form.HanMucTinDung} onChange={sf('HanMucTinDung')}/>
      </div>
      <div className="flex justify-end gap-2 mt-4"><Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn><Btn onClick={save}>💾 Lưu</Btn></div>
    </Modal>
  </div>)
}

// NHÀ CUNG CẤP - API dùng MaNCC, TenNCC, SDT, Email, MST, HanThanhToan, ConHoatDong
const Suppliers=()=>{
  const [data,loading,load]=useList('/suppliers')
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState({MaNCC:'',TenNCC:'',SDT:'',Email:'',DiaChi:'',MST:'',HanThanhToan:30,ConHoatDong:true})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    if(!form.MaNCC||!form.TenNCC){showAlert('Vui lòng nhập Mã NCC và Tên NCC!','danger');return}
    const r=await api('POST','/suppliers',{...form,HanThanhToan:+form.HanThanhToan})
    if(r){showAlert('Thêm NCC thành công!');setModal(false);setForm({MaNCC:'',TenNCC:'',SDT:'',Email:'',DiaChi:'',MST:'',HanThanhToan:30,ConHoatDong:true});load()}
    else showAlert('Lỗi! Kiểm tra Mã NCC đã tồn tại chưa.','danger')
  }
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">🏢 Nhà Cung Cấp</h3><div className="ml-auto flex gap-2"><Btn size="sm" onClick={()=>setModal(true)}>+ Thêm</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div></CH>
      <Tbl data={data} loading={loading} empty="Chưa có NCC" cols={[
        {k:'MaNCC',l:'Mã NCC',w:'100px',fn:(v,r)=><Code v={v||r.code}/>},
        {k:'TenNCC',l:'Tên NCC',fn:(v,r)=><span className="font-medium">{v||r.name}</span>},
        {k:'SDT',l:'Điện Thoại',w:'120px',fn:(v,r)=>v||r.phone||'-'},
        {k:'DiaChi',l:'Địa Chỉ',fn:(v,r)=>v||r.address||'-'},
        {k:'MST',l:'MST',w:'110px',fn:(v,r)=>v||r.tax_code||'-'},
        {k:'ConHoatDong',l:'TT',w:'70px',fn:(v,r)=><StatusBadge v={v!==undefined?v:(r.is_active!==undefined?r.is_active:true)}/>},
      ]}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="🏢 Thêm Nhà Cung Cấp">
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã NCC" req value={form.MaNCC} onChange={sf('MaNCC')} placeholder="NCC-001"/>
        <Inp label="Tên NCC" req value={form.TenNCC} onChange={sf('TenNCC')}/>
        <Inp label="Số ĐT" value={form.SDT} onChange={sf('SDT')}/><Inp label="Email" value={form.Email} onChange={sf('Email')}/>
        <div className="col-span-2"><Inp label="Địa Chỉ" value={form.DiaChi} onChange={sf('DiaChi')}/></div>
        <Inp label="MST" value={form.MST} onChange={sf('MST')}/><Inp label="Hạn Thanh Toán (ngày)" type="number" value={form.HanThanhToan} onChange={sf('HanThanhToan')}/>
      </div>
      <div className="flex justify-end gap-2 mt-4"><Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn><Btn onClick={save}>💾 Lưu</Btn></div>
    </Modal>
  </div>)
}

// VẬT TƯ - API dùng MaHH, TenHH, DVT, DanhMuc, GiaBan, TonKhoToiThieu, ConHoatDong
const Products=()=>{
  const [data,loading,load]=useList('/products')
  const [modal,setModal]=useState(false)
  const [units,setUnits]=useState([])
  const [danhMucList,setDanhMucList]=useState([])
  const [createDMModal,setCreateDMModal]=useState(false)
  const [newDMForm,setNewDMForm]=useState({code:'',name:'',mo_ta:''})
  const [form,setForm]=useState({MaHH:'',TenHH:'',DVT:'',DanhMuc:'',GiaBan:0,TonKhoToiThieu:10,ConHoatDong:true})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  useEffect(()=>{
    api('GET','/units').then(d=>{
      const list=Array.isArray(d)?d:[]
      setUnits(list)
      if(list.length) setForm(f=>({...f,DVT:f.DVT||list[0].name||list[0].code||''}))
    })
    loadDanhMuc()
  },[])

  const loadDanhMuc=()=>{
    api('GET','/system-config/nhom_vattu').then(d=>{
      if(!d||d.__error) return
      // API trả về field 'data' (không phải 'config_data')
      const raw=d.data||d.config_data
      if(!raw) return
      try{
        const arr=typeof raw==='string'?JSON.parse(raw):raw
        setDanhMucList(Array.isArray(arr)?arr:[])
      }catch(e){ setDanhMucList([]) }
    })
  }
  const saveDanhMuc=async()=>{
    if(!newDMForm.code||!newDMForm.name){showAlert('Vui lòng nhập Mã và Tên nhóm!','danger');return}
    // Lấy data hiện tại rồi thêm vào
    const d=await api('GET','/system-config/nhom_vattu')
    let arr=[]
    if(d&&!d.__error){
      const raw=d.data||d.config_data
      try{ arr=typeof raw==='string'?JSON.parse(raw):raw||[] }catch(e){}
    }
    if(arr.find(x=>x.code===newDMForm.code)){showAlert('Mã nhóm đã tồn tại!','danger');return}
    arr.push({code:newDMForm.code,name:newDMForm.name,mo_ta:newDMForm.mo_ta||''})
    const r=await api('PUT','/system-config/nhom_vattu',{config_data:JSON.stringify(arr)})
    if(r&&!r.__error){
      showAlert('Đã thêm nhóm mới!')
      setDanhMucList(arr)
      setForm(f=>({...f,DanhMuc:newDMForm.name}))
      setCreateDMModal(false)
      setNewDMForm({code:'',name:'',mo_ta:''})
    } else showAlert('Lỗi khi lưu nhóm!','danger')
  }

  const genMaHH=()=>{
    const maxNum=data.reduce((mx,r)=>{
      const m=String(r.MaHH||r.code||'').match(/^SP(\d+)$/)
      return m?Math.max(mx,+m[1]):mx
    },0)
    return `SP${String(maxNum+1).padStart(3,'0')}`
  }
  const openModal=()=>{
    const autoMa=genMaHH()
    setForm(f=>({...f,MaHH:autoMa}))
    setModal(true)
  }
  const resetForm=()=>setForm({MaHH:'',TenHH:'',DVT:units.length?units[0].name||units[0].code||'':'',DanhMuc:'',GiaBan:0,TonKhoToiThieu:10,ConHoatDong:true})
  const save=async()=>{
    if(!form.MaHH||!form.TenHH){showAlert('Vui lòng nhập Mã HH và Tên HH!','danger');return}
    const r=await api('POST','/products',{...form,GiaBan:+form.GiaBan,TonKhoToiThieu:+form.TonKhoToiThieu})
    if(r){showAlert('Thêm sản phẩm thành công!');setModal(false);resetForm();load()}
    else showAlert('Lỗi! Kiểm tra Mã HH đã tồn tại chưa.','danger')
  }
  const unitOptions = units.filter(u=>u.is_active!==false).map(u=>({value:u.name||u.code, label:`${u.code} - ${u.name}`}))
  if(!unitOptions.length) unitOptions.push(...[{value:'Cái',label:'Cái'},{value:'Kg',label:'Kg'},{value:'Lít',label:'Lít'},{value:'Hộp',label:'Hộp'},{value:'Thùng',label:'Thùng'}])
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">📦 Vật Tư / Hàng Hóa</h3><div className="ml-auto flex gap-2"><Btn size="sm" onClick={openModal}>+ Thêm</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div></CH>
      <Tbl data={data} loading={loading} empty="Chưa có sản phẩm" cols={[
        {k:'MaHH',l:'Mã SP',w:'100px',fn:(v,r)=><Code v={v||r.code}/>},
        {k:'TenHH',l:'Tên SP',fn:(v,r)=><span className="font-medium">{v||r.name}</span>},
        {k:'DVT',l:'ĐVT',w:'70px',fn:(v,r)=>v||r.unit||'-'},
        {k:'DanhMuc',l:'Nhóm',w:'110px',fn:(v,r)=>v||r.category||'-'},
        {k:'GiaBan',l:'Đơn Giá',w:'120px',r:true,fn:(v,r)=>fmtN(v||r.unit_price||0)},
        {k:'ConHoatDong',l:'TT',w:'70px',fn:(v,r)=><StatusBadge v={v!==undefined?v:(r.is_active!==undefined?r.is_active:true)}/>},
      ]}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="📦 Thêm Sản Phẩm">
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã HH (MaHH)" req value={form.MaHH} onChange={sf('MaHH')} placeholder="SP-001"/>
        <Inp label="Tên HH (TenHH)" req value={form.TenHH} onChange={sf('TenHH')}/>
        <Sel label="Đơn Vị Tính (DVT)" req value={form.DVT} onChange={sf('DVT')} options={unitOptions}/>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Danh Mục</label>
          <ComboSelect
            value={danhMucList.find(x=>x.name===form.DanhMuc||x.code===form.DanhMuc)?.code||''}
            onChange={(_,item)=>setForm(f=>({...f,DanhMuc:item?.name||''}))}
            items={danhMucList.map(d=>({id:d.code,code:d.code,name:d.name}))}
            placeholder="-- Tìm hoặc tạo nhóm --"
            onRequestCreate={(q)=>{
              setNewDMForm({code:q.toUpperCase().replace(/\s/g,'').slice(0,10),name:q,mo_ta:''})
              setCreateDMModal(true)
            }}
          />
        </div>
        <Inp label="Giá Bán (GiaBan)" type="number" value={form.GiaBan} onChange={sf('GiaBan')}/>
        <Inp label="Tồn Tối Thiểu" type="number" value={form.TonKhoToiThieu} onChange={sf('TonKhoToiThieu')}/>
      </div>
      {!units.length&&<p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mt-3">⚠️ Chưa có đơn vị tính — vào <b>Danh Mục → Đơn Vị Tính</b> để thêm trước.</p>}
      <div className="flex justify-end gap-2 mt-4"><Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn><Btn onClick={save}>💾 Lưu</Btn></div>
    </Modal>
    
 {createDMModal&&<Modal open={createDMModal} onClose={()=>setCreateDMModal(false)} title="📂 Tạo Nhóm Vật Tư Mới">
      {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã Nhóm" req value={newDMForm.code}
          onChange={e=>setNewDMForm(f=>({...f,code:e.target.value.toUpperCase()}))}
          placeholder="HH"/>
        <Inp label="Tên Nhóm" req value={newDMForm.name}
          onChange={e=>setNewDMForm(f=>({...f,name:e.target.value}))}
          placeholder="Hàng hóa thương mại"/>
        <div className="col-span-2">
          <Inp label="Mô Tả" value={newDMForm.mo_ta}
            onChange={e=>setNewDMForm(f=>({...f,mo_ta:e.target.value}))}/>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setCreateDMModal(false)}>Hủy</Btn>
        <Btn onClick={saveDanhMuc}>💾 Tạo & Dùng Ngay</Btn>
      </div>
    </Modal>}
  </div>)
}

// KHO - API dùng MaKho, TenKho, DiaChi, NguoiQuanLy, ConHoatDong
const Warehouses=()=>{
  const [data,loading,load]=useList('/warehouses')
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState({MaKho:'',TenKho:'',DiaChi:'',NguoiQuanLy:'',ConHoatDong:true})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    if(!form.MaKho||!form.TenKho){showAlert('Vui lòng nhập Mã Kho và Tên Kho!','danger');return}
    const r=await api('POST','/warehouses',form)
    if(r){showAlert('Thêm kho thành công!');setModal(false);setForm({MaKho:'',TenKho:'',DiaChi:'',NguoiQuanLy:'',ConHoatDong:true});load()}
    else showAlert('Lỗi! Kiểm tra Mã Kho đã tồn tại chưa.','danger')
  }
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">🏪 Danh Mục Kho</h3><div className="ml-auto"><Btn size="sm" onClick={()=>setModal(true)}>+ Thêm</Btn></div></CH>
      <Tbl data={data} loading={loading} empty="Chưa có kho" cols={[
        {k:'MaKho',l:'Mã Kho',w:'100px',fn:(v,r)=><Code v={v||r.code}/>},
        {k:'TenKho',l:'Tên Kho',fn:(v,r)=><span className="font-medium">{v||r.name}</span>},
        {k:'DiaChi',l:'Địa Chỉ',fn:(v,r)=>v||r.address||'-'},
        {k:'NguoiQuanLy',l:'Người QL',w:'140px',fn:(v,r)=>v||r.manager_name||'-'},
        {k:'ConHoatDong',l:'TT',w:'70px',fn:(v,r)=><StatusBadge v={v!==undefined?v:(r.is_active!==undefined?r.is_active:true)}/>},
      ]}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="🏪 Thêm Kho">
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã Kho" req value={form.MaKho} onChange={sf('MaKho')} placeholder="KHO-001"/>
        <Inp label="Tên Kho" req value={form.TenKho} onChange={sf('TenKho')}/>
        <div className="col-span-2"><Inp label="Địa Chỉ" value={form.DiaChi} onChange={sf('DiaChi')}/></div>
        <Inp label="Người Quản Lý" value={form.NguoiQuanLy} onChange={sf('NguoiQuanLy')}/>
      </div>
      <div className="flex justify-end gap-2 mt-4"><Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn><Btn onClick={save}>💾 Lưu</Btn></div>
    </Modal>
  </div>)
}

// NHÂN VIÊN - API dùng ma_nv, ten_nv, phong_ban, chuc_vu, luong_co_ban, ngay_vao_lam, con_hoat_dong
const Employees=()=>{
  const [data,loading,load]=useList('/employees')
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState({ma_nv:'',ten_nv:'',phong_ban:'',chuc_vu:'',luong_co_ban:0,ngay_vao_lam:today(),so_tai_khoan:'',ngan_hang:'',con_hoat_dong:true})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    if(!form.ma_nv||!form.ten_nv){showAlert('Vui lòng nhập Mã NV và Tên NV!','danger');return}
    const r=await api('POST','/employees',{...form,luong_co_ban:+form.luong_co_ban})
    if(r){showAlert('Thêm nhân viên thành công!');setModal(false);setForm({ma_nv:'',ten_nv:'',phong_ban:'',chuc_vu:'',luong_co_ban:0,ngay_vao_lam:today(),so_tai_khoan:'',ngan_hang:'',con_hoat_dong:true});load()}
    else showAlert('Lỗi! Kiểm tra Mã NV đã tồn tại chưa.','danger')
  }
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">👤 Nhân Viên</h3><div className="ml-auto flex gap-2"><Btn size="sm" onClick={()=>setModal(true)}>+ Thêm</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div></CH>
      <Tbl data={data} loading={loading} empty="Chưa có nhân viên" cols={[
        {k:'ma_nv',l:'Mã NV',w:'100px',fn:v=><Code v={v}/>},
        {k:'ten_nv',l:'Tên NV',fn:v=><span className="font-medium">{v}</span>},
        {k:'phong_ban',l:'Phòng Ban',w:'130px'},{k:'chuc_vu',l:'Chức Vụ',w:'120px'},
        {k:'luong_co_ban',l:'Lương CB',w:'130px',r:true,fn:v=>fmt(v)},
        {k:'ngay_vao_lam',l:'Ngày Vào',w:'100px',fn:v=>fmtDate(v)},
        {k:'con_hoat_dong',l:'TT',w:'70px',fn:v=><StatusBadge v={v}/>},
      ]}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="👤 Thêm Nhân Viên">
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã NV (ma_nv)" req value={form.ma_nv} onChange={sf('ma_nv')} placeholder="NV-001"/>
        <Inp label="Tên NV (ten_nv)" req value={form.ten_nv} onChange={sf('ten_nv')}/>
        <Inp label="Phòng Ban" value={form.phong_ban} onChange={sf('phong_ban')}/>
        <Inp label="Chức Vụ" value={form.chuc_vu} onChange={sf('chuc_vu')}/>
        <Inp label="Lương Cơ Bản" type="number" value={form.luong_co_ban} onChange={sf('luong_co_ban')}/>
        <Inp label="Ngày Vào Làm" type="date" value={form.ngay_vao_lam} onChange={sf('ngay_vao_lam')}/>
        <Inp label="Số TK Ngân Hàng" value={form.so_tai_khoan} onChange={sf('so_tai_khoan')}/>
        <Inp label="Ngân Hàng" value={form.ngan_hang} onChange={sf('ngan_hang')}/>
      </div>
      <div className="flex justify-end gap-2 mt-4"><Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn><Btn onClick={save}>💾 Lưu</Btn></div>
    </Modal>
  </div>)
}

// KỲ KẾ TOÁN - dùng /categories/all hoặc fallback local
const Periods=()=>{
  const [data,setData]=useState([]); const [loading,setLoading]=useState(true)
  useEffect(()=>{
    // Thử /categories/all trước, fallback sang local data
    api('GET','/categories/all').then(d=>{
      if(d?.fiscal_periods) setData(d.fiscal_periods)
      else {
        // Fallback: dữ liệu mẫu
        setData([
          {period_code:'2026-04',period_name:'Tháng 04/2026',start_date:'2026-04-01',end_date:'2026-04-30',is_closed:false},
          {period_code:'2026-03',period_name:'Tháng 03/2026',start_date:'2026-03-01',end_date:'2026-03-31',is_closed:false},
          {period_code:'2026-02',period_name:'Tháng 02/2026',start_date:'2026-02-01',end_date:'2026-02-28',is_closed:true},
          {period_code:'2026-01',period_name:'Tháng 01/2026',start_date:'2026-01-01',end_date:'2026-01-31',is_closed:true},
        ])
      }
      setLoading(false)
    })
  },[])
  return(
    <Card><CH><h3 className="font-bold">📅 Kỳ Kế Toán</h3><div className="ml-auto"><Alert msg="Kỳ KT được tạo tự động từ năm tài chính" type="info"/></div></CH>
      <Tbl data={data} loading={loading} empty="Chưa có kỳ kế toán" cols={[
        {k:'period_code',l:'Mã Kỳ',w:'100px',fn:v=><Code v={v}/>},{k:'period_name',l:'Tên Kỳ'},
        {k:'start_date',l:'Từ Ngày',w:'110px',fn:v=>fmtDate(v)},{k:'end_date',l:'Đến Ngày',w:'110px',fn:v=>fmtDate(v)},
        {k:'is_closed',l:'TT',w:'90px',fn:v=><Badge v={v?'danger':'success'}>{v?'Đã Đóng':'Mở'}</Badge>},
      ]}/>
    </Card>
  )
}

// GENERIC LOCAL CATALOG
const LocalCatalog=({title, icon, configKey, cols, modalFields, initForm})=>{
  const [items,setItems]=useState([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState(initForm||{})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  const load=async()=>{
    setLoading(true)
    const r=await api('GET',`/system-config/${configKey}`)
    if(r) setItems(Array.isArray(r.data)?r.data:[])
    setLoading(false)
  }
  useEffect(()=>{load()},[configKey])

  const save=async()=>{
    const required=modalFields?.filter(f=>f.req)?.map(f=>f.key)||[]
    for(const k of required){
      if(!form[k]){showAlert(`Vui lòng nhập ${k}!`,'danger');return}
    }
    const r=await api('POST',`/system-config/${configKey}/add-item`,form)
    if(r&&!r.__error&&r.data){showAlert('Thêm thành công!');setModal(false);setForm(initForm||{});setItems(r.data)}
    else showAlert('Lỗi: '+(r?.message||'Không kết nối được backend'),'danger')
  }

  const del=async(idx)=>{
    const item=items[idx]
    if(!confirm(`Xóa "${item.name||item.ten||JSON.stringify(item)}"?`))return
    const r=await api('DELETE',`/system-config/${configKey}/remove-item/${idx}`)
    if(r){showAlert('Đã xóa!');setItems(r.data)}
    else showAlert('Lỗi khi xóa!','danger')
  }

  const displayCols=[
    ...cols,
    {k:'_act',l:'',w:'60px',fn:(v,r,i)=><button onClick={()=>del(i)} className="text-xs text-red-500 hover:underline">Xóa</button>}
  ]

  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH>
      <h3 className="font-bold">{icon} {title}</h3>
      <div className="ml-auto"><Btn size="sm" onClick={()=>setModal(true)}>+ Thêm</Btn></div>
    </CH>
    <Tbl data={items} loading={loading} empty={`Chưa có ${title.toLowerCase()}`} cols={displayCols}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title={`${icon} Thêm ${title}`}>
      <div className="grid grid-cols-2 gap-3">
        {(modalFields||[]).map(f=>(
          f.type==='select'
            ?<Sel key={f.key} label={f.label} req={f.req} value={form[f.key]||''} onChange={sf(f.key)} options={f.options||[]}/>
            :<Inp key={f.key} label={f.label} req={f.req} value={form[f.key]||''} onChange={sf(f.key)} placeholder={f.placeholder||''}/>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn>
        <Btn onClick={save}>💾 Lưu</Btn>
      </div>
    </Modal>
  </div>)
}

const Receipts=()=>{
  const [data,loading,load]=useList('/documents/phieu-thu')
  const [tab,setTab]=useState('list')
  const [customers,setCustomers]=useState([])
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [loaiGDThu,setLoaiGDThu]=useState([])
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)
  const [alert,showAlert,closeAlert]=useAlert()
  const [editModal,setEditModal]=useState(false)
  const [editForm,setEditForm]=useState(null)
  const [editLoading,setEditLoading]=useState(false)
  const sef=k=>e=>setEditForm(f=>({...f,[k]:e.target.value}))

  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PT-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.SoCT||r.so_chung_tu||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }
  const makeEmptyForm=(list=[])=>({
    SoCT:makeNewSoCT(list),NgayCT:today(),MaKyKeToan:kyDefault,
    MaKH:'',TienThu:0,HinhThucTT:'Chuyển khoản',LoaiGiaoDich:'',DienGiai:''
  })
  const [form,setForm]=useState(()=>makeEmptyForm())
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/categories/loai-giao-dich-thu').then(d=>{
      const list=Array.isArray(d)?d:(d?.items||[])
      setLoaiGDThu(list)
      if(list.length) setForm(f=>({...f,LoaiGiaoDich:f.LoaiGiaoDich||list[0].value||list[0].name||''}))
    })
    api('GET','/customers').then(d=>setCustomers(Array.isArray(d)?d:[]))
  },[])

  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))
  },[data,loading])

  const openDetail=async(row)=>{
    setDetailModal(true); setDetailLoading(true); setDetail(null)
    const r=await api('GET',`/documents/phieu-thu/${row.id}`)
    setDetail(r&&!r.__error?r:{...row,items:[]})
    setDetailLoading(false)
  }
  const openEdit=(d)=>{
    setEditForm({
      SoCT: d.SoCT,
      NgayCT: d.NgayCT?.slice(0,10)||today(),
      MaKyKeToan: d.MaKyKeToan||kyDefault,
      MaKH: d.MaKH||'',
      TienThu: d.TienThu||0,
      HinhThucTT: d.HinhThucTT||'Chuyển khoản',
      LoaiGiaoDich: d.LoaiGiaoDich||'',
      DienGiai: d.DienGiai||''
    })
    setEditModal(true)
  }

  const saveEdit=async()=>{
    if(!editForm.MaKH||!+editForm.TienThu){
      showAlert('Vui lòng điền đầy đủ Khách Hàng và Số Tiền!','danger'); return
    }
    setEditLoading(true)
    const body={
      SoCT: editForm.SoCT,
      NgayCT: editForm.NgayCT,
      MaKH: +editForm.MaKH,
      MaKyKeToan: +editForm.MaKyKeToan,
      TienThu: +editForm.TienThu,
      HinhThucTT: editForm.HinhThucTT,
      LoaiGiaoDich: editForm.LoaiGiaoDich,
      DienGiai: editForm.DienGiai
    }
    const r=await api('PUT',`/documents/phieu-thu/${detail.id}`,body)
    setEditLoading(false)
    if(r&&!r.__error){
      showAlert('Cập nhật phiếu thu thành công!')
      setEditModal(false)
      setDetailModal(false)
      setDetail(null)
      load()
    } else showAlert('Lỗi: '+(r?.message||'Cập nhật thất bại'),'danger')
  }

  const getKHLabel=(id)=>{
    const c=customers.find(x=>String(x.id)===String(id))
    return c?`${c.TenKH||c.name}`:(id?`KH #${id}`:'-')
  }

  const save=async()=>{
    if(!form.SoCT||!form.MaKH||!+form.TienThu){
      showAlert('Vui lòng điền: Số CT, Khách Hàng, Số Tiền!','danger'); return
    }
    const body={NgayCT:form.NgayCT,SoCT:form.SoCT,LoaiGiaoDich:form.LoaiGiaoDich,
      TienThu:+form.TienThu,DienGiai:form.DienGiai,MaKH:+form.MaKH,
      MaKyKeToan:+form.MaKyKeToan,HinhThucTT:form.HinhThucTT}
    const r=await api('POST','/documents/phieu-thu',body)
    if(r&&!r.__error){
      showAlert(`Tạo phiếu thu ${form.SoCT} thành công!`)
      const newData=await api('GET','/documents/phieu-thu')
      setForm(makeEmptyForm(Array.isArray(newData)?newData:[]))
      load(); setTab('list')
    } else showAlert('Lỗi: '+(r?.message||'Tạo thất bại'),'danger')
  }

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <DetailModal open={detailModal} onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`💰 Chi Tiết Phiếu Thu - ${detail?.SoCT||''}`}
      detail={detail} loading={detailLoading} products={[]} customers={customers} suppliers={[]}
      onEdit={()=>openEdit(detail)}/>

    {/* Edit Modal */}
    {editModal&&editForm&&<Modal open={editModal} onClose={()=>setEditModal(false)}
      title={`✏️ Sửa Phiếu Thu - ${editForm.SoCT}`} size="lg">
        {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
      <div className="grid grid-cols-3 gap-3">
        <Inp label="Số CT" value={editForm.SoCT} disabled hint="Không thể sửa số CT"/>
        <Inp label="Ngày CT" req type="date" value={editForm.NgayCT} onChange={sef('NgayCT')}/>
        <Sel label="Kỳ Kế Toán" req value={editForm.MaKyKeToan} onChange={sef('MaKyKeToan')} options={kyOptions}/>
        <div className="col-span-2">
          <Sel label="Khách Hàng" req value={editForm.MaKH} onChange={sef('MaKH')}
            options={customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))}/>
        </div>
        <Sel label="Hình Thức TT" value={editForm.HinhThucTT} onChange={sef('HinhThucTT')}
          options={['Tiền mặt','Chuyển khoản','Thẻ']}/>
        <Inp label="Số Tiền Thu" req type="number" value={editForm.TienThu} onChange={sef('TienThu')}/>
        <Sel label="Loại Giao Dịch" value={editForm.LoaiGiaoDich} onChange={sef('LoaiGiaoDich')}
          options={loaiGDThu.map(x=>({value:x.value||x.name,label:x.label||x.name}))}/>
        <div className="col-span-3">
          <Inp label="Diễn Giải" value={editForm.DienGiai} onChange={sef('DienGiai')}/>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
        <Btn v="success" onClick={saveEdit} disabled={editLoading}>
          {editLoading?'Đang lưu...':'💾 Lưu Thay Đổi'}
        </Btn>
      </div>
    </Modal>}
    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]} active={tab}
      onChange={t=>{setTab(t);if(t==='create') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))}}/>
    {tab==='list'&&<Card>
      <CH><h3 className="font-bold">💰 Danh Sách Phiếu Thu</h3>
            <div className="ml-auto flex gap-2">
              <Btn v="excel" size="sm" onClick={()=>exportExcel('PhieuThu','Phiếu Thu',
                ['Số Phiếu','Ngày CT','Khách Hàng','Số Tiền','HTTT','Diễn Giải','TT'],
                data.map(r=>[r.SoCT,fmtDate(r.NgayCT),getKHLabel(r.MaKH||r.customer_id),r.TienThu,r.HinhThucTT,r.DienGiai,r.TrangThai])
              )}>⬇ Excel</Btn>
            </div>
          </CH>
      <p className="px-4 py-1.5 text-xs text-red-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết</p>
      <Tbl data={data} loading={loading} empty="Chưa có phiếu thu" cols={[
        {k:'SoCT',l:'Số Phiếu',w:'130px',fn:(v,r)=>(
          <button onClick={()=>openDetail(r)} className="text-blue-600 hover:underline font-mono text-xs font-semibold">{v||'-'}</button>
        )},
        {k:'NgayCT',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
        {k:'MaKH',l:'Khách Hàng',fn:(v,r)=>{
          const id=v||r.customer_id
          return <span className="font-medium">{getKHLabel(id)}</span>
        }},
        {k:'TienThu',l:'Số Tiền',r:true,fn:v=><span className="text-green-700 font-semibold">{fmt(v||0)}</span>},
        {k:'HinhThucTT',l:'HTTT',w:'120px',fn:v=>v||'-'},
        {k:'DienGiai',l:'Diễn Giải'},
        {k:'TrangThai',l:'TT',w:'80px',fn:v=><Badge v={v==='POSTED'?'success':'warning'}>{v||'DRAFT'}</Badge>},
      ]}/></Card>}
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">💰 Tạo Phiếu Thu Mới</h3></CH>
      <CB><div className="grid grid-cols-3 gap-3">
        <Inp label="Số CT" req value={form.SoCT} onChange={sf('SoCT')} hint="Tự sinh, có thể sửa"/>
        <Inp label="Ngày CT" req type="date" value={form.NgayCT} onChange={sf('NgayCT')}/>
        <Sel label="Kỳ Kế Toán" req value={form.MaKyKeToan} onChange={sf('MaKyKeToan')} options={kyOptions}/>
        <div className="col-span-2">
          <Sel label="Khách Hàng" req value={form.MaKH} onChange={sf('MaKH')}
            options={customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))}/>
        </div>
        <Sel label="Hình Thức TT" value={form.HinhThucTT} onChange={sf('HinhThucTT')} options={['Tiền mặt','Chuyển khoản','Thẻ']}/>
        <Inp label="Số Tiền Thu" req type="number" value={form.TienThu} onChange={sf('TienThu')}/>
        <Sel label="Loại Giao Dịch" value={form.LoaiGiaoDich} onChange={sf('LoaiGiaoDich')}
          options={loaiGDThu.map(x=>({value:x.value||x.name,label:x.label||x.name}))}/>
        <div className="col-span-3"><Inp label="Diễn Giải" value={form.DienGiai} onChange={sf('DienGiai')}/></div>
      </div>
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
        <span className="text-sm font-semibold text-green-800">Tổng Tiền Thu:</span>
        <span className="text-xl font-bold text-green-700 font-mono">{fmt(form.TienThu)}</span>
      </div></CB>
      <CF><Btn v="outline" onClick={()=>setTab('list')}>Hủy</Btn><Btn v="success" onClick={save}>💾 Lưu & Đóng</Btn></CF>
    </Card>}
  </div>)
}

// PHIẾU CHI - API: NgayCT, SoCT, TienChi, DienGiai, MaNCC, MaKyKeToan, HinhThucTT
const Payments=()=>{
  const [data,loading,load]=useList('/documents/phieu-chi')
  const [tab,setTab]=useState('list')
  const [suppliers,setSuppliers]=useState([])
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [loaiGDChi,setLoaiGDChi]=useState([])
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)
  const [editModal,setEditModal]=useState(false)
  const [editForm,setEditForm]=useState(null)
  const [editLoading,setEditLoading]=useState(false)
  const sef=k=>e=>setEditForm(f=>({...f,[k]:e.target.value}))

  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PC-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.SoCT||r.so_chung_tu||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }
  const makeEmptyForm=(list=[])=>({
    SoCT:makeNewSoCT(list),NgayCT:today(),MaKyKeToan:kyDefault,
    MaNCC:'',TienChi:0,HinhThucTT:'Chuyển khoản',LoaiGiaoDich:'',DienGiai:''
  })
  const [form,setForm]=useState(()=>makeEmptyForm())
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/suppliers').then(d=>setSuppliers(Array.isArray(d)?d:[]))
    api('GET','/units').then(d=>setUnits(Array.isArray(d)?d:[]))
    api('GET','/categories/loai-giao-dich-chi').then(d=>{
      const list=Array.isArray(d)?d:(d?.items||[])
      setLoaiGDChi(list)
      if(list.length) setForm(f=>({...f,LoaiGiaoDich:f.LoaiGiaoDich||list[0].value||list[0].name||''}))
    })
  },[])

  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))
  },[data,loading])

  const openDetail=async(row)=>{
    setDetailModal(true); setDetailLoading(true); setDetail(null)
    const r=await api('GET',`/documents/phieu-chi/${row.id}`)
    setDetail(r&&!r.__error?r:{...row,items:[]})
    setDetailLoading(false)
  }
  const openEdit=(d)=>{
    setEditForm({
      SoCT: d.SoCT,
      NgayCT: d.NgayCT?.slice(0,10)||today(),
      MaKyKeToan: d.MaKyKeToan||kyDefault,
      MaNCC: d.MaNCC||'',
      TienChi: d.TienChi||0,
      HinhThucTT: d.HinhThucTT||'Chuyển khoản',
      LoaiGiaoDich: d.LoaiGiaoDich||'',
      DienGiai: d.DienGiai||''
    })
    setEditModal(true)
  }

  const saveEdit=async()=>{
    if(!+editForm.TienChi){
      showAlert('Vui lòng điền Số Tiền!','danger'); return
    }
    setEditLoading(true)
    const body={
      SoCT: editForm.SoCT,
      NgayCT: editForm.NgayCT,
      MaNCC: editForm.MaNCC?+editForm.MaNCC:null,
      MaKyKeToan: +editForm.MaKyKeToan,
      TienChi: +editForm.TienChi,
      HinhThucTT: editForm.HinhThucTT,
      LoaiGiaoDich: editForm.LoaiGiaoDich,
      DienGiai: editForm.DienGiai
    }
    const r=await api('PUT',`/documents/phieu-chi/${detail.id}`,body)
    setEditLoading(false)
    if(r&&!r.__error){
      showAlert('Cập nhật phiếu chi thành công!')
      setEditModal(false)
      setDetailModal(false)
      setDetail(null)
      load()
    } else showAlert('Lỗi: '+(r?.message||'Cập nhật thất bại'),'danger')
  }
  const getNCCLabel=(id)=>{
    const s=suppliers.find(x=>String(x.id)===String(id))
    return s?`${s.TenNCC||s.name}`:(id?`NCC #${id}`:'-')
  }

  const save=async()=>{
    if(!form.SoCT||!+form.TienChi){
      showAlert('Vui lòng điền: Số CT và Số Tiền!','danger'); return
    }
    const body={NgayCT:form.NgayCT,SoCT:form.SoCT,LoaiGiaoDich:form.LoaiGiaoDich,
      TienChi:+form.TienChi,DienGiai:form.DienGiai,
      MaNCC:form.MaNCC?+form.MaNCC:null,
      MaKyKeToan:+form.MaKyKeToan,HinhThucTT:form.HinhThucTT}
    const r=await api('POST','/documents/phieu-chi',body)
    if(r&&!r.__error){
      showAlert(`Tạo phiếu chi ${form.SoCT} thành công!`)
      const newData=await api('GET','/documents/phieu-chi')
      setForm(makeEmptyForm(Array.isArray(newData)?newData:[]))
      load(); setTab('list')
    } else showAlert('Lỗi: '+(r?.message||'Tạo thất bại'),'danger')
  }

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <DetailModal open={detailModal} onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`💸 Chi Tiết Phiếu Chi - ${detail?.SoCT||''}`}
      detail={detail} loading={detailLoading} products={[]} customers={[]} suppliers={suppliers}
      onEdit={()=>openEdit(detail)}/>

    {editModal&&editForm&&<Modal open={editModal} onClose={()=>setEditModal(false)}
      title={`✏️ Sửa Phiếu Chi - ${editForm.SoCT}`} size="lg">
        {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
      <div className="grid grid-cols-3 gap-3">
        <Inp label="Số CT" value={editForm.SoCT} disabled hint="Không thể sửa số CT"/>
        <Inp label="Ngày CT" req type="date" value={editForm.NgayCT} onChange={sef('NgayCT')}/>
        <Sel label="Kỳ Kế Toán" req value={editForm.MaKyKeToan} onChange={sef('MaKyKeToan')} options={kyOptions}/>
        <div className="col-span-2">
          <Sel label="Nhà Cung Cấp" value={editForm.MaNCC} onChange={sef('MaNCC')}
            options={[{value:'',label:'-- Không có --'},...suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))]}/>
        </div>
        <Sel label="Hình Thức TT" value={editForm.HinhThucTT} onChange={sef('HinhThucTT')}
          options={['Tiền mặt','Chuyển khoản','Thẻ']}/>
        <Inp label="Số Tiền Chi" req type="number" value={editForm.TienChi} onChange={sef('TienChi')}/>
        <Sel label="Loại Giao Dịch" value={editForm.LoaiGiaoDich} onChange={sef('LoaiGiaoDich')}
          options={loaiGDChi.map(x=>({value:x.value||x.name,label:x.label||x.name}))}/>
        <div className="col-span-3">
          <Inp label="Diễn Giải" value={editForm.DienGiai} onChange={sef('DienGiai')}/>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
        <Btn v="success" onClick={saveEdit} disabled={editLoading}>
          {editLoading?'Đang lưu...':'💾 Lưu Thay Đổi'}
        </Btn>
      </div>
    </Modal>}
    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]} active={tab}
      onChange={t=>{setTab(t);if(t==='create') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))}}/>
    {tab==='list'&&<Card>
       <CH><h3 className="font-bold">💸 Danh Sách Phiếu Chi</h3>
          <div className="ml-auto flex gap-2">
            <Btn v="excel" size="sm" onClick={()=>exportExcel('PhieuChi','Phiếu Chi',
              ['Số Phiếu','Ngày CT','Nhà Cung Cấp','Số Tiền','HTTT','Diễn Giải','TT'],
              data.map(r=>[r.SoCT,fmtDate(r.NgayCT),getNCCLabel(r.MaNCC||r.supplier_id),r.TienChi,r.HinhThucTT,r.DienGiai,r.TrangThai])
            )}>⬇ Excel</Btn>
          </div>
        </CH>
      <p className="px-4 py-1.5 text-xs text-red-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết</p>
      <Tbl data={data} loading={loading} empty="Chưa có phiếu chi" cols={[
        {k:'SoCT',l:'Số Phiếu',w:'130px',fn:(v,r)=>(
          <button onClick={()=>openDetail(r)} className="text-blue-600 hover:underline font-mono text-xs font-semibold">{v||'-'}</button>
        )},
        {k:'NgayCT',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
        {k:'MaNCC',l:'Nhà Cung Cấp',fn:(v,r)=>{
          const id=v??r.supplier_id
          return <span className="font-medium">{getNCCLabel(id)}</span>
        }},
        {k:'TienChi',l:'Số Tiền',r:true,fn:v=><span className="text-red-700 font-semibold">{fmt(v||0)}</span>},
        {k:'HinhThucTT',l:'HTTT',w:'120px',fn:v=>v||'-'},
        {k:'DienGiai',l:'Diễn Giải'},
        {k:'TrangThai',l:'TT',w:'80px',fn:v=><Badge v="warning">{v||'DRAFT'}</Badge>},
      ]}/></Card>}
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">💸 Tạo Phiếu Chi Mới</h3></CH>
      <CB><div className="grid grid-cols-3 gap-3">
        <Inp label="Số CT" req value={form.SoCT} onChange={sf('SoCT')} hint="Tự sinh, có thể sửa"/>
        <Inp label="Ngày CT" req type="date" value={form.NgayCT} onChange={sf('NgayCT')}/>
        <Sel label="Kỳ Kế Toán" req value={form.MaKyKeToan} onChange={sf('MaKyKeToan')} options={kyOptions}/>
        <div className="col-span-2">
          <Sel label="Nhà Cung Cấp" value={form.MaNCC} onChange={sf('MaNCC')}
            options={suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))}/>
        </div>
        <Sel label="Hình Thức TT" value={form.HinhThucTT} onChange={sf('HinhThucTT')} options={['Tiền mặt','Chuyển khoản','Thẻ']}/>
        <Inp label="Số Tiền Chi" req type="number" value={form.TienChi} onChange={sf('TienChi')}/>
        <Sel label="Loại Giao Dịch" value={form.LoaiGiaoDich} onChange={sf('LoaiGiaoDich')}
          options={loaiGDChi.map(x=>({value:x.value||x.name,label:x.label||x.name}))}/>
        <div className="col-span-3"><Inp label="Diễn Giải" value={form.DienGiai} onChange={sf('DienGiai')}/></div>
      </div>
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
        <span className="text-sm font-semibold text-green-800">Tổng Tiền Chi:</span>
        <span className="text-xl font-bold text-blue-700 font-mono">{fmt(form.TienChi)}</span>
      </div></CB>
      <CF><Btn v="outline" onClick={()=>setTab('list')}>Hủy</Btn><Btn onClick={save}>💾 Lưu</Btn></CF>
    </Card>}
  </div>)
}

// TTG / CTG
// TTG / CTG
const BankTxn=({type})=>{
  const isTTG=type==='nv-ttg'
  const [data,loading,load]=useList(isTTG?'/banking/ttg':'/banking/ctg')
  const [tab,setTab]=useState('list')
  const [accounts,setAccounts]=useState([])
  const [ltypes,setLtypes]=useState([])
  const [customers,setCustomers]=useState([])
  const [suppliers,setSuppliers]=useState([])
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)
  const [editModal,setEditModal]=useState(false)
  const [editForm,setEditForm]=useState(null)
  const [editLoading,setEditLoading]=useState(false)
  const sef=k=>e=>setEditForm(f=>({...f,[k]:e.target.value}))
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()

  const prefix=isTTG?'TTG':'CTG'

  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`${prefix}-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.so_chung_tu||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }

  const makeEmptyForm=(list=[])=>({
    tk_id:'',loai_giao_dich:'',
    so_chung_tu:makeNewSoCT(list),
    ngay_chung_tu:today(),
    so_tien_thu:0,so_tien_chi:0,
    noi_dung:'',period_id:kyDefault||1
  })

  const [form,setForm]=useState(()=>makeEmptyForm())
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/banking/accounts').then(d=>setAccounts(Array.isArray(d)?d:[]))
    api('GET',isTTG?'/banking/loai-giao-dich-thu':'/banking/loai-giao-dich-chi').then(d=>{
      const list=Array.isArray(d)?d:(d?.items||[])
      setLtypes(list)
      if(list.length) setForm(f=>({...f,loai_giao_dich:f.loai_giao_dich||list[0].value||list[0].name||''}))
    })
    if(isTTG) api('GET','/customers').then(d=>setCustomers(Array.isArray(d)?d:[]))
    else api('GET','/suppliers').then(d=>setSuppliers(Array.isArray(d)?d:[]))
  },[type])

  useEffect(()=>{
    if(!loading) setForm(f=>({...f,so_chung_tu:makeNewSoCT(data),period_id:kyDefault||f.period_id}))
  },[data,loading])

  const openDetail=async(row)=>{
    setDetailModal(true); setDetailLoading(true); setDetail(null)
    const r=await api('GET',isTTG?`/banking/ttg/${row.id}`:`/banking/ctg/${row.id}`)
    setDetail(r&&!r.__error?{...r,
      id:row.id, SoCT:r.so_chung_tu, NgayCT:r.ngay_chung_tu,
      TienThu:isTTG?r.so_tien_thu:undefined,
      TienChi:!isTTG?r.so_tien_chi:undefined,
      LoaiGiaoDich:r.loai_giao_dich, DienGiai:r.noi_dung,
      ten_tk:r.ten_tk||getTKLabel(r.tk_id),
        khach_hang_id:r.khach_hang_id,
        supplier_id:r.supplier_id,
        items:[]
    }:{...row, id:row.id, SoCT:row.so_chung_tu, NgayCT:row.ngay_chung_tu,
      TienThu:isTTG?row.so_tien_thu:undefined,
      TienChi:!isTTG?row.so_tien_chi:undefined,
      LoaiGiaoDich:row.loai_giao_dich, DienGiai:row.noi_dung,
      ten_tk:row.ten_tk||getTKLabel(row.tk_id), items:[]
    })
    setDetailLoading(false)
  }
const isBC=type==='nv-bc'
  const isBN=type==='nv-bn'

  const openEdit=(d)=>{
    setEditForm({
      SoCT: d.so_chung_tu||'',
      ngay_chung_tu: String(d.ngay_chung_tu||today()).slice(0,10),
      period_id: d.period_id||kyDefault,
      tk_id: d.tk_id||'',
      loai_giao_dich: d.loai_giao_dich||'',
      so_tien_thu: d.so_tien_thu||0,
      so_tien_chi: d.so_tien_chi||0,
      noi_dung: d.noi_dung||'',
      khach_hang_id: d.khach_hang_id||'',
      supplier_id: d.supplier_id||''
    })
    setEditModal(true)
  }
  const saveEdit=async()=>{
    if(!editForm.tk_id){showAlert('Vui lòng chọn Tài Khoản!','danger');return}
    const soTien=isTTG?+editForm.so_tien_thu:+editForm.so_tien_chi
    if(!soTien||soTien<=0){showAlert('Vui lòng nhập Số Tiền lớn hơn 0!','danger');return}
    setEditLoading(true)
    const body={
      so_chung_tu: editForm.SoCT,
      ngay_chung_tu: editForm.ngay_chung_tu,
      tk_id: +editForm.tk_id,
      loai_giao_dich: editForm.loai_giao_dich,
      noi_dung: editForm.noi_dung,
      period_id: +editForm.period_id,
      ...(isTTG
        ?{so_tien_thu:+editForm.so_tien_thu, khach_hang_id:editForm.khach_hang_id?+editForm.khach_hang_id:null}
        :{so_tien_chi:+editForm.so_tien_chi, supplier_id:editForm.supplier_id?+editForm.supplier_id:null}
      )
    }
    const r=await api('PUT',isTTG?`/banking/ttg/${detail.id}`:`/banking/ctg/${detail.id}`,body)
    setEditLoading(false)
    if(r&&!r.__error){
      showAlert(`Cập nhật ${prefix} thành công!`)
      setEditModal(false); setDetailModal(false); setDetail(null); load()
    } else showAlert('Lỗi: '+(r?.message||'Cập nhật thất bại'),'danger')
  }

  
  const getTKLabel=(id)=>{
    const a=accounts.find(x=>String(x.id)===String(id))
    return a?`${a.ten_tk} (${a.ma_tk})`:(id?`TK #${id}`:'-')
  }

  const save=async()=>{
    if(!form.tk_id){showAlert('Vui lòng chọn Tài Khoản!','danger');return}
    const soTien=isTTG?+form.so_tien_thu:+form.so_tien_chi
    if(!soTien||soTien<=0){showAlert('Vui lòng nhập Số Tiền lớn hơn 0!','danger');return}
    const body={...form,tk_id:+form.tk_id,period_id:+form.period_id,
      ...(isTTG?{so_tien_thu:+form.so_tien_thu}:{so_tien_chi:+form.so_tien_chi})}
    const r=await api('POST',isTTG?'/banking/ttg':'/banking/ctg',body)
    if(r&&!r.__error){
      showAlert(`Tạo ${prefix} ${form.so_chung_tu} thành công!`)
      const newData=await api('GET',isTTG?'/banking/ttg':'/banking/ctg')
      setForm(makeEmptyForm(Array.isArray(newData)?newData:[]))
      load(); setTab('list')
    } else showAlert('Lỗi: '+(r?.message||'Tạo thất bại'),'danger')
  }
  

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}

    <DetailModal open={detailModal} onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`🏦 Chi Tiết ${isTTG?'Thu Tiền Gửi':'Chi Tiền Gửi'} - ${detail?.SoCT||''}`}
      detail={detail} loading={detailLoading} products={[]} customers={customers} suppliers={suppliers}
      onEdit={()=>openEdit(detail)}/>

    {editModal&&editForm&&<Modal open={editModal} onClose={()=>setEditModal(false)}
      title={`✏️ Sửa ${isTTG?'TTG':'CTG'} - ${editForm.SoCT||editForm.so_chung_tu||''}`} size="lg">
        {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
      <div className="grid grid-cols-3 gap-3">
        <Inp label="Số CT" value={editForm.SoCT} disabled hint="Không thể sửa số CT"
          className="bg-gray-100 cursor-not-allowed opacity-75"/>
        <Inp label="Ngày CT" req type="date" value={editForm.ngay_chung_tu} onChange={sef('ngay_chung_tu')}/>
        <Sel label="Kỳ Kế Toán" req value={editForm.period_id} onChange={sef('period_id')} options={kyOptions}/>
        <Sel label="Tài Khoản NH" req value={editForm.tk_id} onChange={sef('tk_id')}
          options={accounts.map(a=>({value:a.id,label:`${a.ma_tk} - ${a.ten_tk}`}))}/>
        <Sel label="Loại Giao Dịch" value={editForm.loai_giao_dich} onChange={sef('loai_giao_dich')}
          options={ltypes.map(t=>({value:t.value||t.name||t,label:t.label||t.name||t}))}/>
        {isTTG
          ?<Sel label="Khách Hàng" value={editForm.khach_hang_id||''} onChange={sef('khach_hang_id')}
              options={[{value:'',label:'-- Không có --'},...customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))]}/>
          :<Sel label="Nhà Cung Cấp" value={editForm.supplier_id||''} onChange={sef('supplier_id')}
              options={[{value:'',label:'-- Không có --'},...suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))]}/>
        }
        <div className="col-span-2">
          <Inp label={isTTG?'Số Tiền Thu':'Số Tiền Chi'} req type="number" min="0"
            value={isTTG?editForm.so_tien_thu:editForm.so_tien_chi}
            onChange={sef(isTTG?'so_tien_thu':'so_tien_chi')}/>
        </div>
        <div className="col-span-3">
          <Inp label="Nội Dung" value={editForm.noi_dung} onChange={sef('noi_dung')}/>
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
        <Btn v={isTTG?'success':'success'} onClick={saveEdit} disabled={editLoading}>
          {editLoading?'Đang lưu...':'💾 Lưu Thay Đổi'}
        </Btn>
      </div>
    </Modal>}

    <Tabs tabs={[
      {id:'list',label:`📋 Danh Sách ${prefix}`},
      {id:'create',label:`+ Tạo ${prefix} Mới`}
    ]} active={tab} onChange={t=>{
      setTab(t)
      if(t==='create') setForm(f=>({...f,so_chung_tu:makeNewSoCT(data)}))
    }}/>

    {tab==='list'&&<Card>
      <CH>
        <h3 className="font-bold">{isTTG?'🏦 Thu Tiền Gửi (TTG)':'🏦 Chi Tiền Gửi (CTG)'}</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={()=>exportExcel(
            isTTG?'ThuTienGui':'ChiTienGui',
            isTTG?'Thu Tiền Gửi':'Chi Tiền Gửi',
            ['Số CT','Ngày','Tài Khoản','Loại GD',isTTG?'Số Tiền Thu':'Số Tiền Chi','Nội Dung','Đối Chiếu','TT'],
            data.map(r=>[
              r.so_chung_tu, fmtDate(r.ngay_chung_tu), getTKLabel(r.tk_id),
              r.loai_giao_dich, isTTG?r.so_tien_thu:r.so_tien_chi,
              r.noi_dung, r.da_doi_chieu?'Đã ĐC':'Chưa', r.trang_thai
            ])
          )}>⬇ Excel</Btn>
        </div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-red-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết</p>
      <Tbl data={data} loading={loading} empty={`Chưa có ${prefix}`} cols={[
        {k:'so_chung_tu',l:'Số CT',w:'150px',fn:(v,r)=>(
          <button onClick={()=>openDetail(r)} className="text-blue-600 hover:underline font-mono text-xs font-semibold">{v||'-'}</button>
        )},
        {k:'ngay_chung_tu',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
        {k:isTTG?'khach_hang_id':'supplier_id',l:isTTG?'Khách Hàng':'Nhà CC',w:'160px',fn:(v)=>{
          if(!v) return <span className="text-gray-400">-</span>
          if(isTTG){
            const c=customers.find(x=>String(x.id)===String(v))
            return <span className="text-xs font-medium">{c?`${c.TenKH||c.name}`:'-'}</span>
          } else {
            const s=suppliers.find(x=>String(x.id)===String(v))
            return <span className="text-xs font-medium">{s?`${s.TenNCC||s.name}`:'-'}</span>
          }
        }},
        {k:'tk_id',l:'Tài Khoản',w:'180px',fn:v=><span className="text-xs">{getTKLabel(v)}</span>},
        {k:'loai_giao_dich',l:'Loại GD',fn:(v)=><Badge v="success">{v||'-'}</Badge>},
        {k:isTTG?'so_tien_thu':'so_tien_chi',l:'Số Tiền',r:true,
          fn:v=><span className={`font-semibold ${isTTG?'text-green-700':'text-red-700'}`}>{fmt(v)}</span>},
        {k:'noi_dung',l:'Nội Dung'},
        {k:'da_doi_chieu',l:'Đối Chiếu',w:'90px',fn:v=><Badge v={v?'success':'gray'}>{v?'Đã ĐC':'Chưa'}</Badge>},
        {k:'trang_thai',l:'TT',w:'90px',fn:v=><Badge v={v==='POSTED'?'success':'warning'}>{v||'DRAFT'}</Badge>},
      ]}/>
    </Card>}

    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">{isTTG?'🏦 Tạo Thu Tiền Gửi (TTG)':'🏦 Tạo Chi Tiền Gửi (CTG)'}</h3></CH>
      <CB><div className="grid grid-cols-3 gap-3">
        <Inp label="Số CT" req value={form.so_chung_tu} onChange={sf('so_chung_tu')} hint="Tự sinh, có thể sửa"/>
        <Inp label="Ngày CT" req type="date" value={form.ngay_chung_tu} onChange={sf('ngay_chung_tu')}/>
        <Sel label="Kỳ Kế Toán" req value={form.period_id} onChange={sf('period_id')} options={kyOptions}/>
        <Sel label="Tài Khoản NH" req value={form.tk_id} onChange={sf('tk_id')}
          options={accounts.map(a=>({value:a.id,label:`${a.ma_tk} - ${a.ten_tk}`}))}/>
        <Sel label="Loại Giao Dịch" value={form.loai_giao_dich} onChange={sf('loai_giao_dich')}
          options={ltypes.map(t=>({value:t.value||t.name||t,label:t.label||t.name||t}))}/>
        {isTTG
          ?<Sel label="Khách Hàng" value={form.khach_hang_id||''} onChange={sf('khach_hang_id')}
              options={customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))}/>
          :<Sel label="Nhà Cung Cấp" value={form.supplier_id||''} onChange={sf('supplier_id')}
              options={suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))}/>
        }
        <div className="col-span-2">
          <Inp label={isTTG?'Số Tiền Thu':'Số Tiền Chi'} req type="number" min="0"
            value={isTTG?form.so_tien_thu:form.so_tien_chi}
            onChange={sf(isTTG?'so_tien_thu':'so_tien_chi')}/>
        </div>
        <div className="col-span-3"><Inp label="Nội Dung" value={form.noi_dung} onChange={sf('noi_dung')}/></div>
      </div>
      <div className={`mt-3 p-3 rounded-lg border flex justify-between items-center ${isTTG?'bg-green-50 border-green-200':'bg-green-50 border-green-200'}`}>
        <span className={`text-sm font-semibold ${isTTG?'text-green-800':'text-green-800'}`}>{isTTG?'Số Tiền Thu:':'Số Tiền Chi:'}</span>
        <span className={`text-xl font-bold font-mono ${isTTG?'text-green-700':'text-green-700'}`}>{fmt(isTTG?form.so_tien_thu:form.so_tien_chi)}</span>
      </div></CB>
      <CF>
        <Btn v="outline" onClick={()=>setTab('list')}>Hủy</Btn>
        <Btn v={isTTG?'success':'success'} onClick={save}>💾 Lưu</Btn>
      </CF>
    </Card>}
  </div>)
}

// PHIẾU NHẬP MUA - API: NgayCT, SoCT, MaNCC, SoHD, NgayHD, NguoiGD, DienGiai, MaKyKeToan, HinhThucTT, DanhSachHang[{MaHH,SoLuong,DonGia,GhiChu}]
const PurchaseInvoice=({onNav,onOpenPnk,autoOpenPnmId=null,onAutoOpenPnmDone=null})=>{
  const [data,loading,load]=useList('/documents/phieu-nhap-mua')
  const [tab,setTab]=useState('list')
  const [suppliers,setSuppliers]=useState([])
  const [products,setProducts]=useState([])
  const [warehouses,setWarehouses]=useState([])
  const [units,setUnits]=useState([])
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)
  const [editModal,setEditModal]=useState(false)
  const [editForm,setEditForm]=useState(null)
  const [editRows,setEditRows]=useState([])
  const [editLoading,setEditLoading]=useState(false)
  const [editPhanBoMethod,setEditPhanBoMethod]=useState('sl')
  const [editCpmhDonGia,setEditCpmhDonGia]=useState(0)
  const sef=k=>e=>setEditForm(f=>({...f,[k]:e.target.value}))

  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PNM-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.SoCT||r.so_chung_tu||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }

  const makeNewSoPNK=(pnkList=[])=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PNK-${ym}`
    const maxNum=(pnkList||[]).reduce((mx,r)=>{
      const s=r.so_phieu_nhap||''; if(!s.startsWith(pre)) return mx
      const n=parseInt(s.split('-').pop())||0; return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }

  const makeEmptyForm=(list=[],pnkList=[])=>({
    SoCT:makeNewSoCT(list),NgayCT:today(),MaKyKeToan:kyDefault,
    MaNCC:'',NguoiGD:'',DienGiai:'',SoHD:'',NgayHD:today(),HinhThucTT:'Tiền mặt',
    SoPNK:makeNewSoPNK(pnkList)
  })
  //const emptyRows=()=>[{product_id:'',quantity:1,unit_price:0,tax_rate:0}]
  const emptyRows=()=>[{product_id:'',warehouse_id:'',quantity:1,unit_price:0,chi_phi_phan_bo:0}]

  const [form,setForm]=useState(()=>makeEmptyForm())
  const [rows,setRows]=useState(emptyRows())
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  const [pnkList,setPnkList]=useState([])
  const [detailTab,setDetailTab]=useState('hang')
  const [useCPMH,setUseCPMH]=useState(false)
  const [cpmhName,setCpmhName]=useState('Chi Phí Mua Hàng')
  const [cpmhDonGia,setCpmhDonGia]=useState(0)
  const [phanBoMethod,setPhanBoMethod]=useState('sl')
  const [tongChiPhi,setTongChiPhi]=useState(0)

  useEffect(()=>{
    api('GET','/suppliers').then(d=>setSuppliers(Array.isArray(d)?d:[]))
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
    api('GET','/documents/phieu-nhap-kho').then(d=>setPnkList(Array.isArray(d)?d:[]))
    api('GET','/warehouses').then(d=>setWarehouses(Array.isArray(d)?d:[]))
    api('GET','/units').then(d=>setUnits(Array.isArray(d)?d:[]))
  },[])

  useEffect(()=>{
    if(!loading&&tab==='list')
      setForm(f=>({...f,SoCT:makeNewSoCT(data)}))
  },[data,loading])

  useEffect(()=>{
    if(pnkList.length>0){
      console.log('pnkList sample:', JSON.stringify(pnkList[0]))
      setForm(f=>({...f,SoPNK:makeNewSoPNK(pnkList)}))
    }
  },[pnkList])
  useEffect(()=>{
    if(!autoOpenPnmId) return
    // Chờ data load xong rồi tìm và mở
    if(loading) return
    const row=data.find(r=>String(r.id)===String(autoOpenPnmId))
    if(row){
      openDetail(row)
    } else {
      // Nếu không tìm thấy trong list → fetch trực tiếp
      api('GET',`/documents/phieu-nhap-mua/${autoOpenPnmId}`).then(r=>{
        if(r&&!r.__error) openDetail({id:autoOpenPnmId,...r})
      })
    }
    if(onAutoOpenPnmDone) onAutoOpenPnmDone()
  },[autoOpenPnmId,loading])

  // Hàm xem chi tiết phiếu
  const openDetail=async(row)=>{
    setDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    const r=await api('GET',`/documents/phieu-nhap-mua/${row.id}`)
    const pnkLinked=pnkList.find(p=>String(p.pnm_id)===String(row.id))||null
    setDetail(r&&!r.__error
      ?{...r,linkedPNK:pnkLinked,onClickPNK:(pnkId)=>{if(onOpenPnk)onOpenPnk(pnkId)}}
      :{...row,items:[],linkedPNK:pnkLinked,onClickPNK:(pnkId)=>{if(onOpenPnk)onOpenPnk(pnkId)}})
    setDetailLoading(false)
  }
  const openEdit=(d)=>{
    setEditForm({
      SoCT: d.SoCT||'',
      NgayCT: String(d.NgayCT||today()).slice(0,10),
      MaKyKeToan: d.MaKyKeToan||kyDefault,
      MaNCC: d.MaNCC||d.supplier_id||'',
      NguoiGD: d.NguoiGD||'',
      DienGiai: d.DienGiai||'',
      SoHD: d.SoHD||'',
      NgayHD: String(d.NgayHD||today()).slice(0,10),
      HinhThucTT: d.HinhThucTT||'Tiền mặt'
    })
    const eRows=d.items&&d.items.length>0
      ?d.items.map(i=>({
          product_id:i.product_id,
          warehouse_id:i.warehouse_id||'',
          quantity:i.quantity||1,
          unit_price:i.unit_price||0,
          chi_phi_phan_bo:i.chi_phi_phan_bo||0,
          tax_rate:0
        }))
      :[{product_id:'',quantity:1,unit_price:0,chi_phi_phan_bo:0,tax_rate:0}]
    setEditRows(eRows)
    // Pre-fill tổng CPMH từ phiếu cũ
    const tongCPMH=eRows.reduce((s,r)=>s+(+r.chi_phi_phan_bo||0),0)
    setEditCpmhDonGia(tongCPMH)
    setEditPhanBoMethod('sl')
    setEditModal(true)
  }

  const saveEdit=async()=>{
    if(!editForm.NgayCT){showAlert('Vui lòng chọn Ngày CT!','danger');return}
    if(!editForm.MaKyKeToan){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
    if(!editForm.MaNCC){showAlert('Vui lòng chọn Nhà Cung Cấp!','danger');return}
    const validEditRows=editRows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validEditRows.length){showAlert('Vui lòng thêm ít nhất 1 dòng hàng hóa!','danger');return}
    setEditLoading(true)
    const body={
      SoCT: editForm.SoCT,
      NgayCT: editForm.NgayCT,
      MaNCC: +editForm.MaNCC,
      MaKyKeToan: +editForm.MaKyKeToan,
      NguoiGD: editForm.NguoiGD||null,
      DienGiai: editForm.DienGiai||null,
      SoHD: editForm.SoHD||null,
      NgayHD: editForm.NgayHD||null,
      HinhThucTT: editForm.HinhThucTT||null,
      DanhSachHang: editRows.filter(r=>r.product_id&&+r.quantity>0).map(r=>({
        MaHH:+r.product_id,
        SoLuong:+r.quantity,
        DonGia:+r.unit_price,
        ChiPhiPhanBo:+r.chi_phi_phan_bo||0,
        MaKho:+r.warehouse_id||null,
        GhiChu:''
      }))
    }
    const r=await api('PUT',`/documents/phieu-nhap-mua/${detail.id}`,body)
    setEditLoading(false)
    if(r&&!r.__error){
      // ✅ Tìm và cập nhật PNK liên kết theo pnm_id
      const pnkData=await api('GET','/documents/phieu-nhap-kho')
      const pnkList=Array.isArray(pnkData)?pnkData:[]
      const linkedPNK=pnkList.find(p=>p.pnm_id===detail.id)
      console.log('detail.id:', detail.id, 'pnkList pnm_ids:', pnkList.map(p=>({id:p.id, pnm_id:p.pnm_id})))
      console.log('linkedPNK:', linkedPNK)
      if(linkedPNK){
        const pnkBody={
          so_phieu_nhap: linkedPNK.so_phieu_nhap,
          ngay_phieu_nhap: editForm.NgayCT,
          loai_phieu_nhap: linkedPNK.loai_phieu_nhap||'Nhập mua',
          nha_cung_cap_id: +editForm.MaNCC,
          nguoi_giao_dich: editForm.NguoiGD||null,
          dien_giai: linkedPNK.dien_giai||`Nhập kho cho ${editForm.SoCT}`,
          ky_ke_toan_id: +editForm.MaKyKeToan,
          pnm_id: detail.id,
          items: validEditRows.map(r=>({
            product_id: +r.product_id,
            warehouse_id: +r.warehouse_id||null,
            quantity: +r.quantity,
            unit_price: +r.unit_price,
            chi_phi_phan_bo: +r.chi_phi_phan_bo||0
          }))
        }
        await api('PUT',`/documents/phieu-nhap-kho/${linkedPNK.id}`,pnkBody)
      }
      showAlert('Cập nhật PNM thành công!'+(linkedPNK?' Đã cập nhật PNK liên kết.':''))
      setEditModal(false); setDetailModal(false); setDetail(null); load()
    } else showAlert('Lỗi: '+(r?.message||'Cập nhật thất bại'),'danger')
  }
  const reloadProducts=()=>{
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
  }
  // Helper tên NCC
  const getNCCLabel=(id)=>{
    if(!id) return '-'
    const s=suppliers.find(x=>String(x.id)===String(id))
    return s?`${s.TenNCC||s.name} (${s.MaNCC||s.code})`:`NCC #${id}`
  }

  const save=async()=>{
    console.log('rows khi save:', JSON.stringify(rows.map(r=>({pid:r.product_id,qty:r.quantity,cpb:r.chi_phi_phan_bo}))))
    if(!form.SoCT){showAlert('Vui lòng điền Số CT!','danger');return}
    if(!form.SoCT){showAlert('Vui lòng điền Số CT!','danger');return}
    if(!form.NgayCT){showAlert('Vui lòng chọn Ngày CT!','danger');return}
    if(!form.MaKyKeToan){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
    if(!form.MaNCC){showAlert('Vui lòng chọn Nhà Cung Cấp!','danger');return}
    const validRows=rows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validRows.length){
      showAlert('Vui lòng thêm ít nhất 1 dòng hàng hóa!','danger'); return
    }
    if(validRows.some(r=>!r.warehouse_id)){
      showAlert('Vui lòng chọn Kho Nhập cho tất cả dòng hàng!','danger'); return
    }
    const body={
      NgayCT:form.NgayCT, SoCT:form.SoCT, MaNCC:+form.MaNCC,
      MaKyKeToan:+form.MaKyKeToan,
      SoHD:form.SoHD||null, NgayHD:form.NgayHD||null,
      NguoiGD:form.NguoiGD||null, DienGiai:form.DienGiai||null,
      HinhThucTT:form.HinhThucTT||null,
      DanhSachHang:validRows.map(r=>({MaHH:+r.product_id,SoLuong:+r.quantity,DonGia:+r.unit_price,GhiChu:'',ChiPhiPhanBo:+r.chi_phi_phan_bo||0,MaKho:+r.warehouse_id||null}))
    }
    const r=await api('POST','/documents/phieu-nhap-mua',body)
    if(r&&!r.__error){
      // ✅ Tự động tạo PNK liên kết
      const pnkItems=validRows.map(row=>({
        product_id:+row.product_id,
        warehouse_id:+row.warehouse_id||null,
        quantity:+row.quantity,
        unit_price:+row.unit_price,
        chi_phi_phan_bo:+row.chi_phi_phan_bo||0
      }))
      // Thêm dòng CPMH nếu có
      if(useCPMH&&+cpmhDonGia>0){
        pnkItems.push({
          product_id:null,
          warehouse_id:1,
          quantity:1,
          unit_price:+cpmhDonGia,
          is_cpmh:true,
          ten_cpmh:cpmhName
        })
      }
      const pnkBody={
        so_phieu_nhap: form.SoPNK,
        ngay_phieu_nhap: form.NgayCT,
        loai_phieu_nhap: 'Nhập mua',
        nha_cung_cap_id: +form.MaNCC,
        nguoi_giao_dich: form.NguoiGD||null,
        dien_giai: `Nhập kho cho ${form.SoCT}`,
        ky_ke_toan_id: +form.MaKyKeToan,
        pnm_id: r.id,                         // ✅ THÊM — id của PNM vừa tạo
        items: pnkItems.filter(i=>i.product_id)
      }
      console.log('pnkBody items:', JSON.stringify(pnkBody.items))
      const pnkRes=await api('POST','/documents/phieu-nhap-kho',pnkBody)
      
      if(pnkRes&&!pnkRes.__error)
        showAlert(`Tạo PNM ${form.SoCT} thành công! Đã tạo PNK ${form.SoPNK} liên kết.`)
      else
        showAlert(`Tạo PNM ${form.SoCT} thành công! (Tạo PNK thất bại: ${pnkRes?.message||'lỗi'})`, 'warning')

      const newData=await api('GET','/documents/phieu-nhap-mua')
      const newPnk=await api('GET','/documents/phieu-nhap-kho')
      const list=Array.isArray(newData)?newData:[]
      setPnkList(Array.isArray(newPnk)?newPnk:[])
      setForm(makeEmptyForm(list,Array.isArray(newPnk)?newPnk:[]))
      setRows(emptyRows())
      setUseCPMH(false); setCpmhDonGia(0); setDetailTab('hang')
      load(); setTab('list')
    } else showAlert('Lỗi: '+(r?.message||'Tạo PNM thất bại'),'danger')
  }

  const totalHH=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)
  const totalTax=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price)*(+r.tax||0)/100,0)
  const totalCPMH=useCPMH?+cpmhDonGia:0
  const total=totalHH+totalTax+totalCPMH

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}

    {/* Modal xem chi tiết */}
    <DetailModal
      open={detailModal}
      onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`🛒 Chi Tiết Phiếu Nhập Mua - ${detail?.SoCT||''}`}
      detail={detail}
      loading={detailLoading}
      products={products}
      customers={[]}
      suppliers={suppliers}
      warehouses={warehouses}
      onEdit={detail?()=>openEdit(detail):null}/>      
    {editModal&&editForm&&<Modal open={editModal} onClose={()=>setEditModal(false)}
      title={`✏️ Sửa Phiếu Nhập Mua - ${editForm.SoCT}`} size="lg">
      {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Inp label="Số CT" value={editForm.SoCT} disabled hint="Không thể sửa số CT"/>
        <Inp label="Ngày CT" req type="date" value={editForm.NgayCT} onChange={sef('NgayCT')}/>
        <Sel label="Kỳ Kế Toán" req value={editForm.MaKyKeToan||''} onChange={sef('MaKyKeToan')} options={kyOptions}/>
        <div className="col-span-2">
          <Sel label="Nhà Cung Cấp" req value={editForm.MaNCC||''} onChange={sef('MaNCC')}
            options={suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))}/>
        </div>
        <Sel label="Hình Thức TT" value={editForm.HinhThucTT} onChange={sef('HinhThucTT')}
          options={['Tiền mặt','Chuyển khoản','Thẻ']}/>
        <Inp label="Số HĐ" value={editForm.SoHD} onChange={sef('SoHD')}/>
        <Inp label="Ngày HĐ" type="date" value={editForm.NgayHD} onChange={sef('NgayHD')}/>
        <Inp label="Người Giao Dịch" value={editForm.NguoiGD} onChange={sef('NguoiGD')}/>
        <div className="col-span-3">
          <Inp label="Diễn Giải" value={editForm.DienGiai} onChange={sef('DienGiai')}/>
        </div>
      </div>
      {/* Thanh phân bổ CPMH */}
      <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Phương thức phân bổ</p>
          <select value={editPhanBoMethod} onChange={e=>setEditPhanBoMethod(e.target.value)}
            className="px-3 py-1.5 border border-orange-300 rounded text-sm bg-white">
            <option value="sl">Tỷ lệ % theo số lượng</option>
            <option value="gt">Tỷ lệ % theo giá trị</option>
            <option value="pct">Tự nhập %</option>
            <option value="val">Tự nhập giá trị</option>
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Tổng CPMH</p>
          <input type="number" value={editCpmhDonGia}
            onChange={e=>setEditCpmhDonGia(+e.target.value)}
            className="w-32 px-2 py-1.5 border border-orange-300 rounded text-sm text-right font-mono"/>
        </div>
        <button onClick={()=>{
          const validR=editRows.filter(r=>r.product_id&&+r.quantity>0)
          console.log('[PhanBoEdit] validR.length='+validR.length+' editCpmhDonGia='+editCpmhDonGia)
          console.log('[PhanBoEdit] validR='+JSON.stringify(validR.map(r=>({pid:r.product_id,qty:r.quantity,cpb:r.chi_phi_phan_bo}))))
          if(!validR.length){showAlert('Chưa có hàng hóa!','warning');return}
          if(!+editCpmhDonGia){showAlert('Vui lòng nhập Tổng CPMH!','warning');return}
          const cp=+editCpmhDonGia
          const tongSL=validR.reduce((s,r)=>s+(+r.quantity),0)
          const tongGT=validR.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)
          let allocated=0
          // Tính phân bổ cho từng dòng valid, dòng cuối hấp thụ phần lẻ
          const result=validR.map((r,idx)=>{
            let pb=0
            if(idx===validR.length-1){
              pb=cp-allocated
            } else if(editPhanBoMethod==='sl'){
              pb=tongSL?Math.round(cp*(+r.quantity/tongSL)):0
              allocated+=pb
            } else if(editPhanBoMethod==='gt'){
              const gt=(+r.quantity)*(+r.unit_price)
              pb=tongGT?Math.round(cp*(gt/tongGT)):0
              allocated+=pb
            }
            return {...r,chi_phi_phan_bo:pb}
          })
          // Map lại vào editRows đầy đủ theo product_id + index trong validR
          setEditRows(rs=>{
            let vi=0  // ← đưa vi vào trong updater
            const newRs=rs.map(r=>{
              if(!r.product_id||!+r.quantity) return {...r,chi_phi_phan_bo:0}
              const updated=result[vi]
              vi++
              return updated||r
            })
            console.log('[PhanBoEdit] newRs='+JSON.stringify(newRs.map(r=>({pid:r.product_id,cpb:r.chi_phi_phan_bo}))))
            return newRs
          })
          showAlert('✅ Đã phân bổ lại CPMH!')
        }}
          className="mt-5 px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 whitespace-nowrap">
          ⚡ Phân Bổ Lại
        </button>
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500">Tổng đã phân bổ</p>
          <p className="font-mono font-bold text-orange-700">
            {fmtN(editRows.reduce((s,r)=>s+(+r.chi_phi_phan_bo||0),0))}
          </p>
        </div>
      </div>

      <p className="text-xs font-bold text-gray-600 mb-2">📦 Danh Sách Hàng Hóa:</p>
      <DetailTbl rows={editRows} setRows={setEditRows} products={products} warehouses={warehouses} color="blue" hasTax={true} hasWarehouse={true}
        units={units} onProductCreated={reloadProducts}/>
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
        <span className="text-sm font-bold text-blue-800">Tổng Thanh Toán:</span>
        <span className="text-lg font-bold text-blue-700 font-mono">
          {fmt(editRows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price)+(+r.chi_phi_phan_bo||0),0))}
        </span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
        <Btn v="success" onClick={saveEdit} disabled={editLoading}>
          {editLoading?'Đang lưu...':'💾 Lưu Thay Đổi'}
        </Btn>
      </div>
    </Modal>}

    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]}
      active={tab}
      onChange={t=>{
        setTab(t)
        if(t==='create'){
          // Reload PNK list để sinh số không trùng
          api('GET','/documents/phieu-nhap-kho').then(newPnk=>{
            const list=Array.isArray(newPnk)?newPnk:[]
            setPnkList(list)
            setForm(makeEmptyForm(data,list))
          })
          setRows(emptyRows())
          setUseCPMH(false); setCpmhDonGia(0); setDetailTab('hang')
        }
      }}/>

    {/* ── DANH SÁCH ── */}
    {tab==='list'&&<Card>
      <CH>
        <h3 className="font-bold">🛒 Danh Sách Phiếu Nhập Mua</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={()=>exportExcel('PhieuNhapMua','Phiếu Nhập Mua',
            ['Số CT','Ngày CT','Nhà Cung Cấp','Tổng Tiền','Trạng Thái'],
            data.map(r=>[r.SoCT,fmtDate(r.NgayCT),getNCCLabel(r.MaNCC||r.supplier_id),r.TongTien||0,r.TrangThai||'DRAFT'])
          )}>⬇ Excel</Btn>
        </div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-red-600 bg-blue-50 border-b border-blue-100">
        💡 Click vào Số CT để xem chi tiết phiếu
      </p>
      <Tbl data={data} loading={loading} empty="Chưa có phiếu nhập mua" cols={[
        {k:'SoCT',l:'Số CT',w:'160px',fn:(v,r)=>(
          <button
            onClick={()=>openDetail(r)}
            className="text-blue-600 hover:underline font-mono text-xs font-semibold">
            {v||r.so_phieu||'-'}
          </button>
        )},
        {k:'NgayCT',l:'Ngày CT',w:'100px',fn:(v,r)=>fmtDate(v||r.ngay_phieu)},
        {k:'MaNCC',l:'Nhà Cung Cấp',fn:(v,r)=>{
          const id=v??r.supplier_id??r.MaNCC
          return <span className="font-medium">{getNCCLabel(id)}</span>
        }},
        {k:'TongTien',l:'Tổng TT',w:'130px',r:true,
          fn:(v,r)=><span className="font-semibold text-blue-700">{fmt(v||r.TongTien||0)}</span>
        },
        {k:'TrangThai',l:'TT',w:'90px',
          fn:(v,r)=><Badge v={v==='POSTED'?'success':'warning'}>{v||r.trang_thai||'DRAFT'}</Badge>
        },
      ]}/>
    </Card>}

    {/* ── TẠO MỚI ── */}
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">🛒 Tạo Phiếu Nhập Mua</h3></CH>
      <CB>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Inp label="Số CT" req value={form.SoCT} onChange={sf('SoCT')} hint="Tự sinh, có thể sửa"/>
          <Inp label="Số PNK" req value={form.SoPNK} onChange={sf('SoPNK')} hint="Số phiếu nhập kho"/>
          <Inp label="Ngày CT" req type="date" value={form.NgayCT} onChange={sf('NgayCT')}/>
          <Sel label="Kỳ Kế Toán" req value={form.MaKyKeToan||''} onChange={sf('MaKyKeToan')} options={kyOptions}/>
          <div className="col-span-2">
            <Sel label="Nhà Cung Cấp" req value={form.MaNCC||''} onChange={sf('MaNCC')}
              options={suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))}/>
          </div>
          <Sel label="Hình Thức TT" value={form.HinhThucTT} onChange={sf('HinhThucTT')}
            options={['Tiền mặt','Chuyển khoản','Thẻ']}/>
          <Inp label="Số HĐ" value={form.SoHD} onChange={sf('SoHD')} placeholder="Số hóa đơn NCC cấp"/>
          <Inp label="Ngày HĐ" type="date" value={form.NgayHD} onChange={sf('NgayHD')}/>
          <Inp label="Người Giao Dịch" value={form.NguoiGD} onChange={sf('NguoiGD')}/>
          <div className="col-span-3">
            <Inp label="Diễn Giải" value={form.DienGiai} onChange={sf('DienGiai')}/>
          </div>
        </div>

        {/* Tab Hàng HH / Chi Phí */}
        <div className="flex border-b border-gray-200 mb-3">
          <button onClick={()=>setDetailTab('hang')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${detailTab==='hang'?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            📦 Danh Sách Hàng Hóa
          </button>
          <button onClick={()=>setDetailTab('chiphi')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${detailTab==='chiphi'?'border-orange-500 text-orange-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            💰 Chi Phí
          </button>
        </div>        
        {detailTab==='hang'&&<>
          <DetailTbl rows={rows} setRows={setRows} products={products} warehouses={warehouses} color="blue" hasTax={true} hasWarehouse={true} warehouseLabel="Kho Nhập"
            units={units} onProductCreated={reloadProducts}/>
          {/* Dòng CPMH cố định */}
          <div className={`mt-2 p-3 rounded-lg border-2 ${useCPMH?'border-green-400 bg-blue-50':'border-dashed border-gray-300 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={useCPMH} onChange={e=>setUseCPMH(e.target.checked)}
                className="w-4 h-4 accent-green-500 cursor-pointer"/>
              <span className="text-xs font-bold text-gray-500 w-16">CPMH</span>
              <input value={cpmhName} onChange={e=>setCpmhName(e.target.value)}
                disabled={!useCPMH}
                className={`flex-1 px-2 py-1 text-sm border rounded ${useCPMH?'border-blue-300 bg-white':'border-gray-200 bg-gray-100 text-gray-400'}`}/>
              <span className="text-xs text-gray-500 w-6">1</span>
              <input type="number" value={cpmhDonGia} onChange={e=>setCpmhDonGia(+e.target.value)}
                disabled={!useCPMH} min="0"
                className={`w-32 px-2 py-1 text-sm border rounded text-right ${useCPMH?'border-green-300 bg-white':'border-gray-200 bg-gray-100 text-gray-400'}`}/>
              <span className={`w-32 text-right text-sm font-mono font-semibold ${useCPMH?'text-green-700':'text-gray-400'}`}>
                {useCPMH?fmtN(cpmhDonGia):'0'}
              </span>
            </div>
            {!useCPMH&&<p className="text-xs text-red-500 mt-1 ml-7">☑ Tick để thêm Chi Phí Mua Hàng</p>}
          </div>
        </>}

        {detailTab==='chiphi'&&<div className="space-y-3">
          {!useCPMH
            ?<div className="p-6 text-center bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg">
              <p className="text-orange-600 font-semibold">⚠️ Cần bật CPMH ở tab Danh Sách Hàng Hóa trước</p>
              <p className="text-xs text-gray-500 mt-1">Tick vào checkbox CPMH và nhập đơn giá để sử dụng tính năng phân bổ chi phí</p>
              <Btn v="warning" onClick={()=>setDetailTab('hang')} className="mt-3">← Quay lại Tab Hàng Hóa</Btn>
            </div>
            :<>
              {/* Header */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phương thức phân bổ</p>
                    <select value={phanBoMethod} onChange={e=>{
                      setPhanBoMethod(e.target.value)
                      // Reset phân bổ khi đổi phương thức
                      setRows(rs=>rs.map(r=>({...r,chi_phi_phan_bo:0,ty_le_phan_bo:0})))
                    }}
                      className="px-3 py-2 border border-gray-300 rounded text-sm bg-white min-w-[200px]">
                      <option value="sl">Tỷ lệ % theo số lượng</option>
                      <option value="gt">Tỷ lệ % theo giá trị</option>
                      <option value="pct">Tự nhập %</option>
                      <option value="val">Tự nhập giá trị</option>
                    </select>
                  </div>
                  <button onClick={()=>{
                    const validR=rows.filter(r=>r.product_id&&+r.quantity>0)
                    console.log('[PhanBo] validR.length='+validR.length+' cpmhDonGia='+cpmhDonGia)
                    console.log('[PhanBo] validR='+JSON.stringify(validR.map(r=>({pid:r.product_id,qty:r.quantity,cpb:r.chi_phi_phan_bo}))))
                    if(!validR.length) return
                    const cp=+cpmhDonGia
                    if(!cp){showAlert('Vui lòng nhập đơn giá CPMH!','warning');return}
                    const tongSL=validR.reduce((s,r)=>s+(+r.quantity),0)
                    const tongGT=validR.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)
                    let allocated=0
                    // Tính pb cho từng validR theo index
                    const pbList=validR.map((r,idx)=>{
                      let pb=0, tl=0
                      if(idx===validR.length-1){
                        pb=cp-allocated
                        tl=tongSL?(+r.quantity/tongSL*100):0
                      } else if(phanBoMethod==='sl'){
                        tl=tongSL?(+r.quantity/tongSL*100):0
                        pb=Math.round(cp*(+r.quantity/tongSL))
                        allocated+=pb
                      } else if(phanBoMethod==='gt'){
                        const gt=(+r.quantity)*(+r.unit_price)
                        tl=tongGT?(gt/tongGT*100):0
                        pb=Math.round(cp*(gt/tongGT))
                        allocated+=pb
                      }
                      return {pb, tl:Math.round(tl*100)/100}
                    })
                    // Map lại rows theo index trong validR — không dùng indexOf
                    setRows(rs=>{
                      let vi=0  // ← đưa vi vào trong updater
                      const newRs=rs.map(r=>{
                        if(!r.product_id||!+r.quantity) return {...r,chi_phi_phan_bo:0,ty_le_phan_bo:0}
                        const {pb,tl}=pbList[vi]||{pb:0,tl:0}
                        vi++
                        return {...r,chi_phi_phan_bo:pb,ty_le_phan_bo:tl}
                      })
                      console.log('[PhanBo] newRs='+JSON.stringify(newRs.map(r=>({pid:r.product_id,cpb:r.chi_phi_phan_bo}))))
                      return newRs
                    })
                  }}
                    className="mt-5 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700">
                    Phân Bổ
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Tổng chi phí mua hàng</p>
                  <p className="text-2xl font-bold font-mono text-gray-800">{fmtN(cpmhDonGia)}</p>
                </div>
              </div>

              {/* Bảng phân bổ */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700 w-28">MÃ HÀNG</th>
                      <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-700">TÊN HÀNG</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 w-24">SỐ LƯỢNG</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 w-32">THÀNH TIỀN</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 w-32">TỶ LỆ PHÂN BỔ</th>
                      <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-700 w-32">CHI PHÍ MUA HÀNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.reduce((acc,r,ri)=>{
                      if(!r.product_id||!+r.quantity) return acc
                      return [...acc,{r,ri}]
                    },[]).map(({r,ri},i)=>{
                      const p=products.find(x=>String(x.id)===String(r.product_id))
                      const tt=(+r.quantity)*(+r.unit_price)
                      return(
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{p?.MaHH||p?.code||'-'}</td>
                          <td className="px-3 py-2.5 font-medium">{p?.TenHH||p?.name||`SP #${r.product_id}`}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{fmtN(+r.quantity)}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{fmtN(tt)}</td>
                          <td className="px-3 py-2.5 text-right">
                            {(phanBoMethod==='pct')
                              ?<input type="number" value={r.ty_le_phan_bo||0}
                                  onChange={e=>setRows(rs=>rs.map((x,xi)=>{
                                    if(xi!==ri) return x
                                    const tl=+e.target.value
                                    return {...x,ty_le_phan_bo:tl,chi_phi_phan_bo:Math.round(+cpmhDonGia*tl/100)}
                                  }))}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-xs text-right"/>
                              :<span className="font-mono text-gray-700">{(r.ty_le_phan_bo||0).toFixed(2)}%</span>
                            }
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {phanBoMethod==='val'
                              ?<input type="number" value={r.chi_phi_phan_bo||0}
                                  onChange={e=>setRows(rs=>rs.map((x,xi)=>xi===ri?{...x,chi_phi_phan_bo:+e.target.value}:x))}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-xs text-right"/>
                              :<span className="font-mono font-semibold text-blue-700">{fmtN(r.chi_phi_phan_bo||0)}</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-3 py-2.5 font-bold text-sm text-gray-700"></td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">
                        {fmtN(rows.reduce((s,r)=>s+(+r.quantity||0),0))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">
                        {fmtN(rows.reduce((s,r)=>s+(+r.quantity||0)*(+r.unit_price||0),0))}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-700">
                        {(rows.reduce((s,r)=>s+(+r.ty_le_phan_bo||0),0)).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700">
                        {fmtN(rows.reduce((s,r)=>s+(+r.chi_phi_phan_bo||0),0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Nút */}
              <div className="flex justify-end gap-2 pt-2">
                <Btn v="outline" onClick={()=>{
                  setRows(rs=>rs.map(r=>({...r,chi_phi_phan_bo:0,ty_le_phan_bo:0})))
                }}>Hủy Phân Bổ</Btn>
                <Btn v="success" onClick={()=>{
                  const tong=rows.reduce((s,r)=>s+(+r.chi_phi_phan_bo||0),0)
                  if(+cpmhDonGia>0&&Math.abs(tong-+cpmhDonGia)>1){
                    showAlert(`Tổng phân bổ (${fmtN(tong)}) chưa khớp Tổng CP (${fmtN(+cpmhDonGia)})!`,'warning')
                    return
                  }
                  showAlert('✅ Đã xác nhận phân bổ chi phí!')
                  setDetailTab('hang')
                }}>✅ Xác Nhận Phân Bổ</Btn>
              </div>
            </>
          }
        </div>}

        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-green-700">Tiền Hàng:</span>
            <span className="font-mono text-green-700">{fmt(totalHH)}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-orange-600">Tiền Thuế:</span>
            <span className="font-mono text-orange-600">{fmt(totalTax)}</span>
          </div>
          {useCPMH&&<div className="flex justify-between items-center mb-1">
            <span className="text-sm text-orange-600">Chi Phí Mua Hàng (CPMH):</span>
            <span className="font-mono text-orange-600">{fmt(totalCPMH)}</span>
          </div>}
          <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
            <span className="text-sm font-bold text-green-800">Tổng Thanh Toán:</span>
            <span className="text-xl font-bold text-green-700 font-mono">{fmt(total)}</span>
          </div>
        </div>
      </CB>
      <CF>
        <Btn v="outline" onClick={()=>{
          setTab('list')
          setForm(makeEmptyForm(data))
          setRows(emptyRows())
        }}>Hủy</Btn>
        <Btn v="success" onClick={save}>💾 Lưu & Đóng</Btn>
      </CF>
    </Card>}
  </div>)
}

// PHIẾU BÁN HÀNG - tương tự PNM nhưng dùng MaKH thay MaNCC
// ══ GIA VON TAB — dùng chung cho PBH và BL
const GiaVonTab=({rows,products,giaVonRows,loading,onReload,kyLabel=''})=>{
  const giaVonMap={}
  ;(giaVonRows||[]).forEach(r=>{
    const pid=String(r.product_id)
    const donGia=+(r.don_gia_von||r.unit_price||r.closing_unit_price||0)
    if(!giaVonMap[pid]||donGia>0) giaVonMap[pid]=donGia
  })
 
  const validRows=rows.filter(r=>r.product_id&&+r.quantity>0)
  const tongGiaVon=validRows.reduce((s,r)=>{
    const donGiaVon=giaVonMap[String(r.product_id)]||0
    return s+donGiaVon*(+r.quantity)
  },0)
 
  if(loading) return(
    <div className="py-8 text-center">
      <div className="inline-block w-6 h-6 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"/>
      <p className="text-sm text-gray-500 mt-2">Đang tải giá vốn...</p>
    </div>
  )
 
  return(
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Kỳ tính giá:</span>
          <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-semibold text-blue-700">
            {kyLabel||'(chưa chọn kỳ)'}
          </span>
          {!giaVonRows.length&&<span className="text-xs text-orange-500">⚠️ Chưa có dữ liệu — cần tính giá HTK kỳ này trước</span>}
        </div>
        <button onClick={onReload}
          className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-semibold hover:bg-blue-100 flex items-center gap-1">
          🔄 Tải Lại Giá Vốn
        </button>
      </div>
 
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 border-b-2 border-blue-200">
            <tr>
              <th className="px-3 py-2.5 text-center text-xs font-bold text-blue-700 w-10">STT</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-blue-700 w-28">Mã Hàng</th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-blue-700">Tên Hàng Hóa</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold text-blue-700 w-20">SL</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold text-blue-700 w-32">Đơn Giá Vốn</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold text-blue-700 w-32">Thành Tiền Vốn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {validRows.length===0
              ?<tr><td colSpan={6} className="py-8 text-center text-gray-400 text-sm">Chưa có hàng hóa — thêm ở tab Danh Sách Hàng Hóa</td></tr>
              :validRows.map((r,i)=>{
                const p=products.find(x=>String(x.id)===String(r.product_id))
                const donGiaVon=giaVonMap[String(r.product_id)]||0
                const thanhTienVon=donGiaVon*(+r.quantity)
                const hasGV=donGiaVon>0
                return(
                  <tr key={i} className="hover:bg-blue-50/30">
                    <td className="px-3 py-2.5 text-center text-gray-400 text-xs">{i+1}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-gray-600">{p?.MaHH||p?.code||'-'}</td>
                    <td className="px-3 py-2.5 font-medium text-sm">{p?.TenHH||p?.name||`SP #${r.product_id}`}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm">{fmtN(+r.quantity)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm">
                      {hasGV?<span className="text-blue-700 font-semibold">{fmtN(donGiaVon)}</span>:<span className="text-gray-300">0</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm font-bold">
                      {hasGV?<span className="text-blue-700">{fmtN(thanhTienVon)}</span>:<span className="text-gray-300">0</span>}
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
          <tfoot className="bg-blue-50 border-t-2 border-blue-200">
            <tr>
              <td colSpan={5} className="px-3 py-2.5 text-right text-sm font-bold text-blue-800">Tổng Giá Vốn:</td>
              <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700 text-base">{fmt(tongGiaVon)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
 
      {!giaVonRows.length&&(
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
          💡 <strong>Hướng dẫn:</strong> Vào <b>Nghiệp Vụ → Tính Giá Tồn Kho</b>, chọn kỳ và chạy tính giá HTK trước. Sau đó quay lại đây nhấn <b>Tải Lại Giá Vốn</b>.
        </div>
      )}
    </div>
  )
}
const SalesOrder=({onOpenPxk,autoOpenPbhId=null,onAutoOpenPbhDone=null})=>{
  const [data,loading,load]=useList('/documents/phieu-ban-hang')
  const [tab,setTab]=useState('list')
  const [customers,setCustomers]=useState([])
  const [products,setProducts]=useState([])
  const [invoiceTemplates,setInvoiceTemplates]=useState([])
  const [warehouses,setWarehouses]=useState([])
  const {kyList,options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)
  const [editModal,setEditModal]=useState(false)
  const [editForm,setEditForm]=useState(null)
  const [editRows,setEditRows]=useState([])
  const [editLoading,setEditLoading]=useState(false)
  // Tab Giá Vốn states
  const [formTab,setFormTab]=useState('hang')
  const [giaVonRows,setGiaVonRows]=useState([])
  const [giaVonLoading,setGiaVonLoading]=useState(false)
  const [editDetailTab,setEditDetailTab]=useState('hang')
  const [editGVRows,setEditGVRows]=useState([])
  const [editGVLoading,setEditGVLoading]=useState(false)
  const sef=k=>e=>setEditForm(f=>({...f,[k]:e.target.value}))
 
  // ── Sinh số CT ──
  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PBH-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.SoCT||r.so_chung_tu||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }
 
  const makeNewSoPXK=(list=[])=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PXK-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const s=r.so_phieu_xuat||''; if(!s.startsWith(pre)) return mx
      const n=parseInt(s.split('-').pop())||0; return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }
 
  // ── Load giá vốn ──
  const loadGiaVon=async(kyId)=>{
    if(!kyId) return
    setGiaVonLoading(true)
    setGiaVonRows([])
    const r=await api('GET',`/inventory/gia-von?period_id=${kyId}`)
    console.log('[GiaVon PBH] period_id='+kyId+' response:', JSON.stringify(r))
    if(r&&!r.__error){
      if(Array.isArray(r)) setGiaVonRows(r)
      else if(Array.isArray(r.items)) setGiaVonRows(r.items)
    }
    setGiaVonLoading(false)
  }
  const loadEditGiaVon=async(kyId)=>{
    if(!kyId) return
    setEditGVLoading(true)
    const r=await api('GET',`/inventory/gia-von?period_id=${kyId}`)
    if(r&&!r.__error&&Array.isArray(r)){
      const hasNewData=r.some(x=>+(x.unit_price||0)>0)
      if(hasNewData) setEditGVRows(r)
    }
    setEditGVLoading(false)
  }
 
  const makeEmptyForm=(list=[],pxkL=[])=>({
    SoCT:makeNewSoCT(list),NgayCT:today(),
    MaKyKeToan:kyDefault||kyList[0]?.id||null,
    MaKH:'',NguoiGD:'',DienGiai:'',SoHD:'',NgayHD:today(),HinhThucTT:'Tiền mặt',
    SoPXK:makeNewSoPXK(pxkL),
    SoSeri:'',KyHieuHD:''
  })
  const emptyRows=()=>[{product_id:'',warehouse_id:'',quantity:1,unit_price:0}]
 
  const [pxkList,setPxkList]=useState([])
  const [form,setForm]=useState(()=>makeEmptyForm())
  const [rows,setRows]=useState(emptyRows())
 
  // sf: khi đổi Kỳ KT → reload giá vốn nếu đang ở tab giá vốn
  const sf=k=>e=>{
    const v=e.target.value
    setForm(f=>({...f,[k]:v}))
    if(k==='MaKyKeToan'&&formTab==='gia_von') loadGiaVon(v)
  }
 
  // ── useEffects ──
  useEffect(()=>{
    api('GET','/customers').then(d=>setCustomers(Array.isArray(d)?d:[]))
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
    api('GET','/warehouses').then(d=>setWarehouses(Array.isArray(d)?d:[]))
    api('GET','/system-config/mau_hoa_don').then(d=>{setInvoiceTemplates(Array.isArray(d?.data)?d.data:[])})
    api('GET','/documents/phieu-xuat-kho').then(d=>{
      const list=Array.isArray(d)?d:[]
      setPxkList(list)
      setForm(f=>({...f,SoPXK:makeNewSoPXK(list)}))
    })
  },[])
 
  // Khi kyList load xong → cập nhật MaKyKeToan nếu null
  useEffect(()=>{
    if(kyList.length>0){
      setForm(f=>({...f,MaKyKeToan:f.MaKyKeToan||kyList[0].id}))
    }
  },[kyList])

 useEffect(()=>{
    if(!autoOpenPbhId||loading) return
    const row=data.find(r=>String(r.id)===String(autoOpenPbhId))
    if(row) openDetail(row)
    else api('GET',`/documents/phieu-ban-hang/${autoOpenPbhId}`).then(r=>{
      if(r&&!r.__error) openDetail({id:autoOpenPbhId,...r})
    })
    if(onAutoOpenPbhDone) onAutoOpenPbhDone()
  },[autoOpenPbhId,loading])

  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))
  },[data,loading])
 
  // Auto-reload giá vốn khi kỳ thay đổi và đang ở tab giá vốn
  useEffect(()=>{
    if(form.MaKyKeToan&&tab==='create'&&formTab==='gia_von'){
      loadGiaVon(form.MaKyKeToan)
    }
  },[form.MaKyKeToan])
 
  // ── Xem chi tiết — RELOAD pxkList để tìm link PXK ──
  const openDetail=async(row)=>{
    setDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    const [r,newPxkData]=await Promise.all([
      api('GET',`/documents/phieu-ban-hang/${row.id}`),
      api('GET','/documents/phieu-xuat-kho')
    ])
    const freshPxkList=Array.isArray(newPxkData)?newPxkData:pxkList
    setPxkList(freshPxkList)
    const pxkLinked=freshPxkList.find(p=>String(p.pbh_id)===String(row.id))||null
    console.log('[PBH openDetail] row.id='+row.id+' pxkLinked='+JSON.stringify(pxkLinked))
    console.log('[PBH detail API]', JSON.stringify(r))
    setDetail(r&&!r.__error
      ?{...r,MaKyKeToan:r.MaKyKeToan||r.ky_ke_toan_id||r.period_id||row.ky_ke_toan_id||row.MaKyKeToan,
          linkedPXK:pxkLinked,
          onClickPXK:(pxkId)=>{if(onOpenPxk)onOpenPxk(pxkId)}}
      :{...row,items:[],linkedPXK:pxkLinked,
          onClickPXK:(pxkId)=>{if(onOpenPxk)onOpenPxk(pxkId)}})
    setDetailLoading(false)
  }
 
  // ── Mở Edit ──
  const openEdit=(d)=>{
    setEditDetailTab('hang')
    setEditGVRows((d.items||[]).map(i=>({
      product_id:i.product_id,
      unit_price:+(i.gia_von||0)
    })))
    setEditForm({
      SoCT:d.SoCT||'',
      NgayCT:String(d.NgayCT||today()).slice(0,10),
      MaKyKeToan:d.MaKyKeToan||kyDefault||kyList[0]?.id,
      MaKH:d.MaKH||d.customer_id||'',
      NguoiGD:d.NguoiGD||'',
      DienGiai:d.DienGiai||'',
      SoHD:d.SoHD||'',
      NgayHD:String(d.NgayHD||today()).slice(0,10),
      HinhThucTT:d.HinhThucTT||'Tiền mặt'
    })
    setEditRows((d.items||[]).map(i=>({
      product_id:i.product_id,
      warehouse_id:i.warehouse_id||'',
      quantity:i.quantity,
      unit_price:i.unit_price
    })))
    setEditModal(true)
  }
 
  // ── Lưu Edit ──
  const saveEdit=async()=>{
    if(!editForm?.NgayCT){showAlert('Vui lòng chọn Ngày CT!','danger');return}
    if(!editForm?.MaKyKeToan){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
    if(!editForm?.MaKH){showAlert('Vui lòng chọn Khách Hàng!','danger');return}
    const validEditRows=editRows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validEditRows.length){showAlert('Vui lòng thêm ít nhất 1 dòng hàng hóa!','danger');return}
    setEditLoading(true)
    const body={
      SoCT:editForm.SoCT,NgayCT:editForm.NgayCT,
      MaKH:+editForm.MaKH,MaKyKeToan:+editForm.MaKyKeToan,
      NguoiGD:editForm.NguoiGD||null,DienGiai:editForm.DienGiai||null,
      SoHD:editForm.SoHD||null,NgayHD:editForm.NgayHD||null,
      HinhThucTT:editForm.HinhThucTT||null,
      DanhSachHang:validEditRows.map(r=>{
        const gv=editGVRows.find(x=>String(x.product_id)===String(r.product_id))
        return {
          MaHH:+r.product_id,
          SoLuong:+r.quantity,
          DonGia:+r.unit_price,
          GhiChu:'',
          MaKho:+r.warehouse_id||null,
          GiaVon:+(gv?.unit_price||gv?.don_gia_von||0)
        }
      })
    }
    const r=await api('PUT',`/documents/phieu-ban-hang/${detail.id}`,body)
    if(r&&!r.__error){
      const pxkData=await api('GET','/documents/phieu-xuat-kho')
      const allPxk=Array.isArray(pxkData)?pxkData:[]
      const linkedPXK=allPxk.find(p=>String(p.pbh_id)===String(detail.id))
      const rowsWithKho=validEditRows.filter(row=>row.warehouse_id)

      if(linkedPXK){
        // Đã có PXK → sync
        const pxkBody={
          so_phieu_xuat:linkedPXK.so_phieu_xuat,
          ngay_phieu_xuat:editForm.NgayCT,
          loai_phieu_xuat:linkedPXK.loai_phieu_xuat||'Xuất bán',
          khach_hang_id:+editForm.MaKH||null,
          nguoi_giao_dich:editForm.NguoiGD||null,
          dien_giai:linkedPXK.dien_giai||`Xuất kho cho ${editForm.SoCT}`,
          ky_ke_toan_id:+editForm.MaKyKeToan,
          pbh_id:detail.id,
          items:validEditRows.map(row=>({
            product_id:+row.product_id,
            warehouse_id:+row.warehouse_id||null,
            quantity:+row.quantity,
            unit_price:+row.unit_price
          }))
        }
        await api('PUT',`/documents/phieu-xuat-kho/${linkedPXK.id}`,pxkBody)
        showAlert('Cập nhật PBH thành công! Đã cập nhật PXK liên kết.')
      } else if(rowsWithKho.length>0){
        // Chưa có PXK nhưng vừa chọn kho → tạo mới PXK
        try{
          const newPxkList=Array.isArray(pxkData)?pxkData:[]
          const newSoPXK=makeNewSoPXK(newPxkList)
          const pxkBody={
            so_phieu_xuat:newSoPXK,
            ngay_phieu_xuat:editForm.NgayCT,
            loai_phieu_xuat:'Xuất bán',
            khach_hang_id:+editForm.MaKH||null,
            nguoi_giao_dich:editForm.NguoiGD||null,
            dien_giai:`Xuất kho cho ${editForm.SoCT}`,
            ky_ke_toan_id:+editForm.MaKyKeToan,
            pbh_id:detail.id,
            items:rowsWithKho.map(row=>({
              product_id:+row.product_id,
              warehouse_id:+row.warehouse_id,
              quantity:+row.quantity,
              unit_price:+row.unit_price
            }))
          }
          const pxkRes=await api('POST','/documents/phieu-xuat-kho',pxkBody)
          if(pxkRes&&!pxkRes.__error)
            showAlert(`Cập nhật PBH thành công! Đã tạo PXK ${newSoPXK} liên kết.`)
          else
            showAlert(`Cập nhật PBH thành công! (Tạo PXK thất bại: ${pxkRes?.message||'lỗi'})`, 'warning')
        }catch(e){
          showAlert('Cập nhật PBH thành công! (Tạo PXK lỗi ngoại lệ)', 'warning')
        }
      } else {
        showAlert('Cập nhật PBH thành công!')
      }
      setEditModal(false);setDetailModal(false);setDetail(null);load()
    }
     else showAlert('Lỗi: '+(r?.message||'Cập nhật thất bại'),'danger')
    setEditLoading(false)
  }
 
  const onSelectTemplate=(e)=>{
    const val=e.target.value
    const tmpl=invoiceTemplates.find(t=>t.code===val)
    setForm(f=>({...f,SoSeri:val,KyHieuHD:tmpl?.ky_hieu||''}))
  }
 
  const getKHLabel=(id)=>{
    if(!id) return '-'
    const c=customers.find(x=>String(x.id)===String(id))
    return c?`${c.TenKH||c.name} (${c.MaKH||c.code})`:`KH #${id}`
  }
 
  // ── Lưu PBH + tự tạo PXK ──
  const save=async()=>{
    if(!form.SoCT||!form.MaKH){showAlert('Vui lòng điền: Số CT và Khách Hàng!','danger');return}
    const validRows=rows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validRows.length){showAlert('Vui lòng thêm ít nhất 1 dòng hàng hóa!','danger');return}
 
    const kyId=+form.MaKyKeToan||kyList[0]?.id
    if(!kyId){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
 
    const body={
      NgayCT:form.NgayCT,SoCT:form.SoCT,MaKH:+form.MaKH,
      SoHD:form.SoHD||null,NgayHD:form.NgayHD||null,
      NguoiGD:form.NguoiGD||null,DienGiai:form.DienGiai||null,
      MaKyKeToan:kyId,HinhThucTT:form.HinhThucTT,
      SoPXK:form.SoPXK||null,
      DanhSachHang:validRows.map(r=>{
        const gv=giaVonRows.find(x=>String(x.product_id)===String(r.product_id))
        return {
          MaHH:+r.product_id,
          SoLuong:+r.quantity,
          DonGia:+r.unit_price,
          GhiChu:'',
          MaKho:r.warehouse_id?+r.warehouse_id:null,
          GiaVon:+(gv?.unit_price||gv?.don_gia_von||0)
        }
      })
    }
    const r=await api('POST','/documents/phieu-ban-hang',body)
    if(!r||r.__error){
      showAlert('Lỗi: '+(r?.message||'Tạo PBH thất bại'),'danger')
      return
    }
 
    // Tạo PXK liên kết
    const pbhId=r.id
    const rowsWithKho=validRows.filter(row=>row.warehouse_id)
    let pxkMsg=''
    if(rowsWithKho.length>0&&form.SoPXK){
      try{
        const pxkBody={
          so_phieu_xuat:form.SoPXK,
          ngay_phieu_xuat:form.NgayCT,
          loai_phieu_xuat:'Xuất bán',
          khach_hang_id:+form.MaKH||null,
          nguoi_giao_dich:form.NguoiGD||null,
          dien_giai:`Xuất kho cho ${form.SoCT}`,
          ky_ke_toan_id:kyId,
          pbh_id:pbhId,
          items:rowsWithKho.map(row=>({product_id:+row.product_id,warehouse_id:+row.warehouse_id,quantity:+row.quantity,unit_price:+row.unit_price}))
        }
        console.log('[PBH save] Creating PXK body:', JSON.stringify(pxkBody))
        const pxkRes=await api('POST','/documents/phieu-xuat-kho',pxkBody)
        console.log('[PBH save] PXK result:', JSON.stringify(pxkRes))
        if(pxkRes&&!pxkRes.__error) pxkMsg=` Đã tạo PXK ${form.SoPXK}.`
        else pxkMsg=` (Tạo PXK thất bại: ${pxkRes?.message||'lỗi'})`
      }catch(e){
        pxkMsg=' (Tạo PXK lỗi ngoại lệ)'
        console.error('[PBH save] PXK exception:', e)
      }
    }
 
    showAlert(`Tạo PBH ${form.SoCT} thành công!${pxkMsg}`, pxkMsg.includes('thất bại')||pxkMsg.includes('lỗi')?'warning':'success')
 
    const [newData,newPxkData]=await Promise.all([
      api('GET','/documents/phieu-ban-hang'),
      api('GET','/documents/phieu-xuat-kho')
    ])
    const list=Array.isArray(newData)?newData:[]
    const newPxkList=Array.isArray(newPxkData)?newPxkData:[]
    setPxkList(newPxkList)
    setForm(makeEmptyForm(list,newPxkList))
    setRows(emptyRows())
    setFormTab('hang')
    setGiaVonRows([])
    load()
    setTab('list')
  }
 
  const total=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)
 
  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
 
    <DetailModal open={detailModal} onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`🏪 Chi Tiết Phiếu Bán Hàng - ${detail?.SoCT||''}`}
      detail={detail} loading={detailLoading} products={products} customers={customers} suppliers={[]} warehouses={warehouses}
      onEdit={detail?()=>openEdit(detail):null}
      showGiaVon={true}
      kyOptions={kyOptions}/>
 
    {editModal&&editForm&&<Modal open={editModal} onClose={()=>setEditModal(false)}
      title={`✏️ Sửa Phiếu Bán Hàng - ${editForm?.SoCT}`} size="lg">
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Inp label="Số CT" value={editForm?.SoCT||''} disabled hint="Không thể sửa số CT"/>
        <Inp label="Ngày CT" req type="date" value={editForm?.NgayCT||''} onChange={sef('NgayCT')}/>
        <Sel label="Kỳ Kế Toán" req value={editForm?.MaKyKeToan||''} onChange={sef('MaKyKeToan')} options={kyOptions}/>
        <div className="col-span-2">
          <Sel label="Khách Hàng" req value={editForm?.MaKH||''} onChange={sef('MaKH')}
            options={customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))}/>
        </div>
        <Sel label="Hình Thức TT" value={editForm?.HinhThucTT||''} onChange={sef('HinhThucTT')} options={['Tiền mặt','Chuyển khoản','Thẻ']}/>
        <Inp label="Số HĐ" value={editForm?.SoHD||''} onChange={sef('SoHD')}/>
        <Inp label="Ngày HĐ" type="date" value={editForm?.NgayHD||''} onChange={sef('NgayHD')}/>
        <Inp label="Người Giao Dịch" value={editForm?.NguoiGD||''} onChange={sef('NguoiGD')}/>
        <div className="col-span-3"><Inp label="Diễn Giải" value={editForm?.DienGiai||''} onChange={sef('DienGiai')}/></div>
      </div>
      <div className="flex border-b border-gray-200 mb-3 mt-1">
        <button onClick={()=>setEditDetailTab('hang')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${(editDetailTab||'hang')==='hang'?'border-green-600 text-green-700':'border-transparent text-gray-500'}`}>
          📦 Danh Sách Hàng Hóa
        </button>
        <button onClick={()=>{setEditDetailTab('gia_von');loadEditGiaVon(editForm?.MaKyKeToan)}}
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${editDetailTab==='gia_von'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`}>
          💰 Giá Vốn
        </button>
      </div>
      {(editDetailTab||'hang')==='hang'&&<DetailTbl rows={editRows} setRows={setEditRows} products={products} warehouses={warehouses} color="green" hasWarehouse={true}/>}
      {editDetailTab==='gia_von'&&<GiaVonTab
        rows={editRows}
        products={products}
        giaVonRows={editGVRows}
        loading={editGVLoading}
        onReload={()=>loadEditGiaVon(editForm?.MaKyKeToan)}
        kyLabel={kyOptions.find(k=>String(k.value)===String(editForm?.MaKyKeToan))?.label||''}
      />}
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
        <span className="text-sm font-bold text-green-800">Tổng Thanh Toán:</span>
        <span className="text-lg font-bold text-green-700 font-mono">{fmt(editRows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0))}</span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
        <Btn v="success" onClick={saveEdit} disabled={editLoading}>{editLoading?'Đang lưu...':'💾 Lưu Thay Đổi'}</Btn>
      </div>
    </Modal>}
 
    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]} active={tab}
      onChange={t=>{
        setTab(t)
        if(t==='create'){
          api('GET','/documents/phieu-xuat-kho').then(newPxk=>{
            const pl=Array.isArray(newPxk)?newPxk:[]
            setPxkList(pl)
            const newForm=makeEmptyForm(data,pl)
            setForm(newForm)
            if(newForm.MaKyKeToan) loadGiaVon(newForm.MaKyKeToan)
          })
          setRows(emptyRows())
          setFormTab('hang')
          setGiaVonRows([])
        }
      }}/>
 
    {/* DANH SÁCH */}
    {tab==='list'&&<Card>
      <CH>
        <h3 className="font-bold">🏪 Danh Sách Phiếu Bán Hàng</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={()=>exportExcel('PhieuBanHang','Phiếu Bán Hàng',
            ['Số CT','Ngày CT','Khách Hàng','Tổng Tiền','Trạng Thái'],
            data.map(r=>[r.SoCT,fmtDate(r.NgayCT),getKHLabel(r.MaKH||r.customer_id),r.TongTien||0,r.TrangThai||'DRAFT'])
          )}>⬇ Excel</Btn>
        </div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-red-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết phiếu</p>
      <Tbl data={data} loading={loading} empty="Chưa có phiếu bán hàng" cols={[
        {k:'SoCT',l:'Số CT',w:'160px',fn:(v,r)=>(
          <button onClick={()=>openDetail(r)} className="text-blue-600 hover:underline font-mono text-xs font-semibold">{v||r.so_phieu||'-'}</button>
        )},
        {k:'NgayCT',l:'Ngày CT',w:'100px',fn:(v,r)=>fmtDate(v||r.ngay_phieu)},
        {k:'MaKH',l:'Khách Hàng',fn:(v,r)=>{
          const id=v??r.customer_id??r.MaKH
          return <span className="font-medium">{getKHLabel(id)}</span>
        }},
        {k:'TongTien',l:'Tổng TT',w:'130px',r:true,fn:(v,r)=><span className="font-semibold text-green-700">{fmt(v||r.TongTien||0)}</span>},
        {k:'TrangThai',l:'TT',w:'90px',fn:(v,r)=><Badge v={v==='POSTED'?'success':'warning'}>{v||r.trang_thai||'DRAFT'}</Badge>},
      ]}/>
    </Card>}
 
    {/* TẠO MỚI */}
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">🏪 Tạo Phiếu Bán Hàng</h3></CH>
      <CB>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Inp label="Số CT" req value={form.SoCT} onChange={sf('SoCT')} hint="Tự sinh, có thể sửa"/>
          <Inp label="Số PXK" value={form.SoPXK} onChange={sf('SoPXK')} hint="Số phiếu xuất kho liên kết"/>
          <Inp label="Ngày CT" req type="date" value={form.NgayCT} onChange={sf('NgayCT')}/>
          <Sel label="Kỳ Kế Toán" req value={form.MaKyKeToan||''} onChange={sf('MaKyKeToan')} options={kyOptions}/>
          <div className="col-span-2">
            <Sel label="Khách Hàng" req value={form.MaKH} onChange={sf('MaKH')}
              options={customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))}/>
          </div>
          <Sel label="Hình Thức TT" value={form.HinhThucTT} onChange={sf('HinhThucTT')} options={['Tiền mặt','Chuyển khoản','Thẻ']}/>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Ký Hiệu Mẫu HĐ (Số Seri)</label>
            {invoiceTemplates.length>0
              ?<select value={form.SoSeri||''} onChange={onSelectTemplate}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Chọn mẫu HĐ --</option>
                  {invoiceTemplates.map(t=><option key={t.code} value={t.code}>{t.code} - {t.name} {t.ky_hieu?`(${t.ky_hieu})`:''}</option>)}
                </select>
              :<input value={form.SoSeri||''} onChange={sf('SoSeri')} placeholder="VD: 1C22TAA"
                  className="px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none"/>
            }
          </div>
          <Inp label="Ký Hiệu HĐ" value={form.KyHieuHD||''} onChange={sf('KyHieuHD')} placeholder="VD: AA/24E"/>
          <Inp label="Số HĐ" value={form.SoHD} onChange={sf('SoHD')}/>
          <Inp label="Ngày HĐ" type="date" value={form.NgayHD} onChange={sf('NgayHD')}/>
          <Inp label="Người Giao Dịch" value={form.NguoiGD} onChange={sf('NguoiGD')}/>
          <div className="col-span-2"><Inp label="Diễn Giải" value={form.DienGiai} onChange={sf('DienGiai')}/></div>
        </div>
 
        {/* Tab Hàng HH / Giá Vốn */}
        <div className="flex border-b border-gray-200 mb-3">
          <button onClick={()=>setFormTab('hang')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${formTab==='hang'?'border-green-600 text-green-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            📦 Danh Sách Hàng Hóa
          </button>
          <button onClick={()=>{setFormTab('gia_von');loadGiaVon(form.MaKyKeToan)}}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${formTab==='gia_von'?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            💰 Giá Vốn
          </button>
        </div>
 
        {formTab==='hang'&&<DetailTbl rows={rows} setRows={setRows} products={products} warehouses={warehouses} color="green" hasWarehouse={true} warehouseLabel="Kho Xuất"/>}
 
        {formTab==='gia_von'&&<GiaVonTab
          rows={rows}
          products={products}
          giaVonRows={giaVonRows}
          loading={giaVonLoading}
          onReload={()=>loadGiaVon(form.MaKyKeToan)}
          kyLabel={kyOptions.find(k=>String(k.value)===String(form.MaKyKeToan))?.label||''}
        />}
 
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
          <span className="text-sm font-semibold text-green-800">Tổng Thanh Toán:</span>
          <span className="text-xl font-bold text-green-700 font-mono">{fmt(total)}</span>
        </div>
      </CB>
      <CF>
        <Btn v="outline" onClick={()=>{setTab('list');setForm(makeEmptyForm(data));setRows(emptyRows())}}>Hủy</Btn>
        <Btn v="success" onClick={save}>💾 Lưu & Đóng</Btn>
      </CF>
    </Card>}
  </div>)
}
const DetailModal=({open,onClose,title,detail,loading,products,customers,suppliers,warehouses,onEdit,showGiaVon=false,kyOptions=[]})=>{
  // ⚠️ HOOKS PHẢI ĐẶT TRƯỚC if(!open) — React hooks rule
  const [detailTab,setDetailTab]=useState('hang')
  const [detailGVRows,setDetailGVRows]=useState([])
  const [detailGVLoading,setDetailGVLoading]=useState(false)

  useEffect(()=>{
    if(open&&detail?.items?.length&&showGiaVon){
      // Lấy gia_von đã lưu trong items (từ DB)
      setDetailGVRows(detail.items.map(i=>({
        product_id: i.product_id,
        unit_price: +(i.gia_von||0)
      })))
    }
    if(!open){
      setDetailTab('hang')
      setDetailGVRows([])
    }
  },[open, detail])

  const reloadGiaVon=async()=>{
    if(!detail?.MaKyKeToan) return
    setDetailGVLoading(true)
    const r=await api('GET',`/inventory/gia-von?period_id=${detail.MaKyKeToan}`)
    if(r&&!r.__error&&Array.isArray(r)){
      // Chỉ update nếu có ít nhất 1 SP có giá > 0
      const hasNewData=r.some(x=>+(x.unit_price||0)>0)
      if(hasNewData){
        setDetailGVRows(r)
      }
      // Nếu toàn 0 → giữ nguyên detailGVRows (giá cũ từ DB)
    }
    setDetailGVLoading(false)
  }

  if(!open) return null
  console.log('[DetailModal] showGiaVon='+showGiaVon+' items='+detail?.items?.length+' MaKyKeToan='+detail?.MaKyKeToan)

  const getProductName=(id)=>{
    if(!id) return '-'
    const p=(products||[]).find(x=>String(x.id)===String(id))
    return p?`${p.MaHH||p.code||''} - ${p.TenHH||p.name||''}`:`SP #${id}`
  }
  const getWarehouseName=(id)=>{
    if(!id) return null
    const w=warehouses.find(x=>String(x.id)===String(id))
    return w?w.MaKho||w.code:null
  }
  const getKHName=(id)=>{
    if(!id) return '-'
    const c=(customers||[]).find(x=>String(x.id)===String(id))
    return c?`${c.TenKH||c.name||''} (${c.MaKH||c.code||''})`:`KH #${id}`
  }

  const getNCCName=(id)=>{
    if(!id) return '-'
    const s=(suppliers||[]).find(x=>String(x.id)===String(id))
    return s?`${s.TenNCC||s.name||''} (${s.MaNCC||s.code||''})`:`NCC #${id}`
  }

  const items=detail?.items||[]
  const total=items.reduce((s,i)=>s+(+(i.total||0)),0)

  const soTien=detail?.TienThu||detail?.so_tien_thu||detail?.SoTien||detail?.TienChi||detail?.so_tien_chi||0
  const isThu=!!(detail?.TienThu||detail?.so_tien_thu||detail?.SoTien)

  return(
    <Modal open={open} onClose={onClose} title={title} size="lg">
      {loading||!detail
        ?<div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"/>
          <p className="text-sm text-gray-500 mt-3">Đang tải...</p>
        </div>
        :<>
          {/* Header info */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 p-4 bg-gray-50 rounded-lg text-sm">
            <div className="flex gap-2">
              <span className="text-gray-500 w-28 flex-shrink-0">Số CT:</span>
              <strong className="font-mono">{detail.SoCT||'-'}</strong>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-500 w-28 flex-shrink-0">Ngày CT:</span>
              <strong>{fmtDate(detail.NgayCT)}</strong>
            </div>
            {(detail.MaKH!==undefined||detail.KhachHang!==undefined)&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Khách Hàng:</span>
                <strong>{detail.KhachHang||getKHName(detail.MaKH)}</strong>
              </div>
            )}
            {detail.MaNCC!==undefined&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Nhà CC:</span>
                <strong>{getNCCName(detail.MaNCC)}</strong>
              </div>
            )}
            {detail.TienThu!==undefined&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Số Tiền Thu:</span>
                <strong className="text-green-700 font-mono">{fmt(detail.TienThu)}</strong>
              </div>
            )}
            {detail.khach_hang_id&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Khách Hàng:</span>
                <strong>{(customers||[]).find(x=>String(x.id)===String(detail.khach_hang_id))?.TenKH||`KH #${detail.khach_hang_id}`}</strong>
              </div>
            )}
            {detail.supplier_id&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Nhà CC:</span>
                <strong>{(suppliers||[]).find(x=>String(x.id)===String(detail.supplier_id))?.TenNCC||`NCC #${detail.supplier_id}`}</strong>
              </div>
            )}
            {detail.TienChi!==undefined&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Số Tiền Chi:</span>
                <strong className="text-red-700 font-mono">{fmt(detail.TienChi)}</strong>
              </div>
            )}
            {detail.HinhThucTT&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Hình Thức TT:</span>
                <strong>{detail.HinhThucTT}</strong>
              </div>
            )}
            {detail.LoaiGiaoDich&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Loại GD:</span>
                <strong>{detail.LoaiGiaoDich}</strong>
              </div>
            )}
            {detail.DienGiai&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Diễn Giải:</span>
                <strong>{detail.DienGiai}</strong>
              </div>
            )}
            {detail.TrangThai&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Trạng Thái:</span>
                <Badge v={detail.TrangThai==='POSTED'?'success':'warning'}>{detail.TrangThai}</Badge>
              </div>
            )}
            {detail.linkedPNK&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-28 flex-shrink-0">PNK liên kết:</span>
                <button onClick={()=>detail.onClickPNK&&detail.onClickPNK(detail.linkedPNK.id)}
                  className="text-blue-600 hover:underline font-mono text-sm font-semibold">
                  {detail.linkedPNK.so_phieu_nhap}
                </button>
              </div>
            )}
            {detail.linkedPXK&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-28 flex-shrink-0">PXK liên kết:</span>
                <button onClick={()=>detail.onClickPXK&&detail.onClickPXK(detail.linkedPXK.id)}
                  className="text-blue-600 hover:underline font-mono text-sm font-semibold">
                  {detail.linkedPXK.so_phieu_xuat}
                </button>
              </div>
            )}
          </div>

          {/* Bảng giao dịch 1 dòng cho PT/PC/TTG/CTG */}
          {items.length===0&&soTien>0&&(
            <div className="mb-3">
              <p className="text-xs font-bold text-gray-600 mb-2">💳 Chi Tiết Giao Dịch:</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600">Nội Dung / Diễn Giải</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 w-32">Loại GD</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 w-40">Tài Khoản</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-36">Số Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm">{detail.DienGiai||detail.noi_dung||'-'}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{detail.LoaiGiaoDich||detail.loai_giao_dich||'-'}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 font-medium">{detail.ten_tk||detail.HinhThucTT||'-'}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold">
                        {isThu
                          ? <span className="text-green-700">{fmt(soTien)}</span>
                          : <span className="text-red-700">{fmt(soTien)}</span>
                        }
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={3} className="px-3 py-2.5 text-right text-sm font-bold text-gray-700">Tổng:</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-base">
                        {isThu
                          ? <span className="text-green-700">{fmt(soTien)}</span>
                          : <span className="text-red-700">{fmt(soTien)}</span>
                        }
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Chi tiết hàng hóa (PNM, PBH, BL) */}
          {items.length>0&&(
            <div>
              {/* Tab selector — chỉ hiện khi showGiaVon=true */}
              {showGiaVon
                ?<div className="flex border-b border-gray-200 mb-3">
                    <button onClick={()=>setDetailTab('hang')}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${detailTab==='hang'?'border-blue-600 text-blue-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      📦 Chi Tiết Hàng Hóa
                    </button>
                    <button onClick={()=>setDetailTab('gia_von')}
                      className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${detailTab==='gia_von'?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
                      💰 Giá Vốn
                    </button>
                  </div>
                :<p className="text-xs font-bold text-gray-600 mb-2">📦 Chi Tiết Hàng Hóa:</p>
              }
              {(!showGiaVon||detailTab==='hang')&&<div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 w-10">STT</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600">Hàng Hóa</th>
                      {items.some(i=>i.warehouse_id)&&<th className="px-3 py-2 text-left text-xs font-bold text-gray-600 w-20">Kho</th>}
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-16">SL</th>
                      <th className="px-2 py-2 text-right text-xs font-bold w-28">Đơn Giá</th>
                      <th className="px-2 py-2 text-right text-xs font-bold w-24 text-orange-600">CPMH</th>
                      <th className="px-2 py-2 text-right text-xs font-bold w-28">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item,i)=>(
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 text-center text-gray-400 text-xs">{i+1}</td>
                        <td className="px-3 py-2.5 font-medium">{getProductName(item.product_id||item.MaHH)}</td>
                        {items.some(i=>i.warehouse_id)&&<td className="px-3 py-2.5 text-xs">
                          <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{getWarehouseName(item.warehouse_id)||'-'}</span>
                        </td>}
                        <td className="px-3 py-2.5 text-right font-mono">{fmtN(item.quantity||item.SoLuong||0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{fmtN(item.unit_price||item.DonGia||0)}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-orange-500">
                          {fmtN(item.chi_phi_phan_bo||0)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700">
                          {fmtN(item.total||(+(item.quantity||item.SoLuong||0))*(+(item.unit_price||item.DonGia||0)))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td colSpan={4} className="px-3 py-2.5 text-right text-sm font-bold text-gray-700">Tổng Thanh Toán:</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700">{fmt(total||detail.TongTien||0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>}

              {showGiaVon&&detailTab==='gia_von'&&<GiaVonTab
                rows={items.map(i=>({product_id:i.product_id||i.MaHH,quantity:i.quantity||i.SoLuong||0}))}
                products={products}
                giaVonRows={detailGVRows}
                loading={detailGVLoading}
                onReload={reloadGiaVon}
                kyLabel={kyOptions?.find(k=>String(k.value)===String(detail?.MaKyKeToan))?.label||`Kỳ #${detail?.MaKyKeToan||''}`}
              />}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            {onEdit&&<Btn v="warning" onClick={onEdit}>✏️ Sửa Phiếu</Btn>}
            <Btn v="outline" onClick={onClose}>Đóng</Btn>
          </div>
        </>
      }
    </Modal>
  )
}
// PHIẾU BÁN LẺ
const RetailOrder=({onOpenPxk,autoOpenBlId=null,onAutoOpenBlDone=null})=>{
  const [data,loading,load]=useList('/documents/phieu-ban-le')
  const [tab,setTab]=useState('list')
  const [products,setProducts]=useState([])
  const [warehouses,setWarehouses]=useState([])
  const {kyList,options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)
  const [pxkList,setPxkList]=useState([])
  const [editModal,setEditModal]=useState(false)
  const [editForm,setEditForm]=useState(null)
  const [editRows,setEditRows]=useState([])
  const [editLoading,setEditLoading]=useState(false)
  // Tab Giá Vốn states
  const [formTab,setFormTab]=useState('hang')
  const [giaVonRows,setGiaVonRows]=useState([])
  const [giaVonLoading,setGiaVonLoading]=useState(false)
  const [editDetailTab,setEditDetailTab]=useState('hang')      // ← THÊM
  const [editGVRows,setEditGVRows]=useState([])                // ← THÊM
  const [editGVLoading,setEditGVLoading]=useState(false)       // ← THÊM
  const sef=k=>e=>setEditForm(f=>({...f,[k]:e.target.value}))
 
  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`BL-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.SoCT||r.so_chung_tu||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }
 
  const makeNewSoPXK=(pxkL,blList=[])=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`PXK-${ym}`
    const usedNums=new Set()
    ;(pxkL||[]).forEach(x=>{const s=x.so_phieu_xuat||'';if(s.startsWith(pre)){const n=parseInt(s.split('-').pop())||0;usedNums.add(n)}})
    ;(blList||[]).forEach(x=>{const s=x.SoPXK||'';if(s.startsWith(pre)){const n=parseInt(s.split('-').pop())||0;usedNums.add(n)}})
    let num=1;while(usedNums.has(num))num++
    return `${pre}-${String(num).padStart(3,'0')}`
  }
 
  const loadGiaVon=async(kyId)=>{
    if(!kyId) return
    setGiaVonLoading(true)
    setGiaVonRows([])
    const r=await api('GET',`/inventory/gia-von?period_id=${kyId}`)
    console.log('[GiaVon BL] period_id='+kyId+' response:', JSON.stringify(r))
    if(r&&!r.__error){
      if(Array.isArray(r)) setGiaVonRows(r)
      else if(Array.isArray(r.items)) setGiaVonRows(r.items)
    }
    setGiaVonLoading(false)
  }
  const loadEditGiaVon=async(kyId)=>{
    if(!kyId) return
    setEditGVLoading(true)
    const r=await api('GET',`/inventory/gia-von?period_id=${kyId}`)
    if(r&&!r.__error&&Array.isArray(r)){
      const hasNewData=r.some(x=>+(x.unit_price||0)>0)
      if(hasNewData) setEditGVRows(r)
    }
    setEditGVLoading(false)
  }
 
  const makeEmptyForm=(list=[],pxkL=[])=>({
    SoCT:makeNewSoCT(list),NgayCT:today(),
    MaKyKeToan:kyDefault||kyList[0]?.id||null,
    KhachHang:'',DienGiai:'',SoHD:'',KyHieuHD:'',TrangThaiHDDT:'CHUA_PH',
    SoPXK:makeNewSoPXK(pxkL,list)
  })
  const emptyRows=()=>[{product_id:'',warehouse_id:'',quantity:1,unit_price:0}]
 
  const [form,setForm]=useState(()=>makeEmptyForm())
  const [rows,setRows]=useState(emptyRows())
 
  const sf=k=>e=>{
    const v=e.target.value
    setForm(f=>({...f,[k]:v}))
    if(k==='MaKyKeToan'&&formTab==='gia_von') loadGiaVon(v)
  }
 
  useEffect(()=>{
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
    api('GET','/warehouses').then(d=>setWarehouses(Array.isArray(d)?d:[]))
    api('GET','/documents/phieu-xuat-kho').then(d=>setPxkList(Array.isArray(d)?d:[]))
  },[])
 
  // Khi kyList load xong → cập nhật MaKyKeToan nếu null
  useEffect(()=>{
    if(kyList.length>0){
      setForm(f=>({...f,MaKyKeToan:f.MaKyKeToan||kyList[0].id}))
    }
  },[kyList])
  useEffect(()=>{
    if(!autoOpenBlId||loading) return
    const row=data.find(r=>String(r.id)===String(autoOpenBlId))
    if(row) openDetail(row)
    else api('GET',`/documents/phieu-ban-le/${autoOpenBlId}`).then(r=>{
      if(r&&!r.__error) openDetail({id:autoOpenBlId,...r})
    })
    if(onAutoOpenBlDone) onAutoOpenBlDone()
  },[autoOpenBlId,loading])
 
  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))
  },[data,loading])
 
  useEffect(()=>{
    if(form.MaKyKeToan&&tab==='create'&&formTab==='gia_von'){
      loadGiaVon(form.MaKyKeToan)
    }
  },[form.MaKyKeToan])
 
  // ── Xem chi tiết — RELOAD pxkList, dùng bl_id ──
  const openDetail=async(row)=>{
    setDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    const [r,newPxkData]=await Promise.all([
      api('GET',`/documents/phieu-ban-le/${row.id}`),
      api('GET','/documents/phieu-xuat-kho')
    ])
    const freshPxkList=Array.isArray(newPxkData)?newPxkData:pxkList
    setPxkList(freshPxkList)
    const pxkLinked=freshPxkList.find(p=>String(p.bl_id)===String(row.id))
      ||freshPxkList.find(p=>p.so_phieu_xuat===(r?.SoPXK||row.SoPXK))||null
    console.log('[BL openDetail] row.id='+row.id+' pxkLinked='+JSON.stringify(pxkLinked))
    setDetail(r&&!r.__error
      ?{...r,MaKyKeToan:r.MaKyKeToan||row.MaKyKeToan,
          linkedPXK:pxkLinked,
          onClickPXK:(pxkId)=>{if(onOpenPxk)onOpenPxk(pxkId)}}
      :{...row,items:[],linkedPXK:pxkLinked,
          onClickPXK:(pxkId)=>{if(onOpenPxk)onOpenPxk(pxkId)}})
    setDetailLoading(false)
  }
 
  const openEdit=async()=>{
    if(!detail) return
    setEditDetailTab('hang')                                    // ← THÊM
    setEditGVRows((detail.items||[]).map(i=>({                 // ← THÊM
      product_id:i.product_id,                                 // ← THÊM
      unit_price:+(i.gia_von||0)                               // ← THÊM
    })))
    let khoXuat=''
    const pxkData=await api('GET','/documents/phieu-xuat-kho')
    const pxkAll=Array.isArray(pxkData)?pxkData:[]
    const linkedPXK=pxkAll.find(p=>String(p.bl_id)===String(detail.id))
      ||pxkAll.find(p=>p.so_phieu_xuat===detail.SoPXK)
    if(linkedPXK){
      const pxkDetail=await api('GET',`/documents/phieu-xuat-kho/${linkedPXK.id}`)
      if(pxkDetail&&!pxkDetail.__error&&pxkDetail.items?.[0]?.warehouse_id)
        khoXuat=String(pxkDetail.items[0].warehouse_id)
    }
    setEditForm({
      SoCT:detail.SoCT,
      NgayCT:detail.NgayCT,
      MaKyKeToan:detail.MaKyKeToan||kyDefault||kyList[0]?.id,
      KhachHang:detail.KhachHang||'',
      DienGiai:detail.DienGiai||'',
      SoHD:detail.SoHD||'',
      KyHieuHD:detail.KyHieuHD||'',
      TrangThaiHDDT:detail.TrangThaiHDDT||'CHUA_PH',
      KhoXuat:khoXuat,
      SoPXK:detail.SoPXK||''
    })
    setEditRows((detail.items||[]).map(i=>({product_id:i.product_id,warehouse_id:i.warehouse_id||'',quantity:i.quantity,unit_price:i.unit_price})))
    setEditModal(true)
  }
 
  const saveEdit=async()=>{
    if(!editForm?.NgayCT){showAlert('Vui lòng chọn Ngày CT!','danger');return}
    if(!editForm?.MaKyKeToan){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
    const validEditRows=editRows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validEditRows.length){showAlert('Vui lòng thêm ít nhất 1 dòng hàng hóa!','danger');return}
    setEditLoading(true)
    const body={
      SoCT:editForm.SoCT,NgayCT:editForm.NgayCT,
      MaKyKeToan:+editForm.MaKyKeToan,
      KhachHang:editForm.KhachHang||null,
      DienGiai:editForm.DienGiai||null,
      SoHD:editForm.SoHD||null,
      SoPXK:editForm.SoPXK||null,
      DanhSachHang:validEditRows.map(r=>{
        const gv=editGVRows.find(x=>String(x.product_id)===String(r.product_id))
        return {
          MaHH:+r.product_id,
          SoLuong:+r.quantity,
          DonGia:+r.unit_price,
          MaKho:+r.warehouse_id||null,
          GiaVon:+(gv?.unit_price||gv?.don_gia_von||0)
        }
      })
    }
    const r=await api('PUT',`/documents/phieu-ban-le/${detail.id}`,body)
    if(r&&!r.__error){
      try{
        const pxkData=await api('GET','/documents/phieu-xuat-kho')
        const pxkAll=Array.isArray(pxkData)?pxkData:[]
        const linkedPXK=pxkAll.find(p=>String(p.bl_id)===String(detail.id))
          ||pxkAll.find(p=>p.so_phieu_xuat===editForm.SoPXK)
        const rowsWithKho=validEditRows.filter(row=>row.warehouse_id)

        if(linkedPXK){
          // Đã có PXK → sync
          const pxkBody={
            so_phieu_xuat:linkedPXK.so_phieu_xuat,
            ngay_phieu_xuat:editForm.NgayCT,
            loai_phieu_xuat:linkedPXK.loai_phieu_xuat||'Xuất bán',
            khach_hang_id:null,
            ten_khach_le:editForm.KhachHang||'',
            nguoi_giao_dich:editForm.KhachHang||'Khách lẻ',
            dien_giai:linkedPXK.dien_giai||`Xuất kho cho ${editForm.SoCT}`,
            ky_ke_toan_id:+editForm.MaKyKeToan,
            bl_id:detail.id,
            items:rowsWithKho.map(row=>({
              product_id:+row.product_id,
              warehouse_id:+row.warehouse_id,
              quantity:+row.quantity,
              unit_price:+row.unit_price
            }))
          }
          await api('PUT',`/documents/phieu-xuat-kho/${linkedPXK.id}`,pxkBody)
          showAlert('Cập nhật BL thành công! Đã sync PXK liên kết.')
        } else if(rowsWithKho.length>0){
          // Chưa có PXK nhưng có chọn kho → tạo mới
          const autoSoPXK=editForm.SoPXK||makeNewSoPXK(pxkAll,data)
          const pxkBody={
            so_phieu_xuat:autoSoPXK,
            ngay_phieu_xuat:editForm.NgayCT,
            loai_phieu_xuat:'Xuất bán',
            khach_hang_id:null,
            ten_khach_le:editForm.KhachHang||'Khách lẻ',
            nguoi_giao_dich:null,
            dien_giai:`Xuất kho cho ${editForm.SoCT}`,
            ky_ke_toan_id:+editForm.MaKyKeToan,
            bl_id:detail.id,
            items:rowsWithKho.map(row=>({
              product_id:+row.product_id,
              warehouse_id:+row.warehouse_id,
              quantity:+row.quantity,
              unit_price:+row.unit_price
            }))
          }
          const pxkRes=await api('POST','/documents/phieu-xuat-kho',pxkBody)
          if(pxkRes&&!pxkRes.__error)
            showAlert(`Cập nhật BL thành công! Đã tạo PXK ${autoSoPXK}.`)
          else
            showAlert(`Cập nhật BL thành công! (Tạo PXK thất bại: ${pxkRes?.message||'lỗi'})`, 'warning')
        } else {
          showAlert('Cập nhật BL thành công!')
        }
      }catch(e){
        showAlert('Cập nhật BL thành công! (Lỗi xử lý PXK)','warning')
      }
      setEditModal(false);setDetailModal(false);setDetail(null);load()
    } else showAlert('Lỗi: '+(r?.message||'Cập nhật thất bại'),'danger')
    setEditLoading(false)
  }
 
  // ── Lưu BL + tự tạo PXK ──
  const save=async()=>{
    if(!form.SoCT){showAlert('Vui lòng nhập Số CT!','danger');return}
    const validRows=rows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validRows.length){showAlert('Vui lòng thêm ít nhất 1 dòng hàng!','danger');return}
 
    const kyId=+form.MaKyKeToan||kyList[0]?.id
    if(!kyId){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
 
    const body={
      SoCT:form.SoCT,NgayCT:form.NgayCT,KhachHang:form.KhachHang,
      DienGiai:form.DienGiai,MaKyKeToan:kyId,
      SoPXK:form.SoPXK||null,
      DanhSachHang:validRows.map(r=>({MaHH:+r.product_id,SoLuong:+r.quantity,DonGia:+r.unit_price,MaKho:+r.warehouse_id||null}))
    }
    const r=await api('POST','/documents/phieu-ban-le',body)
    if(!r||r.__error){
      showAlert('Lỗi: '+(r?.message||'Tạo BL thất bại'),'danger')
      return
    }
 
    const blId=r.id
    const rowsWithKho=validRows.filter(row=>row.warehouse_id)
    let pxkMsg=''
    if(rowsWithKho.length>0&&form.SoPXK){
      try{
        const pxkBody={
          so_phieu_xuat:form.SoPXK,
          ngay_phieu_xuat:form.NgayCT,
          loai_phieu_xuat:'Xuất bán',
          khach_hang_id:null,
          ten_khach_le:form.KhachHang||'Khách lẻ',
          nguoi_giao_dich:null,
          dien_giai:`Xuất kho cho ${form.SoCT}`,
          ky_ke_toan_id:kyId,
          bl_id:blId,
          items:rowsWithKho.map(row=>({product_id:+row.product_id,warehouse_id:+row.warehouse_id,quantity:+row.quantity,unit_price:+row.unit_price}))
        }
        console.log('[BL save] Creating PXK body:', JSON.stringify(pxkBody))
        const pxkRes=await api('POST','/documents/phieu-xuat-kho',pxkBody)
        console.log('[BL save] PXK result:', JSON.stringify(pxkRes))
        if(pxkRes&&!pxkRes.__error) pxkMsg=` Đã tạo PXK ${form.SoPXK}.`
        else pxkMsg=` (Tạo PXK thất bại: ${pxkRes?.message||'lỗi'})`
      }catch(e){
        pxkMsg=' (Tạo PXK lỗi ngoại lệ)'
        console.error('[BL save] PXK exception:', e)
      }
    }
 
    showAlert(`Tạo BL ${form.SoCT} thành công!${pxkMsg}`, pxkMsg.includes('thất bại')||pxkMsg.includes('lỗi')?'warning':'success')
 
    const [newData,newPxkData]=await Promise.all([
      api('GET','/documents/phieu-ban-le'),
      api('GET','/documents/phieu-xuat-kho')
    ])
    const list=Array.isArray(newData)?newData:[]
    const newPxkList=Array.isArray(newPxkData)?newPxkData:[]
    setPxkList(newPxkList)
    setForm(makeEmptyForm(list,newPxkList))
    setRows(emptyRows())
    setFormTab('hang')
    setGiaVonRows([])
    load()
    setTab('list')
  }
 
  const total=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)
 
  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
 
    <DetailModal open={detailModal} onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`🛒 Chi Tiết Phiếu Bán Lẻ - ${detail?.SoCT||''}`}
      detail={detail} loading={detailLoading} products={products} customers={[]} suppliers={[]} warehouses={warehouses}
      onEdit={detail?openEdit:null}
      showGiaVon={true}
      kyOptions={kyOptions}/>
 
    {editModal&&editForm&&<Modal open={editModal} onClose={()=>setEditModal(false)}
      title={`✏️ Sửa Phiếu Bán Lẻ - ${editForm?.SoCT}`} size="xl">
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Inp label="Số CT" disabled value={editForm?.SoCT||''}/>
          <Inp label="Ngày CT" req type="date" value={editForm?.NgayCT||''} onChange={sef('NgayCT')}/>
          <Sel label="Kỳ Kế Toán" req value={editForm?.MaKyKeToan||''} onChange={sef('MaKyKeToan')} options={kyOptions}/>
          <div className="col-span-2">
            <Inp label="Khách Hàng" value={editForm?.KhachHang||''} onChange={sef('KhachHang')} placeholder="Tên khách (không bắt buộc)"/>
          </div>
          <Inp label="Số HĐ" value={editForm?.SoHD||''} onChange={sef('SoHD')}/>
          <Inp label="Số PXK" value={editForm?.SoPXK||''} onChange={sef('SoPXK')} hint="Từ lúc tạo BL"/>
          <div className="col-span-3"><Inp label="Diễn Giải" value={editForm?.DienGiai||''} onChange={sef('DienGiai')}/></div>
        </div>
       <div className="flex border-b border-gray-200 mb-3 mt-1">
          <button onClick={()=>setEditDetailTab('hang')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${(editDetailTab||'hang')==='hang'?'border-yellow-600 text-yellow-700':'border-transparent text-gray-500'}`}>
            📦 Danh Sách Hàng Hóa
          </button>
          <button onClick={()=>{setEditDetailTab('gia_von');loadEditGiaVon(editForm?.MaKyKeToan)}}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${editDetailTab==='gia_von'?'border-blue-600 text-blue-600':'border-transparent text-gray-500'}`}>
            💰 Giá Vốn
          </button>
        </div>
        {(editDetailTab||'hang')==='hang'&&<DetailTbl rows={editRows} setRows={setEditRows} products={products} warehouses={warehouses} color="yellow" hasWarehouse={true} warehouseLabel="Kho Xuất"/>}
        {editDetailTab==='gia_von'&&<GiaVonTab
          rows={editRows}
          products={products}
          giaVonRows={editGVRows}
          loading={editGVLoading}
          onReload={()=>loadEditGiaVon(editForm?.MaKyKeToan)}
          kyLabel={kyOptions.find(k=>String(k.value)===String(editForm?.MaKyKeToan))?.label||''}
        />}
      </div>
      <div className="flex justify-end gap-2 px-4 pb-4">
        <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
        <Btn v="success" disabled={editLoading} onClick={saveEdit}>{editLoading?'Đang lưu...':'💾 Lưu Thay Đổi'}</Btn>
      </div>
    </Modal>}
 
    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]} active={tab}
      onChange={t=>{
        setTab(t)
        if(t==='create'){
          api('GET','/documents/phieu-xuat-kho').then(newPxk=>{
            const pl=Array.isArray(newPxk)?newPxk:[]
            setPxkList(pl)
            const newForm=makeEmptyForm(data,pl)
            setForm(newForm)
            if(newForm.MaKyKeToan) loadGiaVon(newForm.MaKyKeToan)
          })
          setRows(emptyRows())
          setFormTab('hang')
          setGiaVonRows([])
        }
      }}/>
 
    {/* DANH SÁCH */}
    {tab==='list'&&<Card>
      <CH><h3 className="font-bold">🛍️ Danh Sách Phiếu Bán Lẻ</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={()=>exportExcel('PhieuBanLe','Phiếu Bán Lẻ',
            ['Số CT','Ngày CT','Khách Hàng','Tổng Tiền','Trạng Thái'],
            data.map(r=>[r.SoCT,fmtDate(r.NgayCT),r.KhachHang||'-',r.TongTien||0,r.TrangThai||'DRAFT'])
          )}>⬇ Excel</Btn>
        </div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-red-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết</p>
      <Tbl data={data} loading={loading} empty="Chưa có phiếu bán lẻ" cols={[
        {k:'SoCT',l:'Số CT',w:'150px',fn:(v,r)=>(
          <button onClick={()=>openDetail(r)} className="text-blue-600 hover:underline font-mono text-xs font-semibold">{v||'-'}</button>
        )},
        {k:'NgayCT',l:'Ngày CT',w:'100px',fn:v=>fmtDate(v)},
        {k:'KhachHang',l:'Khách Hàng',fn:v=><span className="font-medium">{v||'-'}</span>},
        {k:'TongTien',l:'Tổng TT',w:'130px',r:true,fn:v=><span className="font-semibold text-yellow-700">{fmt(v||0)}</span>},
        {k:'TrangThai',l:'TT',w:'90px',fn:v=><Badge v={v==='POSTED'?'success':'warning'}>{v||'DRAFT'}</Badge>},
      ]}/>
    </Card>}
 
    {/* TẠO MỚI */}
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">🛍️ Tạo Phiếu Bán Lẻ</h3></CH>
      <CB>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Inp label="Số CT" req value={form.SoCT} onChange={sf('SoCT')} hint="Tự sinh, có thể sửa"/>
          <Inp label="Ngày CT" req type="date" value={form.NgayCT} onChange={sf('NgayCT')}/>
          <Sel label="Kỳ Kế Toán" req value={form.MaKyKeToan||''} onChange={sf('MaKyKeToan')} options={kyOptions}/>
          <Sel label="TT HĐĐT" value={form.TrangThaiHDDT} onChange={sf('TrangThaiHDDT')}
            options={[{value:'CHUA_PH',label:'Chưa phát hành'},{value:'DA_PH',label:'Đã phát hành'}]}/>
          <Inp label="Ký Hiệu HĐ" value={form.KyHieuHD} onChange={sf('KyHieuHD')} placeholder="VD: AA/24E"/>
          <Inp label="Số HĐ" value={form.SoHD} onChange={sf('SoHD')}/>
          <div className="col-span-2">
            <Inp label="Khách Hàng" value={form.KhachHang} onChange={sf('KhachHang')} placeholder="Tên khách (không bắt buộc)"/>
          </div>
          <Inp label="Số PXK" value={form.SoPXK} onChange={sf('SoPXK')} hint="Tự sinh"/>
          <div className="col-span-2"><Inp label="Diễn Giải" value={form.DienGiai} onChange={sf('DienGiai')}/></div>
        </div>
 
        {/* Tab Hàng HH / Giá Vốn */}
        <div className="flex border-b border-gray-200 mb-3">
          <button onClick={()=>setFormTab('hang')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${formTab==='hang'?'border-yellow-600 text-yellow-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            📦 Danh Sách Hàng Hóa
          </button>
          <button onClick={()=>{setFormTab('gia_von');loadGiaVon(form.MaKyKeToan)}}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-[2px] ${formTab==='gia_von'?'border-blue-600 text-blue-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            💰 Giá Vốn
          </button>
        </div>
 
        {formTab==='hang'&&<DetailTbl rows={rows} setRows={setRows} products={products} warehouses={warehouses} color="yellow" hasWarehouse={true} warehouseLabel="Kho Xuất"/>}
 
        {formTab==='gia_von'&&<GiaVonTab
          rows={rows}
          products={products}
          giaVonRows={giaVonRows}
          loading={giaVonLoading}
          onReload={()=>loadGiaVon(form.MaKyKeToan)}
          kyLabel={kyOptions.find(k=>String(k.value)===String(form.MaKyKeToan))?.label||''}
        />}
 
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex justify-between items-center">
          <span className="text-sm font-semibold text-yellow-800">Tổng Thanh Toán:</span>
          <span className="text-xl font-bold text-yellow-700 font-mono">{fmt(total)}</span>
        </div>
      </CB>
      <CF>
        <Btn v="outline" onClick={()=>{setTab('list');setForm(makeEmptyForm(data));setRows(emptyRows())}}>Hủy</Btn>
        <Btn v="success" onClick={save}>💾 Lưu & Đóng</Btn>
      </CF>
    </Card>}
  </div>)
}

const WarehouseDocs=({type})=>{
  const isPNK=type==='nv-pnk'
  const [data,loading]=useList(isPNK?'/documents/phieu-nhap-kho':'/documents/phieu-xuat-kho')
  return(<Card><CH>
    <h3 className="font-bold">{isPNK?'📥 Phiếu Nhập Kho':'📤 Phiếu Xuất Kho'}</h3>
    <div className="ml-auto flex gap-2"><Btn size="sm">+ Tạo Mới</Btn><Btn v="pdf" size="sm">⬇ PDF</Btn></div>
  </CH>
    <Tbl data={data} loading={loading} empty={`Chưa có ${isPNK?'PNK':'PXK'}`} cols={[
      {k:isPNK?'so_phieu_nhap':'so_phieu_xuat',l:'Số Phiếu',w:'130px',fn:v=><Code v={v}/>},
      {k:isPNK?'ngay_phieu_nhap':'ngay_phieu_xuat',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
      {k:'tong_tien',l:'Tổng Tiền',r:true,fn:v=>fmt(v)},{k:'trang_thai',l:'TT',w:'90px',fn:v=><Badge v="warning">{v||'DRAFT'}</Badge>},
    ]}/>
  </Card>)
}

// TÍNH GIÁ HTK - API: period_from, period_to, valuation_method
const HTKFixed=()=>{
  const {kyList,options:kyOptions,defaultKy}=useKyKeToan()
  const [selKy,setSelKy]=useState(null)
  const [valMethod,setValMethod]=useState('AVG')
  const [result,setResult]=useState(null)
  const [loadingResult,setLoadingResult]=useState(false)
  const [loading,setLoading]=useState(false)
  const [calcedMethod,setCalcedMethod]=useState('')
  const [lastCalc,setLastCalc]=useState('')
  const [alert,showAlert,closeAlert]=useAlert()
  const [warehouses,setWarehouses]=useState([])
  const [products,setProducts]=useState([])
  const [filterKho,setFilterKho]=useState('')
  const [filterSP,setFilterSP]=useState('')
  const [filterNhom,setFilterNhom]=useState('')

  useEffect(()=>{
    api('GET','/warehouses').then(d=>setWarehouses(Array.isArray(d)?d:[]))
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
  },[])

  // Auto-set kỳ hiện tại khi kyList load xong
  useEffect(()=>{
    if(kyList.length>0&&!selKy){
      const today=new Date().toISOString().slice(0,10)
      const cur=kyList.find(k=>k.NgayBatDau<=today&&k.NgayKetThuc>=today)
      setSelKy(String(cur?.id||kyList[0].id))
    }
  },[kyList])

  // Load kết quả khi selKy thay đổi
  useEffect(()=>{
    if(selKy&&kyList.length) loadResult(selKy,valMethod)
  },[selKy,kyList])

  const calc=async()=>{
    if(!selKy){showAlert('Vui lòng chọn Kỳ Kế Toán!','danger');return}
    const ky=kyList.find(k=>String(k.id)===String(selKy))
    if(!ky){showAlert('Không tìm thấy kỳ kế toán!','danger');return}
    setLoading(true)
    const body={
      period_from: ky.NgayBatDau,
      period_to: ky.NgayKetThuc,
      valuation_method: valMethod,
      group_by: 'product'
    }
    console.log('[HTK calc] body=',JSON.stringify(body))
    const r=await api('POST','/inventory/tinh-gia-htk',body)
    if(r&&!r.__error){
      showAlert(`✅ Tính giá HTK ${valMethod} thành công! ${r.details?.length||0} dòng.`)
      setLastCalc(new Date().toLocaleString('vi-VN'))
      try{ await loadResult(selKy,valMethod) }catch(e){ console.log('loadResult error:',e) }
    }else{
      showAlert('Lỗi tính giá HTK: '+(r?.message||'Lỗi không xác định'),'danger')
    }
    setLoading(false)
  }

  const loadResult=async(kyId,method)=>{
    const ky=kyList.find(k=>String(k.id)===String(kyId))
    if(!ky) return
    setLoadingResult(true)
    console.log('[loadResult] ky=',ky.TenKy,'from=',ky.NgayBatDau,'to=',ky.NgayKetThuc)
    const r=await api('GET',
      `/inventory/bao-cao-ton-kho?period_from=${ky.NgayBatDau}&period_to=${ky.NgayKetThuc}&valuation_method=${method||valMethod}`
    )
    console.log('[loadResult] response=',JSON.stringify(r))
    if(r&&!r.__error&&r.rows?.length){
      setResult({
        details: r.rows.map(row=>({
          product_code: row.product_code,
          product_name: row.product_name,
          warehouse_name: row.warehouse_name,
          opening_qty: row.ton_dau_ky_sl,
          opening_value: row.ton_dau_ky_gia_tri,
          import_qty: row.nhap_trong_ky_sl,
          import_value: row.nhap_trong_ky_gia_tri,
          export_qty: row.xuat_trong_ky_sl,
          export_value: row.xuat_trong_ky_gia_tri,
          closing_qty: row.ton_cuoi_ky_sl,
          closing_value: row.ton_cuoi_ky_gia_tri,
          unit_price: row.don_gia,
          warehouse_id: warehouses.find(w=>w.TenKho===row.warehouse_name||w.name===row.warehouse_name)?.id,
          product_id: products.find(p=>p.MaHH===row.product_code||p.code===row.product_code)?.id
        }))
      })
      setLastCalc(r.generated_at
        ?new Date(r.generated_at).toLocaleString('vi-VN')
        :'Đã tính')
      setCalcedMethod(method||valMethod)
    }
    setLoadingResult(false)
  }

  const filteredDetails=(result?.details||[]).filter(d=>{
    if(filterKho){
      const wh=warehouses.find(w=>String(w.id)===String(filterKho))
      const whName=wh?.TenKho||wh?.name||''
      if(d.warehouse_name!==whName) return false
    }
    if(filterSP){
      const q=filterSP.toLowerCase()
      if(!(d.product_code||'').toLowerCase().includes(q)&&
         !(d.product_name||'').toLowerCase().includes(q)) return false
    }
    if(filterNhom){
      const p=products.find(x=>String(x.id)===String(d.product_id))
      const nhom=p?.DanhMuc||p?.category||''
      if(nhom!==filterNhom) return false
    }
    return true
  })

  const filteredTotal=filteredDetails.reduce((acc,d)=>({
    opening_qty: acc.opening_qty+(+d.opening_qty||0),
    opening_value: acc.opening_value+(+d.opening_value||0),
    import_qty: acc.import_qty+(+d.import_qty||0),
    import_value: acc.import_value+(+d.import_value||0),
    export_qty: acc.export_qty+(+d.export_qty||0),
    export_value: acc.export_value+(+d.export_value||0),
    closing_qty: acc.closing_qty+(+d.closing_qty||0),
    closing_value: acc.closing_value+(+d.closing_value||0),
  }),{opening_qty:0,opening_value:0,import_qty:0,import_value:0,
      export_qty:0,export_value:0,closing_qty:0,closing_value:0})

  const kySelected=kyList.find(k=>String(k.id)===String(selKy))

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}

    {/* ── PHẦN TÍNH ── */}
    <Card>
      <CH><h3 className="font-bold">⚖️ Tính Giá Hàng Tồn Kho</h3></CH>
      <CB>
        <div className="grid grid-cols-3 gap-3 items-end">
          <Sel label="Kỳ Kế Toán" req value={selKy||''} onChange={e=>setSelKy(e.target.value)}
            options={kyOptions}/>
          <Sel label="Phương Pháp" req value={valMethod} onChange={e=>setValMethod(e.target.value)}
            options={[{value:'AVG',label:'AVG — Bình quân gia quyền'},{value:'FIFO',label:'FIFO — Nhập trước xuất trước'}]}/>
          <Btn onClick={calc} disabled={loading} v="success">
            {loading?'⏳ Đang tính...':'⚡ Tính Giá HTK'}
          </Btn>
        </div>
        {kySelected&&<div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            📅 Kỳ: <strong>{kySelected.TenKy||kySelected.period_name}</strong>
            {' '}({kySelected.NgayBatDau} → {kySelected.NgayKetThuc})
          </p>
          {lastCalc
            ?<p className="text-xs text-green-600">✅ Đã tính: <strong>{calcedMethod}</strong> — <strong>{lastCalc}</strong></p>
            :<p className="text-xs text-orange-500">⚠️ Kỳ này chưa tính giá HTK</p>
          }
        </div>}
      </CB>
    </Card>

    {/* ── LOADING INDICATOR ── */}
    {loadingResult&&<div className="flex items-center justify-center py-8 gap-3 text-blue-600">
      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-sm font-medium">Đang tải kết quả HTK...</span>
    </div>}

    {/* ── PHẦN XEM KẾT QUẢ ── */}
    {result&&!loadingResult&&<Card>
      <CH>
        <h3 className="font-bold">📊 Kết Quả HTK — {calcedMethod||valMethod} — {kySelected?.TenKy||kySelected?.period_name||''}</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={()=>exportExcel(
            'HTK',`Tính Giá HTK ${valMethod}`,
            ['Mã SP','Tên SP','Kho','ĐK SL','ĐK GT','Nhập SL','Nhập GT','Xuất SL','Xuất GT','CK SL','CK GT','Đơn Giá'],
            filteredDetails.map(d=>[d.product_code,d.product_name,d.warehouse_name,
              d.opening_qty,d.opening_value,d.import_qty,d.import_value,
              d.export_qty,d.export_value,d.closing_qty,d.closing_value,d.unit_price])
          )}>⬇ Excel</Btn>
        </div>
      </CH>
      <CB>
        <div className="flex gap-3 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">🔍 Tìm Sản Phẩm</label>
            <input value={filterSP} onChange={e=>setFilterSP(e.target.value)}
              placeholder="Mã hoặc tên SP..."
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none"/>
          </div>
          <div className="w-44">
            <label className="text-xs text-gray-500 mb-1 block">🏭 Kho</label>
            <select value={filterKho} onChange={e=>setFilterKho(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none">
              <option value="">Tất cả kho</option>
              {warehouses.map(w=><option key={w.id} value={w.id}>{w.TenKho||w.name||w.MaKho||w.code}</option>)}
            </select>
          </div>
          <div className="w-44">
            <label className="text-xs text-gray-500 mb-1 block">📂 Nhóm SP</label>
            <select value={filterNhom} onChange={e=>setFilterNhom(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none">
              <option value="">Tất cả nhóm</option>
              {[...new Set(products.map(p=>p.DanhMuc||p.category||'').filter(Boolean))].map(nhom=>(
                <option key={nhom} value={nhom}>{nhom}</option>
              ))}
            </select>
          </div>
          {(filterKho||filterSP||filterNhom)&&<div className="flex items-end">
            <button onClick={()=>{setFilterKho('');setFilterSP('');setFilterNhom('')}}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 border border-gray-300 rounded">
              ✕ Xóa lọc
            </button>
          </div>}
          <div className="flex items-end">
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {filteredDetails.length}/{result.details?.length||0} dòng
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold w-24" rowSpan={2}>Mã SP</th>
                <th className="px-3 py-2 text-left text-xs font-bold" rowSpan={2}>Tên SP</th>
                <th className="px-3 py-2 text-left text-xs font-bold w-20" rowSpan={2}>Kho</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-blue-700 bg-blue-50 w-40" colSpan={2}>Đầu Kỳ</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-green-700 bg-green-50 w-40" colSpan={2}>Nhập</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-red-700 bg-red-50 w-40" colSpan={2}>Xuất</th>
                <th className="px-3 py-2 text-center text-xs font-bold text-yellow-700 bg-yellow-50 w-40" colSpan={2}>Cuối Kỳ</th>
                <th className="px-3 py-2 text-right text-xs font-bold w-28" rowSpan={2}>Đơn Giá</th>
              </tr>
              <tr>
                {[['bg-blue-50 text-blue-600','SL'],['bg-blue-50 text-blue-600','GT'],
                  ['bg-green-50 text-green-600','SL'],['bg-green-50 text-green-600','GT'],
                  ['bg-red-50 text-red-600','SL'],['bg-red-50 text-red-600','GT'],
                  ['bg-yellow-50 text-yellow-600','SL'],['bg-yellow-50 text-yellow-600','GT'],
                ].map(([cls,h],i)=>(
                  <th key={i} className={`px-3 py-1 text-xs font-semibold text-right ${cls}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDetails.length===0
                ?<tr><td colSpan={12} className="px-3 py-8 text-center text-gray-400 text-sm">
                  {result.details?.length>0?'Không có dữ liệu khớp bộ lọc':'Không có dữ liệu'}
                </td></tr>
                :filteredDetails.map((d,i)=>(
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><Code v={d.product_code}/></td>
                    <td className="px-3 py-2 font-medium text-xs">{d.product_name}</td>
                    <td className="px-3 py-2"><span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">{d.warehouse_name}</span></td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.opening_qty)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.opening_value)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-green-700">{fmtN(d.import_qty)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-green-700">{fmtN(d.import_value)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-red-600">{fmtN(d.export_qty)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-red-600">{fmtN(d.export_value)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold">{fmtN(d.closing_qty)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold text-blue-700">{fmtN(d.closing_value)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.unit_price)}</td>
                  </tr>
                ))
              }
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr>
                <td colSpan={3} className="px-3 py-2.5 font-bold text-sm text-gray-700">
                  Tổng {filterKho||filterSP||filterNhom?`(${filteredDetails.length} dòng lọc)`:`(${result.details?.length||0} dòng)`}:
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs">{fmtN(filteredTotal.opening_qty)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs">{fmtN(filteredTotal.opening_value)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs text-green-700">{fmtN(filteredTotal.import_qty)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs text-green-700">{fmtN(filteredTotal.import_value)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs text-red-600">{fmtN(filteredTotal.export_qty)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs text-red-600">{fmtN(filteredTotal.export_value)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs">{fmtN(filteredTotal.closing_qty)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-bold text-xs text-blue-700">{fmtN(filteredTotal.closing_value)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CB>
    </Card>}
  </div>)
}


const PayrollConfig=()=>{
  const [form,setForm]=useState({ty_le_bhxh:8,ty_le_bhyt:1.5,ty_le_bhtn:1,luong_co_so:2340000,giam_tru_gia_canh:11000000,giam_tru_phu_thuoc:4400000})
  const [alert,showAlert,closeAlert]=useAlert()
  useEffect(()=>{api('GET','/payroll-config').then(d=>{if(d)setForm(d)})},[])
  const save=async()=>{ const r=await api('PUT','/payroll-config',form); if(r)showAlert('Lưu cấu hình thành công!') }
  return(<div className="max-w-xl space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">⚙️ Cấu Hình Tỷ Lệ Bảo Hiểm</h3></CH>
      <CB><div className="space-y-3">
        {[['ty_le_bhxh','Tỷ Lệ BHXH (%)'],['ty_le_bhyt','Tỷ Lệ BHYT (%)'],['ty_le_bhtn','Tỷ Lệ BHTN (%)'],['luong_co_so','Lương Cơ Sở (VND)'],['giam_tru_gia_canh','Giảm Trừ Gia Cảnh (VND)'],['giam_tru_phu_thuoc','Giảm Trừ Phụ Thuộc (VND)']]
          .map(([k,l])=><Inp key={k} label={l} type="number" value={form[k]||0} onChange={e=>setForm(f=>({...f,[k]:+e.target.value}))}/>)}
      </div></CB>
      <CF><Btn onClick={save}>💾 Lưu Cấu Hình</Btn></CF>
    </Card>
  </div>)
}

// SỐ DƯ: TỒN KHO - dùng /stock-summary?period_id=1
const ObInventory=()=>{
  
  const [rows,setRows]=useState([]); const [warehouses,setWarehouses]=useState([]); const [products,setProducts]=useState([])
  const [selKho,setSelKho]=useState(''); const [loading,setLoading]=useState(true)
  const {kyList,options:kyOptions,defaultKy}=useKyKeToan()
  const [selPeriod,setSelPeriod]=useState(null)
  const [sdtkAlert,setSdtkAlert]=useState(null)
  const [editModal,setEditModal]=useState(false)
  const [editIdx,setEditIdx]=useState(null)
  const [editForm,setEditForm]=useState({})
  const sef=k=>e=>setEditForm(f=>({...f,[k]:e.target.value}))

  const mapRow=(item,w,p)=>({
    id:item.id,
    warehouse_id:item.warehouse_id||'',
    product_id:item.product_id||'',
    ma_kho:(w||[]).find(x=>x.id===item.warehouse_id)?.code||(w||[]).find(x=>x.id===item.warehouse_id)?.MaKho||'',
    ma_vt:(p||[]).find(x=>x.id===item.product_id)?.code||(p||[]).find(x=>x.id===item.product_id)?.MaHH||'',
    ten_vt:(p||[]).find(x=>x.id===item.product_id)?.name||(p||[]).find(x=>x.id===item.product_id)?.TenHH||'',
    dvt:(p||[]).find(x=>x.id===item.product_id)?.unit||(p||[]).find(x=>x.id===item.product_id)?.DVT||'',
    so_luong:item.ton_dau_ky_sl||0,
    gia_tri:item.ton_dau_ky_gia_tri||0,
  })

  useEffect(()=>{
    if(!kyList.length) return // chờ kyList load
    const pid=selPeriod||kyList[0].id
    Promise.all([
      api('GET','/warehouses'),
      api('GET','/products'),
      api('GET',`/stock-summary?period_id=${pid}`),
    ]).then(([w,p,s])=>{
      setWarehouses(Array.isArray(w)?w:[])
      setProducts(Array.isArray(p)?p:[])
      if(Array.isArray(s)&&s.length>0) setRows(s.map(item=>mapRow(item,w,p)))
      setLoading(false)
    })
  },[kyList,selPeriod])

  const addRow=()=>setRows(r=>[...r,{id:null,warehouse_id:'',product_id:'',ma_kho:'',ma_vt:'',ten_vt:'',dvt:'',so_luong:0,gia_tri:0}])

  const openEdit=(i)=>{
    setEditIdx(i)
    setEditForm({...rows[i]})
    setEditModal(true)
  }

  const saveEdit=async()=>{
    if(!editForm.warehouse_id||!editForm.product_id){
      setSdtkAlert({msg:'Vui lòng chọn đầy đủ Kho và Vật Tư!',type:'danger'}); return
    }
    const body={
      product_id:+editForm.product_id, warehouse_id:+editForm.warehouse_id, period_id:selPeriod||kyList[0]?.id||2,
      ton_dau_ky_sl:+editForm.so_luong, ton_dau_ky_gia_tri:+editForm.gia_tri,
      nhap_trong_ky_sl:0, nhap_trong_ky_gia_tri:0,
      xuat_trong_ky_sl:0, xuat_trong_ky_gia_tri:0,
      ton_cuoi_ky_sl:+editForm.so_luong, ton_cuoi_ky_gia_tri:+editForm.gia_tri
    }
    const res=await api('POST','/stock-summary',body)
    if(res&&!res.__error){
      setRows(rs=>rs.map((r,ri)=>ri===editIdx?{...editForm}:r))
      setEditModal(false)
      setSdtkAlert({msg:'✅ Đã lưu thành công!',type:'success'})
    } else {
      setSdtkAlert({msg:'Lỗi: '+(res?.message||'Không lưu được'),type:'danger'})
    }
  }

  const delRow=(i)=>{
    if(!confirm('Xóa dòng này?')) return
    setRows(rs=>rs.filter((_,ri)=>ri!==i))
  }

  const saveAll=async()=>{
    const validRows=rows.filter(r=>r.warehouse_id&&r.product_id)
    if(!validRows.length){setSdtkAlert({msg:'Vui lòng nhập ít nhất 1 dòng có đầy đủ Kho và Vật Tư!',type:'danger'});return}
    let ok=0,fail=0
    for(const r of validRows){
      const body={product_id:+r.product_id,warehouse_id:+r.warehouse_id,period_id:selPeriod||kyList[0]?.id||2,
        ton_dau_ky_sl:+r.so_luong,ton_dau_ky_gia_tri:+r.gia_tri,
        nhap_trong_ky_sl:0,nhap_trong_ky_gia_tri:0,
        xuat_trong_ky_sl:0,xuat_trong_ky_gia_tri:0,
        ton_cuoi_ky_sl:+r.so_luong,ton_cuoi_ky_gia_tri:+r.gia_tri}
      const res=await api('POST','/stock-summary',body)
      if(res&&!res.__error) ok++; else fail++
    }
    setSdtkAlert(fail===0
      ?{msg:`✅ Đã lưu ${ok} dòng!`,type:'success'}
      :{msg:`⚠️ Lưu ${ok} thành công, ${fail} thất bại`,type:'danger'})
    // Reload lại từ DB để đồng bộ (merge dòng trùng kho+SP vào dòng cũ)
    if(ok>0){
      const [w,p,s]=await Promise.all([
        api('GET','/warehouses'),
        api('GET','/products'),
        api('GET',`/stock-summary?period_id=${selPeriod||kyList[0]?.id||2}`),
      ])
      if(Array.isArray(s)) setRows(s.map(item=>({
        id:item.id,
        warehouse_id:item.warehouse_id||'',
        product_id:item.product_id||'',
        ma_kho:(w||[]).find(x=>x.id===item.warehouse_id)?.code||(w||[]).find(x=>x.id===item.warehouse_id)?.MaKho||'',
        ma_vt:(p||[]).find(x=>x.id===item.product_id)?.code||(p||[]).find(x=>x.id===item.product_id)?.MaHH||'',
        ten_vt:(p||[]).find(x=>x.id===item.product_id)?.name||(p||[]).find(x=>x.id===item.product_id)?.TenHH||'',
        dvt:(p||[]).find(x=>x.id===item.product_id)?.unit||(p||[]).find(x=>x.id===item.product_id)?.DVT||'',
        so_luong:item.ton_dau_ky_sl||0,
        gia_tri:item.ton_dau_ky_gia_tri||0,
      })))
    }
  }

  const upd=(i,k,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,[k]:v}:r))
  const displayRows=selKho?rows.filter(r=>String(r.warehouse_id)===String(selKho)):rows
  const displayIndices=selKho?rows.map((r,i)=>({r,i})).filter(({r})=>String(r.warehouse_id)===String(selKho)).map(({i})=>i):rows.map((_,i)=>i)

  if(loading) return <Card><CB><Loading/></CB></Card>
  return(<div className="space-y-4">
    {sdtkAlert&&<Alert msg={sdtkAlert.msg} type={sdtkAlert.type} onClose={()=>setSdtkAlert(null)}/>}
    <Card><CH>
      <h3 className="font-bold">📦 Số Dư Đầu Kỳ Tồn Kho</h3>
      <div className="ml-auto flex gap-2 items-center">
        <span className="text-xs text-gray-500">Kỳ KT:</span>
        <select value={selPeriod||''} onChange={e=>setSelPeriod(+e.target.value||null)}
          className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none w-44">
          {kyOptions.map(k=><option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <span className="text-xs text-gray-500">Lọc kho:</span>
        <select value={selKho} onChange={e=>setSelKho(e.target.value)} className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-40">
          <option value="">Tất cả kho</option>
          {warehouses.map(w=><option key={w.id} value={w.id}>{w.code||w.MaKho} - {w.name||w.TenKho}</option>)}
        </select>
        <Btn size="sm" onClick={addRow}>+ Thêm Dòng</Btn>
      </div>
    </CH>
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-gray-50 border-b-2 border-gray-200"><tr>
        {['Mã Kho','Mã Vật Tư','Tên Vật Tư','ĐVT','SL Đầu Kỳ','Giá Trị ĐK','Thao Tác'].map((h,i)=>
          <th key={i} className={`px-3 py-2.5 text-xs font-bold text-gray-600 uppercase ${i>=4&&i<6?'text-right':'text-left'} ${i===6?'text-center':''}`}>{h}</th>
        )}
      </tr></thead>
      <tbody className="divide-y divide-gray-100">
        {displayRows.length===0
          ?<tr><td colSpan={7}><Empty msg={selKho?"Không có tồn kho cho kho này":"Nhấn + Thêm Dòng để nhập số dư đầu kỳ"}/></td></tr>
          :displayRows.map((r,di)=>{
            const i=displayIndices[di]
            const isNew=!r.id
            return(<tr key={i} className={`hover:bg-blue-50/30 ${isNew?'bg-green-50':''}`}>
              <td className="px-2 py-1.5">
                {isNew
                  ?<select value={r.warehouse_id||''} onChange={e=>{const w=warehouses.find(x=>x.id==e.target.value);upd(i,'warehouse_id',e.target.value);upd(i,'ma_kho',w?.code||w?.MaKho||'')}} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none">
                    <option value="">--</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.code||w.MaKho}</option>)}
                  </select>
                  :<Code v={r.ma_kho||'--'}/>}
              </td>
              <td className="px-2 py-1.5">
                {isNew
                  ?<select value={r.product_id||''} onChange={e=>{const p=products.find(x=>x.id==e.target.value);upd(i,'product_id',e.target.value);upd(i,'ten_vt',p?.name||p?.TenHH||'');upd(i,'dvt',p?.unit||p?.DVT||'');upd(i,'ma_vt',p?.code||p?.MaHH||'')}} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none">
                    <option value="">--</option>{products.map(p=><option key={p.id} value={p.id}>{p.code||p.MaHH}</option>)}
                  </select>
                  :<Code v={r.ma_vt||'--'}/>}
              </td>
              <td className="px-2 py-1.5 text-xs text-gray-600">{r.ten_vt||'--'}</td>
              <td className="px-2 py-1.5 text-xs text-center">{r.dvt||'--'}</td>
              <td className="px-2 py-1.5">
                {isNew
                  ?<input type="number" min="0" value={r.so_luong} onChange={e=>upd(i,'so_luong',+e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
                  :<span className="text-xs font-medium float-right">{r.so_luong?.toLocaleString()}</span>}
              </td>
              <td className="px-2 py-1.5">
                {isNew
                  ?<input type="number" min="0" value={r.gia_tri} onChange={e=>upd(i,'gia_tri',+e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
                  :<span className="text-xs font-medium float-right">{fmtN(r.gia_tri||0)}</span>}
              </td>
              <td className="px-2 py-1.5">
                <div className="flex gap-1 justify-center">
                  {isNew
                    ?<button onClick={()=>delRow(i)} className="text-xs text-gray-400 hover:text-red-500">✕</button>
                    :<>
                      <button onClick={()=>openEdit(i)} className="text-xs text-blue-600 hover:underline font-medium">✏️ Sửa</button>
                      <button onClick={()=>delRow(i)} className="text-xs text-red-500 hover:underline font-medium">🗑 Xóa</button>
                    </>}
                </div>
              </td>
            </tr>)
          })
        }
      </tbody>
    </table></div>
    <CF>
      <span className="text-xs text-gray-500 mr-2">Tổng: {displayRows.length} dòng</span>
      <Btn onClick={saveAll}>💾 Lưu Tất Cả</Btn>
    </CF>
  </Card>

  <Modal open={editModal} onClose={()=>setEditModal(false)} title="✏️ Sửa Số Dư Tồn Kho">
    <div className="bg-gray-50 rounded-lg px-4 py-3 mb-4">
      <div className="flex gap-4 text-sm">
        <div><span className="text-xs text-gray-500">Kho:</span><span className="ml-1 font-medium">{editForm.ma_kho}</span></div>
        <div><span className="text-xs text-gray-500">Mã VT:</span><span className="ml-1 font-medium">{editForm.ma_vt}</span></div>
        <div><span className="text-xs text-gray-500">Tên:</span><span className="ml-1 font-medium">{editForm.ten_vt}</span></div>
        <div><span className="text-xs text-gray-500">ĐVT:</span><span className="ml-1 font-medium">{editForm.dvt||'--'}</span></div>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">Số Lượng Đầu Kỳ</label>
        <input type="number" min="0" value={editForm.so_luong||0}
          onChange={sef('so_luong')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 block mb-1">Giá Trị Đầu Kỳ (VND)</label>
        <input type="number" min="0" value={editForm.gia_tri||0}
          onChange={sef('gia_tri')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"/>
      </div>
    </div>
    <div className="flex justify-end gap-2 mt-4">
      <Btn v="outline" onClick={()=>setEditModal(false)}>Hủy</Btn>
      <Btn onClick={saveEdit}>💾 Lưu</Btn>
    </div>
  </Modal>
  </div>)
}

const FundPage=()=>{
  const [data,loading,load]=useList('/banking/accounts')
  const [modal,setModal]=useState(false)
  const [form,setForm]=useState({ma_tk:'',ten_tk:'',loai_tk:'TM',ngan_hang:'',so_tai_khoan:'',so_du_hien_tai:0})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const save=async()=>{
    if(!form.ma_tk||!form.ten_tk){showAlert('Vui lòng nhập Mã và Tên!','danger');return}
    const r=await api('POST','/banking/accounts',{...form,so_du_hien_tai:+form.so_du_hien_tai})
    if(r&&!r.__error){showAlert('Thêm thành công!');setModal(false);setForm({ma_tk:'',ten_tk:'',loai_tk:'TM',ngan_hang:'',so_tai_khoan:'',so_du_hien_tai:0});load()}
    else showAlert('Lỗi: '+(r?.message||'Mã đã tồn tại'),'danger')
  }
  const del=async r=>{
    if(!confirm(`Xóa quỹ "${r.ten_tk||r.ten_tk}"?`))return
    const res=await api('DELETE',`/banking/accounts/${r.id}`)
    if(res&&!res.__error){showAlert('Đã xóa!');load()}
    else showAlert('Lỗi khi xóa!','danger')
  }
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">🏦 Danh Mục Quỹ</h3>
      <div className="ml-auto"><Btn size="sm" onClick={()=>setModal(true)}>+ Thêm</Btn></div>
    </CH>
    <Tbl data={data||[]} loading={loading} empty="Chưa có quỹ" cols={[
      {k:'ma_tk',l:'Mã Quỹ',w:'100px',fn:v=><Code v={v}/>},
      {k:'ten_tk',l:'Tên Quỹ'},
      {k:'loai_tk',l:'Loại',w:'80px'},
      {k:'ngan_hang',l:'Ngân Hàng',fn:v=>v||'-'},
      {k:'so_du_hien_tai',l:'Số Dư HT',r:true,fn:v=>fmtN(v||0)},
      {k:'_act',l:'',w:'60px',fn:(v,r)=><button onClick={()=>del(r)} className="text-xs text-red-500 hover:underline">Xóa</button>},
    ]}/>
    </Card>
    <Modal open={modal} onClose={()=>setModal(false)} title="🏦 Thêm Quỹ / Tài Khoản">
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã TK" req value={form.ma_tk} onChange={sf('ma_tk')} placeholder="TM"/>
        <Inp label="Tên TK" req value={form.ten_tk} onChange={sf('ten_tk')} placeholder="Tiền mặt"/>
        <Sel label="Loại" value={form.loai_tk} onChange={sf('loai_tk')} options={[{value:'TM',label:'Tiền mặt'},{value:'NH',label:'Ngân hàng'},{value:'NT',label:'Ngoại tệ'}]}/>
        <Inp label="Số Dư Ban Đầu" type="number" value={form.so_du_hien_tai} onChange={sf('so_du_hien_tai')}/>
        <Inp label="Ngân Hàng" value={form.ngan_hang} onChange={sf('ngan_hang')} placeholder="Vietcombank"/>
        <Inp label="Số TK NH" value={form.so_tai_khoan} onChange={sf('so_tai_khoan')}/>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn>
        <Btn onClick={save}>💾 Lưu</Btn>
      </div>
    </Modal>
  </div>)
}

const ObFund=()=>{
  const [rows,setRows]=useState([]); const [loading,setLoading]=useState(true)
  const [alert,showAlert,closeAlert]=useAlert()
  useEffect(()=>{
    api('GET','/banking/accounts').then(d=>{
      setRows(Array.isArray(d)?d.map(a=>({id:a.id,ma:a.ma_tk,ten:a.ten_tk,loai:a.loai_tk,so_du:a.so_du_hien_tai||0})):[])
      setLoading(false)
    })
  },[])
  const upd=(i,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,so_du:v}:r))
  const save=async()=>{
    let ok=0,fail=0
    for(const r of rows){
      const res=await api('PUT',`/banking/accounts/${r.id}`,{so_du_hien_tai:+r.so_du})
      if(res&&!res.__error) ok++; else fail++
    }
    showAlert(fail===0?`✅ Đã lưu số dư ${ok} quỹ!`:`⚠️ Lưu ${ok} thành công, ${fail} thất bại`,fail>0?'danger':'success')
  }
  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">🏦 Số Dư Đầu Kỳ Quỹ</h3></CH>
    <Tbl data={rows} loading={loading} empty="Chưa có quỹ — vào Danh Mục → Danh Mục Quỹ để thêm" cols={[
      {k:'ma',l:'Mã Quỹ',w:'100px',fn:v=><Code v={v}/>},
      {k:'ten',l:'Tên Quỹ'},
      {k:'loai',l:'Loại',w:'70px'},
      {k:'so_du',l:'Số Dư ĐK',r:true,fn:(v,r,i)=>(
        <input type="number" defaultValue={v} onChange={e=>upd(i,+e.target.value)} className="w-40 px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
      )},
    ]}/>
    <CF><Btn onClick={save}>💾 Lưu Số Dư</Btn></CF>
  </Card></div>)
}

const ObTax=()=>{
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(true)
  const [alert,showAlert,closeAlert]=useAlert()

  useEffect(()=>{
    // Load nhom_thue để lấy danh sách sắc thuế
    // Load so_du_thue để lấy số dư đã lưu
    Promise.all([
      api('GET','/system-config/nhom_thue'),
      api('GET','/system-config/so_du_thue'),
    ]).then(([nhom,sodu])=>{
      const thuList=Array.isArray(nhom?.data)?nhom.data:[]
      const soduMap={}
      if(Array.isArray(sodu?.data)) sodu.data.forEach(x=>{soduMap[x.code]={phai_nop:x.phai_nop||0,da_nop:x.da_nop||0}})
      setRows(thuList.map(t=>({
        code: t.code,
        name: t.name,
        ty_le: t.ty_le||0,
        phai_nop: soduMap[t.code]?.phai_nop||0,
        da_nop:   soduMap[t.code]?.da_nop||0,
      })))
      setLoading(false)
    })
  },[])

  const upd=(i,k,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,[k]:v}:r))

  const save=async()=>{
    const data=rows.map(r=>({code:r.code,name:r.name,ty_le:r.ty_le,phai_nop:+r.phai_nop,da_nop:+r.da_nop}))
    const res=await api('PUT','/system-config/so_du_thue',{data})
    if(res&&!res.__error) showAlert('✅ Đã lưu số dư thuế NSNN!','success')
    else showAlert('Lỗi lưu: '+(res?.message||''),'danger')
  }

  if(loading) return <Card><CB><Loading/></CB></Card>
  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">🏛️ Số Dư Nghĩa Vụ Thuế NSNN</h3></CH>
    {rows.length===0
      ?<CB><Empty msg="Chưa có nhóm thuế — vào Danh Mục → Nhóm Ngành Thuế để thêm"/></CB>
      :<div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-gray-50 border-b-2 border-gray-200"><tr>
          <th className="px-3 py-2.5 text-left text-xs font-bold uppercase">Sắc Thuế</th>
          <th className="px-3 py-2.5 text-center text-xs font-bold uppercase">Tỷ Lệ</th>
          <th className="px-3 py-2.5 text-right text-xs font-bold uppercase">Thuế Phải Nộp</th>
          <th className="px-3 py-2.5 text-right text-xs font-bold uppercase">Thuế Đã Nộp</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r,i)=>(
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-3 py-2.5 font-medium">{r.name}</td>
              <td className="px-3 py-2.5 text-center text-xs text-gray-500">{r.ty_le}%</td>
              <td className="px-3 py-2.5 text-right"><input type="number" min="0" value={r.phai_nop} onChange={e=>upd(i,'phai_nop',+e.target.value)} className="w-40 px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/></td>
              <td className="px-3 py-2.5 text-right"><input type="number" min="0" value={r.da_nop} onChange={e=>upd(i,'da_nop',+e.target.value)} className="w-40 px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    }
    <CF><Btn onClick={save}>💾 Lưu</Btn></CF>
  </Card></div>)
}

const ObPayroll=()=>{
  const DEFAULT_ROWS=[
    {code:'luong',name:'Lương phải trả'},
    {code:'bhxh',name:'BHXH phải trả'},
    {code:'bhyt',name:'BHYT phải trả'},
    {code:'bhtn',name:'BHTN phải trả'},
  ]
  const [rows,setRows]=useState(DEFAULT_ROWS.map(r=>({...r,so_du:0})))
  const [loading,setLoading]=useState(true)
  const [alert,showAlert,closeAlert]=useAlert()

  useEffect(()=>{
    api('GET','/system-config/so_du_luong').then(d=>{
      const saved=Array.isArray(d?.data)?d.data:[]
      const map={}
      saved.forEach(x=>{map[x.code]=x.so_du||0})
      setRows(DEFAULT_ROWS.map(r=>({...r,so_du:map[r.code]||0})))
      setLoading(false)
    })
  },[])

  const upd=(i,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,so_du:v}:r))

  const save=async()=>{
    const data=rows.map(r=>({code:r.code,name:r.name,so_du:+r.so_du}))
    const res=await api('PUT','/system-config/so_du_luong',{data})
    if(res&&!res.__error) showAlert('✅ Đã lưu số dư lương - bảo hiểm!','success')
    else showAlert('Lỗi lưu: '+(res?.message||''),'danger')
  }

  if(loading) return <Card><CB><Loading/></CB></Card>
  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">💼 Số Dư Lương - Bảo Hiểm</h3></CH>
    <div className="overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-gray-50 border-b-2 border-gray-200"><tr>
        <th className="px-3 py-2.5 text-left text-xs font-bold uppercase">Khoản Mục</th>
        <th className="px-3 py-2.5 text-right text-xs font-bold uppercase">Số Dư Còn Phải Trả</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((r,i)=>(
          <tr key={i} className="hover:bg-gray-50">
            <td className="px-3 py-2.5 font-medium">{r.name}</td>
            <td className="px-3 py-2.5 text-right">
              <input type="number" min="0" value={r.so_du}
                onChange={e=>upd(i,+e.target.value)}
                className="w-40 px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
            </td>
          </tr>
        ))}
      </tbody>
    </table></div>
    <CF><Btn onClick={save}>💾 Lưu</Btn></CF>
  </Card></div>)
}

const ObDebt=()=>{
  const [type,setType]=useState('phải_thu')
  const [rows,setRows]=useState([])
  const [loading,setLoading]=useState(false)
  const [alert,showAlert,closeAlert]=useAlert()

  const configKey=type==='phải_thu'?'so_du_phai_thu':'so_du_phai_tra'
  const entityApi=type==='phải_thu'?'/customers':'/suppliers'

  const load=async(t)=>{
    setLoading(true)
    const key=t==='phải_thu'?'so_du_phai_thu':'so_du_phai_tra'
    const eApi=t==='phải_thu'?'/customers':'/suppliers'
    const [entities,saved]=await Promise.all([
      api('GET',eApi),
      api('GET',`/system-config/${key}`),
    ])
    const list=Array.isArray(entities)?entities:[]
    const savedMap={}
    if(Array.isArray(saved?.data)) saved.data.forEach(x=>{savedMap[x.id]={du_no:x.du_no||0,du_co:x.du_co||0}})
    setRows(list.map(e=>({
      id: e.id,
      ma: e.code||e.MaKH||e.MaNCC||'',
      ten: e.name||e.TenKH||e.TenNCC||'',
      du_no: savedMap[e.id]?.du_no||0,
      du_co: savedMap[e.id]?.du_co||0,
    })))
    setLoading(false)
  }

  useEffect(()=>{load(type)},[])

  const upd=(i,k,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,[k]:v}:r))

  const save=async()=>{
    const data=rows.map(r=>({id:r.id,ma:r.ma,ten:r.ten,du_no:+r.du_no,du_co:+r.du_co}))
    const res=await api('PUT',`/system-config/${configKey}`,{data})
    if(res&&!res.__error) showAlert(`✅ Đã lưu số dư công nợ ${type==='phải_thu'?'phải thu':'phải trả'}!`,'success')
    else showAlert('Lỗi lưu: '+(res?.message||''),'danger')
  }

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH>
      <h3 className="font-bold">💼 Số Dư Đầu Kỳ Công Nợ</h3>
      <div className="ml-auto">
        <Sel value={type} onChange={e=>{setType(e.target.value);load(e.target.value)}}
          options={[{value:'phải_thu',label:'Công nợ phải thu (KH)'},{value:'phải_trả',label:'Công nợ phải trả (NCC)'}]}/>
      </div>
    </CH>
    <Tbl data={rows} loading={loading} empty="Không có dữ liệu" cols={[
      {k:'ma',l:'Mã',w:'100px',fn:v=><Code v={v}/>},
      {k:'ten',l:'Tên KH / NCC'},
      {k:'du_no',l:'Dư Nợ ĐK',r:true,fn:(v,r,i)=>(
        <input type="number" min="0" value={r.du_no}
          onChange={e=>upd(i,'du_no',+e.target.value)}
          className="w-36 px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
      )},
      {k:'du_co',l:'Dư Có ĐK',r:true,fn:(v,r,i)=>(
        <input type="number" min="0" value={r.du_co}
          onChange={e=>upd(i,'du_co',+e.target.value)}
          className="w-36 px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/>
      )},
    ]}/>
    <CF>
      <span className="text-xs text-gray-500 mr-2">{rows.length} đối tượng</span>
      <Btn onClick={save}>💾 Lưu Số Dư</Btn>
    </CF>
  </Card></div>)
}

// CHUYỂN TỒN KHO / SỐ DƯ - load warehouses từ API
const TransferBalance=({type})=>{
  const isStock=type==='stock'
  const [warehouses,setWarehouses]=useState([]); const [loading,setLoading]=useState(true)
  const [alert,showAlert,closeAlert]=useAlert()
  const [form,setForm]=useState({ngay:'2026-12-31',kho:''})
  useEffect(()=>{
    if(isStock){
      api('GET','/warehouses').then(d=>{ setWarehouses(Array.isArray(d)?d:[]); setLoading(false) })
    } else setLoading(false)
  },[])
  if(loading) return <Card><CB><Loading/></CB></Card>
  return(<div className="max-w-lg space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">{isStock?'🔄 Chuyển Tồn Kho Sang Năm':'🔄 Chuyển Số Dư Sang Năm'}</h3></CH>
      <CB><div className="space-y-3">
        <Inp label="Ngày Cuối Năm Thực Hiện" req type="date" value={form.ngay} onChange={e=>setForm(f=>({...f,ngay:e.target.value}))}/>
        {isStock&&<Sel label="Mã Kho (để trống = tất cả)" value={form.kho} onChange={e=>setForm(f=>({...f,kho:e.target.value}))}
          options={warehouses.map(w=>({value:w.id,label:`${w.MaKho||w.code} - ${w.TenKho||w.name}`}))}/>}
        <Alert msg={`ℹ️ Thao tác sẽ chuyển toàn bộ ${isStock?'tồn kho':'số dư'} cuối năm 2026 sang đầu năm 2027. Không thể hoàn tác!`} type="warning"/>
      </div></CB>
      <CF><Btn v="danger" onClick={()=>showAlert('Chuyển dữ liệu thành công!','success')}>🔄 Thực Hiện</Btn></CF>
    </Card>
  </div>)
}

// BÁO CÁO
const RptTonKho=()=>{
  const [form,setForm]=useState({period_from:'2026-04-01',period_to:'2026-04-30',valuation_method:'AVG'})
  const [data,setData]=useState(null); const [loading,setLoading]=useState(false)
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const load=async()=>{ setLoading(true); const r=await api('POST','/inventory/tinh-gia-htk',{...form,group_by:'product'}); setData(r); setLoading(false) }
  return(<div className="space-y-4">
    <Card><CH><h3 className="font-bold">📊 Báo Cáo Tồn Kho HTK</h3></CH>
      <CB><div className="grid grid-cols-4 gap-3">
        <Inp label="Từ Ngày" type="date" value={form.period_from} onChange={sf('period_from')}/>
        <Inp label="Đến Ngày" type="date" value={form.period_to} onChange={sf('period_to')}/>
        <Sel label="Phương Pháp" value={form.valuation_method} onChange={sf('valuation_method')} options={[{value:'AVG',label:'AVG'},{value:'FIFO',label:'FIFO'}]}/>
        <div className="flex items-end gap-2"><Btn onClick={load} disabled={loading} className="flex-1 justify-center">{loading?'Đang tải...':'🔍 Xem'}</Btn><Btn v="pdf" size="sm">PDF</Btn><Btn v="excel" size="sm">XLS</Btn></div>
      </div></CB>
    </Card>
    {data&&<Card><CH><h3 className="font-bold">Kết Quả - {form.valuation_method}</h3></CH>
      <Tbl data={data.details||[]} loading={false} empty="Không có dữ liệu" cols={[
        {k:'product_code',l:'Mã SP',w:'100px',fn:v=><Code v={v}/>},{k:'product_name',l:'Tên SP'},
        {k:'opening_qty',l:'ĐK-SL',r:true},{k:'opening_value',l:'ĐK-GT',r:true,fn:v=>fmtN(v)},
        {k:'import_qty',l:'N-SL',r:true},{k:'import_value',l:'N-GT',r:true,fn:v=>fmtN(v)},
        {k:'export_qty',l:'X-SL',r:true},{k:'export_value',l:'X-GT',r:true,fn:v=>fmtN(v)},
        {k:'closing_qty',l:'CK-SL',r:true,fn:v=><strong>{v}</strong>},{k:'closing_value',l:'CK-GT',r:true,fn:v=><strong className="text-blue-700">{fmtN(v)}</strong>},
      ]}/>
    </Card>}
  </div>)
}

const RptNhapXuat=()=>{
  const [wh,setWh]=useState([]); const [prods,setProds]=useState([])
  const [form,setForm]=useState({period_from:'2026-04-01',period_to:'2026-04-30',warehouse_id:'',product_id:''})
  useEffect(()=>{ api('GET','/warehouses').then(d=>setWh(Array.isArray(d)?d:[])); api('GET','/products').then(d=>setProds(Array.isArray(d)?d:[])) },[])
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  return(<div className="space-y-4">
    <Card><CH><h3 className="font-bold">📋 Báo Cáo Nhập Xuất Tồn</h3></CH>
      <CB><div className="grid grid-cols-4 gap-3">
        <Inp label="Từ Ngày" type="date" value={form.period_from} onChange={sf('period_from')}/>
        <Inp label="Đến Ngày" type="date" value={form.period_to} onChange={sf('period_to')}/>
        <Sel label="Kho" value={form.warehouse_id} onChange={sf('warehouse_id')} options={wh.map(w=>({value:w.id,label:w.TenKho||w.name}))}/>
        <Sel label="Vật Tư" value={form.product_id} onChange={sf('product_id')} options={prods.map(p=>({value:p.id,label:`${p.MaHH||p.code} - ${p.TenHH||p.name}`}))}/>
      </div></CB>
      <CF><Btn>🔍 Xem</Btn><Btn v="pdf">⬇ PDF</Btn><Btn v="excel">⬇ Excel</Btn></CF>
    </Card>
    <Card><Empty msg="Chọn điều kiện và nhấn Xem để tải báo cáo"/></Card>
  </div>)
}

const RptBank=()=>{
  const [data,setData]=useState(null); const [loading,setLoading]=useState(false)
  const {options:kyOptions,defaultKy}=useKyKeToan()
  const [pid,setPid]=useState(defaultKy||1)
  const load=async()=>{ setLoading(true); const r=await api('GET',`/banking/bao-cao-so-du?period_id=${pid}`); setData(r); setLoading(false) }
  return(<div className="space-y-4">
    <Card><CH><h3 className="font-bold">💳 Báo Cáo Số Dư TK NH</h3>
      <div className="ml-auto flex gap-2">
        <Sel value={pid} onChange={e=>setPid(+e.target.value)} options={kyOptions} className="w-44"/>
        <Btn v="outline" size="sm" onClick={load}>{loading?'Đang tải...':'🔍 Xem'}</Btn>
        <Btn v="pdf" size="sm">⬇ PDF</Btn><Btn v="excel" size="sm">⬇ Excel</Btn>
      </div>
    </CH>
      {loading?<CB><Loading/></CB>:!data?<CB><Empty msg="Chọn kỳ và nhấn Xem"/></CB>
      :<div>
        <Tbl data={data.rows||[]} loading={false} empty="Không có dữ liệu" cols={[
          {k:'ma_tk',l:'Mã TK',w:'100px',fn:v=><Code v={v}/>},{k:'ten_tk',l:'Tên TK'},
          {k:'so_du_dau_ky',l:'Đầu Kỳ',r:true,fn:v=>fmtN(v)},{k:'tong_thu',l:'Tổng Thu',r:true,fn:v=><span className="text-green-700">{fmtN(v)}</span>},
          {k:'tong_chi',l:'Tổng Chi',r:true,fn:v=><span className="text-red-700">{fmtN(v)}</span>},{k:'so_du_cuoi_ky',l:'Cuối Kỳ',r:true,fn:v=><span className="text-blue-700 font-bold">{fmtN(v)}</span>},
        ]}/>
        <div className="px-4 py-2.5 bg-gray-100 border-t-2 border-gray-300 flex justify-between text-sm font-bold">
          <span>TỔNG CỘNG</span>
          <div className="flex gap-8 font-mono"><span>{fmtN(data.tong_du_dau_ky)}</span><span className="text-green-700">{fmtN(data.tong_thu_all)}</span><span className="text-red-700">{fmtN(data.tong_chi_all)}</span><span className="text-blue-700">{fmtN(data.tong_du_cuoi_ky)}</span></div>
        </div>
      </div>}
    </Card>
  </div>)
}

const RptBankTxn=()=>{
  const [tab,setTab]=useState('ttg')
  const [dTTG,lTTG]=useList('/banking/ttg'); const [dCTG,lCTG]=useList('/banking/ctg')
  return(<div className="space-y-4">
    <Tabs tabs={[{id:'ttg',label:'🏦 Sổ TTG'},{id:'ctg',label:'🏦 Sổ CTG'}]} active={tab} onChange={setTab}/>
    <Card><CH><h3 className="font-bold">{tab==='ttg'?'Sổ Thu Tiền Gửi':'Sổ Chi Tiền Gửi'}</h3>
      <div className="ml-auto flex gap-2"><Btn v="pdf" size="sm">⬇ PDF</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div>
    </CH>
      <Tbl data={tab==='ttg'?dTTG:dCTG} loading={tab==='ttg'?lTTG:lCTG} empty={`Chưa có ${tab.toUpperCase()}`} cols={[
        {k:'so_chung_tu',l:'Số CT',w:'130px',fn:v=><Code v={v}/>},{k:'ngay_chung_tu',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
        {k:'loai_giao_dich',l:'Loại GD'},
        {k:tab==='ttg'?'so_tien_thu':'so_tien_chi',l:'Số Tiền',r:true,fn:v=><span className={`font-semibold ${tab==='ttg'?'text-green-700':'text-red-700'}`}>{fmt(v)}</span>},
        {k:'noi_dung',l:'Nội Dung'},{k:'da_doi_chieu',l:'ĐC',w:'70px',fn:v=><Badge v={v?'success':'gray'}>{v?'ĐC':'Chưa'}</Badge>},
      ]}/>
    </Card>
  </div>)
}

const RptPayroll=()=>{
  const [data,loading]=useList('/employees'); const [cfg,setCfg]=useState(null)
  useEffect(()=>{api('GET','/payroll-config').then(d=>setCfg(d))},[])
  const rows=data.map(e=>({
    ma:e.ma_nv,ten:e.ten_nv,luong:e.luong_co_ban||0,
    bhxh:Math.round((e.luong_co_ban||0)*(cfg?.ty_le_bhxh||8)/100),
    bhyt:Math.round((e.luong_co_ban||0)*(cfg?.ty_le_bhyt||1.5)/100),
    bhtn:Math.round((e.luong_co_ban||0)*(cfg?.ty_le_bhtn||1)/100),
    thuc:Math.round((e.luong_co_ban||0)*(1-((cfg?.ty_le_bhxh||8)+(cfg?.ty_le_bhyt||1.5)+(cfg?.ty_le_bhtn||1))/100)),
  }))
  return(<Card><CH><h3 className="font-bold">💼 Bảng Lương</h3>
    <div className="ml-auto flex gap-2"><Btn v="pdf" size="sm">⬇ PDF</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div>
  </CH>
    <Tbl data={rows} loading={loading} empty="Chưa có NV" cols={[
      {k:'ma',l:'Mã NV',w:'100px',fn:v=><Code v={v}/>},{k:'ten',l:'Tên NV',fn:v=><span className="font-medium">{v}</span>},
      {k:'luong',l:'Lương CB',r:true,fn:v=>fmtN(v)},{k:'bhxh',l:'BHXH',r:true,fn:v=><span className="text-orange-600">{fmtN(v)}</span>},
      {k:'bhyt',l:'BHYT',r:true,fn:v=><span className="text-orange-600">{fmtN(v)}</span>},{k:'bhtn',l:'BHTN',r:true,fn:v=><span className="text-orange-600">{fmtN(v)}</span>},
      {k:'thuc',l:'Thực Lãnh',r:true,fn:v=><span className="text-green-700 font-bold">{fmt(v)}</span>},
    ]}/>
    {rows.length>0&&(<div className="px-4 py-2.5 bg-gray-100 border-t-2 border-gray-300 grid grid-cols-7 gap-4 text-sm font-bold">
      <span className="col-span-2">TỔNG CỘNG</span>
      <span className="text-right font-mono">{fmtN(rows.reduce((s,r)=>s+r.luong,0))}</span>
      <span className="text-right font-mono text-orange-600">{fmtN(rows.reduce((s,r)=>s+r.bhxh,0))}</span>
      <span className="text-right font-mono text-orange-600">{fmtN(rows.reduce((s,r)=>s+r.bhyt,0))}</span>
      <span className="text-right font-mono text-orange-600">{fmtN(rows.reduce((s,r)=>s+r.bhtn,0))}</span>
      <span className="text-right font-mono text-green-700">{fmt(rows.reduce((s,r)=>s+r.thuc,0))}</span>
    </div>)}
  </Card>)
}

const RptDebt=()=>{
  const [tab,setTab]=useState('phải_thu')
  const [cust,lC]=useList('/customers'); const [supp,lS]=useList('/suppliers')
  return(<div className="space-y-4">
    <Tabs tabs={[{id:'phải_thu',label:'📊 Phải Thu'},{id:'phải_trả',label:'📊 Phải Trả'}]} active={tab} onChange={setTab}/>
    <Card><CH><h3 className="font-bold">{tab==='phải_thu'?'Công Nợ Phải Thu':'Công Nợ Phải Trả'}</h3>
      <div className="ml-auto flex gap-2"><Btn v="pdf" size="sm">⬇ PDF</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div>
    </CH>
      <Tbl data={(tab==='phải_thu'?cust:supp).map(x=>({...x,du_no:0,du_co:0}))} loading={tab==='phải_thu'?lC:lS} empty="Không có dữ liệu" cols={[
        {k:'MaKH',l:'Mã',w:'100px',fn:(v,r)=><Code v={v||r.MaNCC||r.code}/>},
        {k:'TenKH',l:tab==='phải_thu'?'Tên Khách Hàng':'Tên Nhà Cung Cấp',fn:(v,r)=><span className="font-medium">{v||r.TenNCC||r.name}</span>},
        {k:'SDT',l:'Điện Thoại',w:'120px',fn:(v,r)=>v||r.phone||'-'},
        {k:'du_no',l:'Dư Nợ',r:true,fn:()=>'0'},{k:'du_co',l:'Dư Có',r:true,fn:()=>'0'},
        {k:'_',l:'Còn Lại',r:true,fn:()=><span className="font-bold text-blue-700">0</span>},
      ]}/>
    </Card>
  </div>)
}



// ══ LOẠI GIAO DỊCH - bảng transaction_types trong DB
const TransactionTypes=()=>{
  const [data,loading,load]=useList('/transaction-types')
  const [modal,setModal]=useState(false)
  const [editItem,setEditItem]=useState(null)
  const [form,setForm]=useState({code:'',name:'',nhom:'THU',ap_dung_cho:'ALL',mo_ta:'',thu_tu:0,is_active:true})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const openAdd=()=>{setEditItem(null);setForm({code:'',name:'',nhom:'THU',ap_dung_cho:'ALL',mo_ta:'',thu_tu:0,is_active:true});setModal(true)}
  const openEdit=r=>{setEditItem(r);setForm({code:r.code,name:r.name,nhom:r.nhom,ap_dung_cho:r.ap_dung_cho||'ALL',mo_ta:r.mo_ta||'',thu_tu:r.thu_tu||0,is_active:r.is_active});setModal(true)}
  const save=async()=>{
    if(!form.code||!form.name){showAlert('Vui lòng nhập Mã và Tên!','danger');return}
    const r=editItem
      ?await api('PUT',`/transaction-types/${editItem.id}`,form)
      :await api('POST','/transaction-types',{...form,thu_tu:+form.thu_tu})
    if(r){showAlert(editItem?'Cập nhật thành công!':'Thêm thành công!');setModal(false);load()}
    else showAlert('Lỗi! Kiểm tra mã đã tồn tại chưa.','danger')
  }
  const del=async r=>{
    if(!confirm('Xóa loại GD "'+r.name+'"?'))return
    const res=await api('DELETE',`/transaction-types/${r.id}`)
    if(res){showAlert('Đã xóa!');load()}else showAlert('Lỗi khi xóa!','danger')
  }
  const initDefault=async()=>{
    if(!confirm('Tạo các loại giao dịch mặc định?'))return
    const r=await api('POST','/transaction-types/init-default')
    if(r){showAlert(r.message||'Đã tạo!');load()}
  }
  const cols=[
    {k:'code',l:'Mã',w:'90px',fn:v=><Code v={v}/>},
    {k:'name',l:'Tên Loại Giao Dịch',fn:(v,r)=><span className="font-medium">{v}</span>},
    {k:'ap_dung_cho',l:'Áp Dụng',w:'100px',fn:v=><span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{v||'ALL'}</span>},
    {k:'thu_tu',l:'TT',w:'45px',r:true},
    {k:'is_active',l:'TT',w:'55px',fn:v=><StatusBadge v={v}/>},
    {k:'_act',l:'',w:'80px',fn:(v,r)=><div className="flex gap-1">
      <button onClick={()=>openEdit(r)} className="text-xs text-blue-600 hover:underline">Sửa</button>
      <button onClick={()=>del(r)} className="text-xs text-red-500 hover:underline">Xóa</button>
    </div>},
  ]
  const thuData=(data||[]).filter(r=>r.nhom==='THU'||r.nhom==='CA_HAI')
  const chiData=(data||[]).filter(r=>r.nhom==='CHI'||r.nhom==='CA_HAI')
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <div className="flex gap-3 items-start">
      <div className="flex-1"><Card>
        <CH><h3 className="font-bold text-green-700">⬆️ Loại Thu ({thuData.length})</h3>
          <div className="ml-auto flex gap-2">
            <Btn size="sm" onClick={openAdd}>+ Thêm</Btn>
            {!(data||[]).length&&<Btn v="outline" size="sm" onClick={initDefault}>⚡ Tạo Mặc Định</Btn>}
          </div>
        </CH>
        <Tbl data={thuData} loading={loading} empty="Chưa có — nhấn Tạo Mặc Định" cols={cols}/>
      </Card></div>
      <div className="flex-1"><Card>
        <CH><h3 className="font-bold text-red-700">⬇️ Loại Chi ({chiData.length})</h3></CH>
        <Tbl data={chiData} loading={loading} empty="Chưa có — nhấn Tạo Mặc Định" cols={cols}/>
      </Card></div>
    </div>
    <Modal open={modal} onClose={()=>setModal(false)} title={editItem?"✏️ Sửa Loại Giao Dịch":"➕ Thêm Loại Giao Dịch"}>
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Mã (code)" req value={form.code} onChange={sf('code')} placeholder="THU001" disabled={!!editItem}/>
        <Inp label="Tên Loại Giao Dịch" req value={form.name} onChange={sf('name')}/>
        <Sel label="Nhóm" req value={form.nhom} onChange={sf('nhom')} options={[
          {value:'THU',label:'⬆️ Thu'},{value:'CHI',label:'⬇️ Chi'},{value:'CA_HAI',label:'↕️ Cả hai'},
        ]}/>
        <Sel label="Áp Dụng Cho" value={form.ap_dung_cho} onChange={sf('ap_dung_cho')} options={[
          {value:'ALL',label:'Tất cả (PT/PC/TTG/CTG)'},
          {value:'PT',label:'Chỉ Phiếu Thu (PT)'},
          {value:'PC',label:'Chỉ Phiếu Chi (PC)'},
          {value:'TTG',label:'Chỉ Thu Tiền Gửi (TTG)'},
          {value:'CTG',label:'Chỉ Chi Tiền Gửi (CTG)'},
        ]}/>
        <Inp label="Thứ Tự Hiển Thị" type="number" value={form.thu_tu} onChange={sf('thu_tu')}/>
        <Inp label="Mô Tả" value={form.mo_ta} onChange={sf('mo_ta')}/>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn>
        <Btn onClick={save}>💾 Lưu</Btn>
      </div>
    </Modal>
  </div>)
}

// ══ ĐƠN VỊ TÍNH - dùng bảng units riêng trong DB (sau khi chạy SQL migration)
const UnitPage = () => {
  const [data, loading, load] = useList('/units')
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ code: '', name: '', description: '', is_active: true })
  const [alert, showAlert, closeAlert] = useAlert()
  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const openAdd = () => { setEditItem(null); setForm({ code: '', name: '', description: '', is_active: true }); setModal(true) }
  const openEdit = (item) => { setEditItem(item); setForm({ code: item.code, name: item.name, description: item.description || '', is_active: item.is_active }); setModal(true) }

  const save = async () => {
    if (!form.code || !form.name) { showAlert('Vui lòng nhập Mã ĐVT và Tên!', 'danger'); return }
    let r
    if (editItem) {
      r = await api('PUT', `/units/${editItem.id}`, { name: form.name, description: form.description, is_active: form.is_active })
      if (r) { showAlert(`Cập nhật ĐVT "${form.code}" thành công!`); setModal(false); load() }
      else showAlert('Lỗi cập nhật!', 'danger')
    } else {
      r = await api('POST', '/units', form)
      if (r) { showAlert(`Thêm ĐVT "${form.code}" thành công!`); setModal(false); load() }
      else showAlert('Lỗi! Mã ĐVT đã tồn tại hoặc lỗi server.', 'danger')
    }
  }

  const toggleActive = async (item) => {
    const r = await api('PUT', `/units/${item.id}`, { is_active: !item.is_active })
    if (r) { showAlert(r.is_active ? `Đã kích hoạt "${item.code}"` : `Đã ngừng "${item.code}"`); load() }
  }

  const doExcel = () => exportExcel('DanhMucDVT', 'Đơn Vị Tính',
    ['Mã ĐVT', 'Tên ĐVT', 'Mô Tả', 'Trạng Thái'],
    data.map(u => [u.code, u.name, u.description || '', u.is_active ? 'Dùng' : 'Ngừng'])
  )

  // Kiểm tra API có hoạt động không (nếu chưa chạy SQL migration)
  const apiOK = !loading && (data.length > 0 || true)

  return (
    <div className="space-y-4">
      {alert && <Alert msg={alert.msg} type={alert.type} onClose={closeAlert} />}
      {!loading && data.length === 0 && (
        <Alert type="warning" msg="⚠️ Chưa có dữ liệu ĐVT. Vui lòng chạy file SQL 'them_bang_DVT.sql' vào Supabase trước, sau đó restart backend." />
      )}
      <Card>
        <CH>
          <h3 className="font-bold">📏 Danh Mục Đơn Vị Tính</h3>
          <div className="ml-2 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            ✅ Lưu vào bảng <code>units</code> trong DB
          </div>
          <div className="ml-auto flex gap-2">
            <Btn v="outline" size="sm" onClick={load}>🔄 Tải Lại</Btn>
            <Btn size="sm" onClick={openAdd}>+ Thêm Mới</Btn>
            <Btn v="excel" size="sm" onClick={doExcel}>⬇ Excel</Btn>
          </div>
        </CH>
        <Tbl data={data} loading={loading} empty="Chưa có ĐVT. Chạy SQL migration và restart backend." cols={[
          { k: 'code', l: 'Mã ĐVT', w: '120px', fn: v => <Code v={v} /> },
          { k: 'name', l: 'Tên Đơn Vị Tính', fn: v => <span className="font-medium">{v}</span> },
          { k: 'description', l: 'Mô Tả' },
          { k: 'is_active', l: 'Trạng Thái', w: '100px', fn: v => <StatusBadge v={v} /> },
          { k: '_', l: 'Thao Tác', w: '130px', fn: (v, row) => (
            <div className="flex gap-1">
              <button onClick={() => openEdit(row)} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 font-semibold">✏️ Sửa</button>
              <button onClick={() => toggleActive(row)} className={`px-2 py-1 text-xs rounded font-semibold ${row.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                {row.is_active ? '⏸ Ngừng' : '▶ Dùng'}
              </button>
            </div>
          )},
        ]} />
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex gap-4">
          <span>✅ <strong>{data.filter(u => u.is_active).length}</strong> ĐVT đang dùng</span>
          <span>⏸ <strong>{data.filter(u => !u.is_active).length}</strong> ĐVT ngừng dùng</span>
          <span className="ml-auto text-blue-600">API: GET/POST/PUT /units</span>
        </div>
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? `✏️ Sửa ĐVT: ${editItem.code}` : '📏 Thêm Đơn Vị Tính Mới'}>
        <div className="space-y-3">
          <Inp label="Mã ĐVT (code)" req value={form.code} onChange={sf('code')} placeholder="Cái, Kg, Hộp, m2..." disabled={!!editItem} />
          <Inp label="Tên Đơn Vị Tính (name)" req value={form.name} onChange={sf('name')} placeholder="Kilogram, Thùng 24 chai..." />
          <Inp label="Mô Tả (description)" value={form.description} onChange={sf('description')} placeholder="Ghi chú thêm..." />
          {editItem && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-600">Trạng Thái:</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4" />
                <span className="text-sm">{form.is_active ? 'Đang Dùng' : 'Ngừng Dùng'}</span>
              </label>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Btn v="outline" onClick={() => setModal(false)}>Hủy</Btn>
          <Btn onClick={save}>💾 {editItem ? 'Cập Nhật' : 'Lưu'}</Btn>
        </div>
      </Modal>
    </div>
  )
}

// ══ MAIN APP

// ══ MAIN APP (UPDATED ROUTING)
const App=()=>{
  const [page,setPage]=useState('dashboard')
  const [sidebarOpen,setSidebarOpen]=useState(true)
  const [autoOpenPnkId,setAutoOpenPnkId]=useState(null)
  const [autoOpenPxkId,setAutoOpenPxkId]=useState(null)
  const [autoOpenPnmId,setAutoOpenPnmId]=useState(null)
  const [autoOpenPbhId,setAutoOpenPbhId]=useState(null)
  const [autoOpenBlId,setAutoOpenBlId]=useState(null)
  const render=()=>{
    switch(page){
      case 'dashboard': return <Dashboard onNav={setPage}/>
      case 'sys-company': return <CompanyInfo/>
      case 'sys-fiscal': return <FiscalYearFixed/>
      case 'sys-currency': return <Currency/>
      case 'sys-doctype': return <DocType/>
      case 'sys-params': return <SystemParams/>
      case 'sys-renum': return <ReProcess type="renum"/>
      case 'sys-repost': return <ReProcess type="repost"/>
      case 'sys-users': return <Users/>
      case 'dm-customers': return <Customers/>
      case 'dm-suppliers': return <Suppliers/>
      case 'dm-products': return <Products/>
      case 'dm-warehouse': return <Warehouses/>
      case 'dm-employees': return <Employees/>
      case 'dm-periods': return <Periods/>
      case 'dm-unit': return <UnitPage/>
      case 'dm-transaction-type': return <TransactionTypes/>
      case 'dm-product-group': return <LocalCatalog title="Nhóm Vật Tư HH" icon="📂" configKey="nhom_vattu"
        cols={[{k:'code',l:'Mã Nhóm',w:'100px',fn:v=><Code v={v}/>},{k:'name',l:'Tên Nhóm'},{k:'mo_ta',l:'Mô Tả'}]}
        modalFields={[{key:'code',label:'Mã Nhóm',req:true,placeholder:'HH'},{key:'name',label:'Tên Nhóm',req:true,placeholder:'Hàng hóa'},{key:'mo_ta',label:'Mô Tả',placeholder:''}]}
        initForm={{code:'',name:'',mo_ta:''}}/>
      case 'dm-price': return <LocalCatalog title="Bảng Giá Bán" icon="💲" configKey="bang_gia"
        cols={[{k:'code',l:'Mã',w:'100px',fn:v=><Code v={v}/>},{k:'name',l:'Tên Bảng Giá'},{k:'mo_ta',l:'Mô Tả'}]}
        modalFields={[{key:'code',label:'Mã Bảng Giá',req:true,placeholder:'GIA_LE'},{key:'name',label:'Tên Bảng Giá',req:true},{key:'mo_ta',label:'Mô Tả'}]}
        initForm={{code:'',name:'',mo_ta:''}}/>
      case 'dm-fund': return <FundPage/>
      case 'dm-costitem': return <LocalCatalog title="Khoản Mục Phí" icon="📌" configKey="khoan_muc_phi"
        cols={[{k:'code',l:'Mã Phí',w:'100px',fn:v=><Code v={v}/>},{k:'name',l:'Tên Phí'},{k:'phan_bo',l:'Phân Bổ',w:'140px'}]}
        modalFields={[{key:'code',label:'Mã Phí',req:true,placeholder:'KMP001'},{key:'name',label:'Tên Phí',req:true},{key:'phan_bo',label:'Phân Bổ',placeholder:'THEO_GIA_TRI'}]}
        initForm={{code:'',name:'',phan_bo:''}}/>
      case 'dm-taxgroup': return <LocalCatalog title="Nhóm Ngành Thuế" icon="🏛️" configKey="nhom_thue"
        cols={[{k:'code',l:'Mã Thuế',w:'90px',fn:v=><Code v={v}/>},{k:'name',l:'Tên Nhóm Thuế'},{k:'ty_le',l:'Tỷ Lệ %',w:'80px',r:true}]}
        modalFields={[{key:'code',label:'Mã Thuế',req:true,placeholder:'VAT10'},{key:'name',label:'Tên Nhóm Thuế',req:true},{key:'ty_le',label:'Tỷ Lệ %',placeholder:'10'}]}
        initForm={{code:'',name:'',ty_le:0}}/>
      
      case 'dm-invoice-template': return <LocalCatalog title="Mẫu Hóa Đơn" icon="🧾" configKey="mau_hoa_don"
        cols={[{k:'code',l:'Mã Mẫu',w:'100px',fn:v=><Code v={v}/>},{k:'name',l:'Tên Mẫu HĐ'},{k:'ky_hieu',l:'Ký Hiệu',w:'100px'}]}
        modalFields={[{key:'code',label:'Mã Mẫu',req:true,placeholder:'01GTKT'},{key:'name',label:'Tên Mẫu HĐ',req:true},{key:'ky_hieu',label:'Ký Hiệu',placeholder:'AA/24E'}]}
        initForm={{code:'',name:'',ky_hieu:''}}/>
      
      case 'dm-lot': return <LocalCatalog title="Danh Mục Lô" icon="📦" configKey="danh_muc_lo"
        cols={[{k:'code',l:'Mã Lô',w:'100px',fn:v=><Code v={v}/>},{k:'name',l:'Tên Lô'},{k:'mo_ta',l:'Mô Tả'}]}
        modalFields={[{key:'code',label:'Mã Lô',req:true,placeholder:'LO001'},{key:'name',label:'Tên Lô',req:true},{key:'mo_ta',label:'Mô Tả'}]}
        initForm={{code:'',name:'',mo_ta:''}}/>
      
      case 'dm-contract': return <LocalCatalog title="Hợp Đồng" icon="📝"
        configKey="hop_dong"
        cols={[{k:'code',l:'Mã HĐ',w:'100px',fn:v=><Code v={v}/>},{k:'name',l:'Tên HĐ'},{k:'so_hd',l:'Số HĐ',w:'100px'},{k:'gia_tri',l:'Giá Trị',r:true,fn:v=>fmtN(v||0)}]}
        modalFields={[{key:'code',label:'Mã HĐ',req:true,placeholder:'HD001'},{key:'name',label:'Tên HĐ',req:true},{key:'so_hd',label:'Số HĐ'},{key:'gia_tri',label:'Giá Trị',placeholder:'0'}]}
        initForm={{code:'',name:'',so_hd:'',gia_tri:0}}/>
      case 'dm-bom': return <BOMPage/>
      case 'dm-accounts': return <LocalCatalog title="Tài Khoản Kế Toán" icon="📒"
        configKey="tai_khoan_kt"
        cols={[{k:'code',l:'Mã TK',w:'90px',fn:v=><Code v={v}/>},{k:'name',l:'Tên Tài Khoản'},{k:'cap',l:'Cấp',w:'50px',r:true},{k:'loai',l:'Loại',w:'80px'}]}
        modalFields={[{key:'code',label:'Mã TK',req:true,placeholder:'111'},{key:'name',label:'Tên Tài Khoản',req:true},{key:'cap',label:'Cấp',placeholder:'3'},{key:'loai',label:'Loại TK',placeholder:'Tài sản'}]}
        initForm={{code:'',name:'',cap:3,loai:''}}/>
      case 'ob-inventory': return <ObInventory/>
      case 'ob-fund': return <ObFund/>
      case 'ob-tax': return <ObTax/>
      case 'ob-payroll': return <ObPayroll/>
      case 'ob-debt': return <ObDebt/>
      case 'ob-transfer-stock': return <TransferBalance type="stock"/>
      case 'ob-transfer-balance': return <TransferBalance type="balance"/>
      case 'nv-pt': return <Receipts/>
      case 'nv-pc': return <Payments/>
      case 'nv-ttg': return <BankTxn type="nv-ttg"/>
      case 'nv-ctg': return <BankTxn type="nv-ctg"/>
      case 'nv-pnm': return <PurchaseInvoice
        onOpenPnk={(pnkId)=>{setAutoOpenPnkId(pnkId);setPage('nv-pnk')}}
        autoOpenPnmId={autoOpenPnmId}
        onAutoOpenPnmDone={()=>setAutoOpenPnmId(null)}/>
      case 'nv-pbh': return <SalesOrder
        onOpenPxk={(id)=>{setAutoOpenPxkId(id);setPage('nv-pxk')}}
        autoOpenPbhId={autoOpenPbhId}
        onAutoOpenPbhDone={()=>setAutoOpenPbhId(null)}/>
      case 'nv-bl': return <RetailOrder
        onOpenPxk={(id)=>{setAutoOpenPxkId(id);setPage('nv-pxk')}}
        autoOpenBlId={autoOpenBlId}
        onAutoOpenBlDone={()=>setAutoOpenBlId(null)}/>
      case 'nv-pnk': return <WarehouseReceiptPage autoOpenPnkId={autoOpenPnkId} onAutoOpenDone={()=>setAutoOpenPnkId(null)}
  onNav={(page,id)=>{setPage(page);if(id) setAutoOpenPnmId(id)}}/>
      case 'nv-pxk': return <WarehouseIssuePage
        autoOpenPxkId={autoOpenPxkId} onAutoOpenDone={()=>setAutoOpenPxkId(null)}
        onNav={(pg,id)=>{
          setPage(pg)
          if(pg==='nv-pbh'&&id) setAutoOpenPbhId(id)
          if(pg==='nv-bl'&&id) setAutoOpenBlId(id)
        }}/>
      case 'nv-htk': return <HTKFixed/>
      case 'nv-payroll': return <PayrollPage/>
      case 'nv-payroll-config': return <PayrollConfig/>
      case 'rpt-tonkho': return <RptTonKho/>
      case 'rpt-nhapxuat': return <RptNhapXuat/>
      case 'rpt-bank': return <RptBank/>
      case 'rpt-ttg-ctg': return <RptBankTxn/>
      case 'rpt-payroll': return <RptPayrollFixed/>
      case 'rpt-debt': return <RptDebt/>
      default: return <div className="flex items-center justify-center h-64 bg-white rounded-lg border"><div className="text-center text-gray-400"><div className="text-5xl mb-3">🚧</div><p className="font-medium">{page}</p></div></div>
    }
  }
  return(<div className="min-h-screen bg-[#f0f2f5]">
    <Sidebar page={page} onNav={setPage} open={sidebarOpen}/>
    <Topbar page={page} onNav={setPage} onToggleSidebar={()=>setSidebarOpen(o=>!o)} sidebarOpen={sidebarOpen}/>
    <main className={`mt-[52px] p-5 min-h-[calc(100vh-52px)] transition-all duration-300 ${sidebarOpen?'ml-[260px]':'ml-0'}`}>
      <div key={page} style={{animation:'fadeIn 0.15s ease-out'}}>{render()}</div>
    </main>
    <style>{`
      @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      @keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    `}</style>
  </div>)
}
export default App