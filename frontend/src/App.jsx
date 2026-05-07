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
  const options = kyList.length
    ? kyList.map(k => ({ value: k.id, label: `${k.TenKy} (${k.NgayBatDau?.slice(0,7)})` }))
    : [{value:1,label:'Tháng 1/2026'},{value:2,label:'Tháng 2/2026'},{value:3,label:'Tháng 3/2026'},
       {value:4,label:'Tháng 4/2026'},{value:5,label:'Tháng 5/2026'},{value:6,label:'Tháng 6/2026'}]
  const defaultKy = kyList.length ? kyList[0].id : 1
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
  const S={success:'bg-green-50 border-green-300 text-green-800',danger:'bg-red-50 border-red-300 text-red-800',
    info:'bg-blue-50 border-blue-300 text-blue-800',warning:'bg-yellow-50 border-yellow-300 text-yellow-800'}
  return(
    <div className={`flex items-start justify-between gap-3 px-4 py-3 rounded-lg border text-sm mb-4 ${S[type]}`}>
      <span className="flex-1">{msg}</span>
      {onClose&&<button onClick={onClose} className="opacity-60 hover:opacity-100 flex-shrink-0">✕</button>}
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

const Sidebar=({page,onNav})=>{
  const [open,setOpen]=useState({system:true})
  return(
    <aside className="fixed left-0 top-0 w-[260px] h-screen bg-[#0f1923] flex flex-col z-50">
      <div className="h-[52px] px-4 flex items-center gap-3 border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-base flex-shrink-0">📊</div>
        <div><div className="text-white text-xs font-bold">KẾ TOÁN HKD</div><div className="text-white/40 text-[10px]">V2.0 | Hộ Kinh Doanh</div></div>
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
      <div className="px-4 py-2 border-t border-white/10 text-center text-[10px] text-white/30 flex-shrink-0">© 2026 HKD Accounting Software</div>
    </aside>
  )
}

const Topbar=({page})=>{
  const c=BREAD[page]||[]
  return(
    <div className="fixed top-0 left-[260px] right-0 h-[52px] bg-white border-b border-gray-200 flex items-center px-5 gap-3 z-40">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-gray-400">Trang Chủ</span>
        {c.map((x,i)=>(
          <React.Fragment key={i}>
            <span className="text-gray-300">/</span>
            <span className={i===c.length-1?'font-semibold text-gray-900':'text-gray-400'}>{x}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700">📅 Tháng 4/2026</span>
        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">A</div>
      </div>
    </div>
  )
}

// ══ DETAIL TABLE for invoices
const DetailTbl=({rows,setRows,products,color='blue',hasTax=false})=>{
  const addRow=()=>setRows(r=>[...r,{product_id:'',quantity:1,unit_price:0,tax_rate:0}])
  const upd=(i,k,v)=>setRows(rs=>rs.map((r,ri)=>ri===i?{...r,[k]:v}:r))
  const del=(i)=>setRows(rs=>rs.filter((_,ri)=>ri!==i))
  const total=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)
  const tax=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price)*((+r.tax_rate||0)/100),0)
  return(
    <div className="border border-gray-200 rounded-lg overflow-x-auto mt-4">
      <table className="w-full text-sm">
        <thead className={`bg-${color}-50`}><tr>
          <th className={`px-3 py-2 text-left text-xs font-bold text-${color}-700 w-28`}>Mã Hàng</th>
          <th className={`px-3 py-2 text-left text-xs font-bold text-${color}-700`}>Tên HH</th>
          <th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-24`}>SL</th>
          <th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-32`}>Đơn Giá</th>
          <th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-32`}>Thành Tiền</th>
          {hasTax&&<th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-20`}>%Thuế</th>}
          {hasTax&&<th className={`px-3 py-2 text-right text-xs font-bold text-${color}-700 w-32`}>Tiền Thuế</th>}
          <th className="w-8"></th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r,i)=>(
            <tr key={i}>
              <td className="px-2 py-1.5">
                <select value={r.product_id||''} onChange={e=>{const p=products.find(x=>x.id==e.target.value||x.MaHH==e.target.value);upd(i,'product_id',e.target.value);if(p)upd(i,'unit_price',p.GiaBan||p.unit_price||0)}}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none">
                  <option value="">--</option>
                  {products.map(p=><option key={p.id||p.MaHH} value={p.id||p.MaHH}>{p.MaHH||p.code}</option>)}
                </select>
              </td>
              <td className="px-2 py-1.5 text-xs text-gray-600">{products.find(p=>(p.id==r.product_id||p.MaHH==r.product_id))?.TenHH||products.find(p=>(p.id==r.product_id||p.MaHH==r.product_id))?.name||'-'}</td>
              <td className="px-2 py-1.5"><input type="number" min="0" value={r.quantity} onChange={e=>upd(i,'quantity',+e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/></td>
              <td className="px-2 py-1.5"><input type="number" min="0" value={r.unit_price} onChange={e=>upd(i,'unit_price',+e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/></td>
              <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold">{fmtN((+r.quantity)*(+r.unit_price))}</td>
              {hasTax&&<td className="px-2 py-1.5"><input type="number" min="0" max="100" value={r.tax_rate||0} onChange={e=>upd(i,'tax_rate',+e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none"/></td>}
              {hasTax&&<td className="px-3 py-1.5 text-right font-mono text-xs text-orange-600">{fmtN((+r.quantity)*(+r.unit_price)*((+r.tax_rate||0)/100))}</td>}
              <td className="px-2 py-1.5 text-center"><button onClick={()=>del(i)} className="text-red-400 hover:text-red-600 text-base">✕</button></td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
          <tr>
            <td colSpan={hasTax?5:4} className="px-3 py-2 text-sm font-bold text-blue-700">Tổng Tiền Hàng</td>
            <td className="px-3 py-2 text-right font-mono font-bold text-blue-700 text-base">{fmt(total)}</td>
            {hasTax&&<td></td>}
            {hasTax&&<td className="px-3 py-2 text-right font-mono font-bold text-orange-600">{fmt(tax)}</td>}
            <td></td>
          </tr>
          {hasTax&&<tr>
            <td colSpan={7} className="px-3 py-2 text-right font-bold text-blue-700">Tổng TT: <span className="text-lg font-mono">{fmt(total+tax)}</span></td>
            <td></td>
          </tr>}
        </tfoot>
      </table>
      <div className="p-2">
        <button onClick={addRow} className={`px-3 py-1.5 bg-${color}-50 text-${color}-700 rounded text-xs font-semibold hover:bg-${color}-100`}>+ Thêm Dòng</button>
      </div>
    </div>
  )
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

const WarehouseReceiptPage=()=>{
  const [data,loading,load]=useList('/documents/phieu-nhap-kho')
  const [tab,setTab]=useState('list')
  const [warehouses,setWarehouses]=useState([])
  const [products,setProducts]=useState([])
  const [suppliers,setSuppliers]=useState([])
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)

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
    ky_ke_toan_id: 1
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

  // ── Helpers ──
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
              <p className="text-xs text-gray-300 mt-1">
                ID phiếu: {detail.id} — items: {JSON.stringify(detail.items)}
              </p>
            </div>
          }

          <div className="flex justify-end gap-2 mt-4">
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
      <p className="px-4 py-1.5 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">
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

        <p className="text-xs font-bold text-gray-600 mb-2">Chi Tiết Hàng Nhập:</p>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-blue-700">Kho Nhập</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-blue-700">Mã Hàng</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-blue-700">Tên Hàng</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-24">SL</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-32">Đơn Giá</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-32">Thành Tiền</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r,i)=>(
                <tr key={i}>
                  <td className="px-2 py-1.5">
                    <select value={r.warehouse_id||''} onChange={e=>upd(i,'warehouse_id',e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none">
                      <option value="">--</option>
                      {warehouses.map(w=><option key={w.id} value={w.id}>{w.MaKho||w.code}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select value={r.product_id||''} onChange={e=>{
                      const p=products.find(x=>x.id==e.target.value)
                      upd(i,'product_id',e.target.value)
                      if(p) upd(i,'unit_price',p.GiaBan||p.unit_price||0)
                    }} className="w-28 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none">
                      <option value="">--</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.MaHH||p.code}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs text-gray-600">
                    {products.find(p=>String(p.id)===String(r.product_id))?.TenHH||
                     products.find(p=>String(p.id)===String(r.product_id))?.name||'-'}
                  </td>
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
                  <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold text-blue-700">
                    {fmtN((+r.quantity)*(+r.unit_price))}
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={()=>setRows(rs=>rs.filter((_,ri)=>ri!==i))}
                      className="text-red-400 hover:text-red-600 text-base">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={5} className="px-3 py-2 font-bold text-blue-700">Tổng Thanh Toán</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-700 text-base">
                  {fmt(total)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button onClick={()=>setRows(r=>[...r,{product_id:'',warehouse_id:'',quantity:1,unit_price:0}])}
          className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold hover:bg-blue-100">
          + Thêm Dòng
        </button>
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
const WarehouseIssuePage=()=>{
  const [data,loading,load]=useList('/documents/phieu-xuat-kho')
  const [tab,setTab]=useState('list')
  const [warehouses,setWarehouses]=useState([])
  const [products,setProducts]=useState([])
  const [customers,setCustomers]=useState([])
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)

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
    ky_ke_toan_id: 1
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
                  {detail.ten_kh||getKHLabel(detail.MaKH||detail.khach_hang_id)||'-'}
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
      <p className="px-4 py-1.5 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">
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
        {k:'khach_hang_id',l:'Khách Hàng',fn:v=>(
          <span className="font-medium">{getKHLabel(v)}</span>
        )},
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
          <div className="col-span-3">
            <Inp label="Diễn Giải" value={form.dien_giai} onChange={sf('dien_giai')}/>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-600 mb-2">Chi Tiết Hàng Xuất:</p>
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-blue-700">Kho Xuất</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-blue-700">Mã Hàng</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-blue-700">Tên Hàng</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-24">SL</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-32">Đơn Giá</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 w-32">Thành Tiền</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r,i)=>(
                <tr key={i}>
                  <td className="px-2 py-1.5">
                    <select value={r.warehouse_id||''} onChange={e=>upd(i,'warehouse_id',e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none">
                      <option value="">--</option>
                      {warehouses.map(w=><option key={w.id} value={w.id}>{w.MaKho||w.code}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <select value={r.product_id||''} onChange={e=>{
                      const p=products.find(x=>x.id==e.target.value)
                      upd(i,'product_id',e.target.value)
                      if(p) upd(i,'unit_price',p.GiaBan||p.unit_price||0)
                    }} className="w-28 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none">
                      <option value="">--</option>
                      {products.map(p=><option key={p.id} value={p.id}>{p.MaHH||p.code}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5 text-xs text-gray-600">
                    {products.find(p=>String(p.id)===String(r.product_id))?.TenHH||
                     products.find(p=>String(p.id)===String(r.product_id))?.name||'-'}
                  </td>
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
                  <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold text-blue-700">
                    {fmtN((+r.quantity)*(+r.unit_price))}
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={()=>setRows(rs=>rs.filter((_,ri)=>ri!==i))}
                      className="text-blue-400 hover:text-blue-600 text-base">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={5} className="px-3 py-2 font-bold text-blue-700">Tổng Thanh Toán</td>
                <td className="px-3 py-2 text-right font-mono font-bold text-blue-700 text-base">
                  {fmt(total)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <button onClick={()=>setRows(r=>[...r,{product_id:'',warehouse_id:'',quantity:1,unit_price:0}])}
          className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold hover:bg-red-100">
          + Thêm Dòng
        </button>
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
// ══ HTK với Excel
const HTKFixed = () => {
  const [form, setForm] = useState({ period_from: '2026-04-01', period_to: '2026-04-30', valuation_method: 'AVG', group_by: 'product' })
  const [result, setResult] = useState(null); const [loading, setLoading] = useState(false)
  const [tab2, setTab2] = useState('result'); const [alert, showAlert, closeAlert] = useAlert()
  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const calc = async () => {
    setLoading(true)
    const r = await api('POST', '/inventory/tinh-gia-htk', form)
    if (r) { setResult(r); showAlert(`Tính giá HTK ${form.valuation_method} thành công!`) }
    else showAlert('Lỗi tính giá HTK!', 'danger')
    setLoading(false)
  }

  const doExcel = () => {
    if (!result) return
    exportExcel(`TinhGiaHTK_${form.valuation_method}`, 'Tính Giá HTK',
      ['Mã SP', 'Tên SP', 'ĐK-SL', 'ĐK-GT', 'Nhập-SL', 'Nhập-GT', 'Xuất-SL', 'Xuất-GT', 'CK-SL', 'CK-GT', 'Đơn Giá'],
      (result.details || []).map(d => [
        d.product_code, d.product_name,
        d.opening_qty, d.opening_value,
        d.import_qty, d.import_value,
        d.export_qty, d.export_value,
        d.closing_qty, d.closing_value,
        d.unit_price,
      ])
    )
  }

  return (
    <div className="space-y-4">
      {alert && <Alert msg={alert.msg} type={alert.type} onClose={closeAlert} />}
      <Card><CH><h3 className="font-bold">⚖️ Tính Giá Tồn Kho</h3></CH>
        <CB><div className="grid grid-cols-4 gap-3">
          <Sel label="Cách Tính" req value={form.valuation_method} onChange={sf('valuation_method')} options={[{ value: 'AVG', label: 'AVG - Bình quân' }, { value: 'FIFO', label: 'FIFO - Nhập trước xuất trước' }]} />
          <Inp label="Từ Tháng" req type="date" value={form.period_from} onChange={sf('period_from')} />
          <Inp label="Đến Tháng" req type="date" value={form.period_to} onChange={sf('period_to')} />
          <div className="flex items-end"><Btn onClick={calc} disabled={loading} className="w-full justify-center">⚡ {loading ? 'Đang tính...' : 'Tính Giá HTK'}</Btn></div>
        </div></CB>
      </Card>
      {result && (
        <div>
          <Tabs tabs={[{ id: 'result', label: '📊 Kết Quả' }, { id: 'report', label: '📄 Xuất BC' }]} active={tab2} onChange={setTab2} />
          {tab2 === 'result' && (
            <Card>
              <CH>
                <h3 className="font-bold">📊 Bảng Tính Giá HTK - {form.valuation_method}</h3>
                <div className="ml-auto"><Btn v="excel" size="sm" onClick={doExcel}>⬇ Excel</Btn></div>
              </CH>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase" rowSpan={2}>Mã SP</th>
                      <th className="px-3 py-2 text-left text-xs font-bold uppercase" rowSpan={2}>Tên SP</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-blue-700 bg-blue-50 uppercase" colSpan={2}>Đầu Kỳ</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-green-700 bg-green-50 uppercase" colSpan={2}>Nhập</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-red-700 bg-red-50 uppercase" colSpan={2}>Xuất</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-yellow-700 bg-yellow-50 uppercase" colSpan={2}>Cuối Kỳ</th>
                      <th className="px-3 py-2 text-right text-xs font-bold uppercase" rowSpan={2}>Đơn Giá</th>
                    </tr>
                    <tr>
                      {['SL', 'GT', 'SL', 'GT', 'SL', 'GT', 'SL', 'GT'].map((h, i) => (
                        <th key={i} className={`px-3 py-1 text-xs font-semibold text-right ${i < 2 ? 'bg-blue-50 text-blue-600' : i < 4 ? 'bg-green-50 text-green-600' : i < 6 ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(result.details || []).map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2"><Code v={d.product_code} /></td>
                        <td className="px-3 py-2 font-medium">{d.product_name}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{d.opening_qty}</td><td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.opening_value)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{d.import_qty}</td><td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.import_value)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{d.export_qty}</td><td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.export_value)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs font-bold">{d.closing_qty}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs font-bold text-blue-700">{fmtN(d.closing_value)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.unit_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={2} className="px-3 py-2.5 font-bold">TỔNG CỘNG</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{result.total_opening_qty || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{fmtN(result.total_opening_value)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{result.total_import_qty || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{fmtN(result.total_import_value)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{result.total_export_qty || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{fmtN(result.total_export_value)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold">{result.total_closing_qty || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700">{fmtN(result.total_closing_value)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
          {tab2 === 'report' && (
            <Card><CH><h3 className="font-bold">📄 Xuất Báo Cáo HTK</h3>
              <div className="ml-auto"><Btn v="excel" onClick={doExcel}>⬇ Xuất Excel</Btn></div>
            </CH><CB><Alert msg="ℹ️ Nhấn nút Xuất Excel để tải file về máy." type="info" /></CB></Card>
          )}
        </div>
      )}
    </div>
  )
}

// ══ THANH TOÁN LƯƠNG - Tạo CTL + Tính lương + Xuất Excel
const PayrollPageFixed=()=>{
  const [data,loading,load]=useList('/payroll')
  const [tab,setTab]=useState('list')
  const [employees,setEmployees]=useState([])
  const [cfg,setCfg]=useState({ty_le_bhxh:8,ty_le_bhyt:1.5,ty_le_bhtn:1})
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()  // ← THÊM DÒNG NÀY
  const [alert,showAlert,closeAlert]=useAlert()

  const makeNewSoCT=(list)=>{
    const ym=new Date().toISOString().slice(0,7).replace('-','')
    const pre=`CTL-${ym}`
    const maxNum=(list||[]).reduce((mx,r)=>{
      const soct=r.so_chung_tu||''
      if(!soct.startsWith(pre)) return mx
      const n=parseInt(soct.split('-').pop())||0
      return n>mx?n:mx
    },0)
    return `${pre}-${String(maxNum+1).padStart(3,'0')}`
  }

  const makeEmptyForm=(list=[])=>({
    so_chung_tu: makeNewSoCT(list),
    ngay_chung_tu: today(),
    ky_ke_toan_id: kyDefault||1,
    dien_giai: ''
  })

  const [form,setForm]=useState(()=>makeEmptyForm())
  const [luongRows,setLuongRows]=useState([])
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/employees').then(d=>{
      if(Array.isArray(d)){
        setEmployees(d)
        setLuongRows(d.map(e=>({
          employee_id:e.id,
          ma_nv:e.ma_nv,
          ten_nv:e.ten_nv,
          luong_co_ban:e.luong_co_ban||0,
          so_cong:26,
          phu_cap:0,
          tien_thuong:0,
        })))
      }
    })
    api('GET','/payroll-config').then(d=>{if(d&&!d.__error)setCfg(d)})
  },[])

  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,so_chung_tu:makeNewSoCT(data)}))
  },[data,loading])

  const calcRow=(r)=>{
    const tong=(+r.luong_co_ban)+(+r.phu_cap)+(+r.tien_thuong)
    const bhxh=Math.round(tong*(cfg.ty_le_bhxh||8)/100)
    const bhyt=Math.round(tong*(cfg.ty_le_bhyt||1.5)/100)
    const bhtn=Math.round(tong*(cfg.ty_le_bhtn||1)/100)
    const thuc=tong-bhxh-bhyt-bhtn
    return{...r,tong_thu_nhap:tong,tru_bhxh:bhxh,tru_bhyt:bhyt,tru_bhtn:bhtn,tong_tru:bhxh+bhyt+bhtn,thuc_lanh:thuc}
  }

  const rowsCalc=luongRows.map(calcRow)
  const tongThuNhap=rowsCalc.reduce((s,r)=>s+r.tong_thu_nhap,0)
  const tongTru=rowsCalc.reduce((s,r)=>s+r.tong_tru,0)
  const tongThucLanh=rowsCalc.reduce((s,r)=>s+r.thuc_lanh,0)

  const upd=(i,k,v)=>setLuongRows(rs=>rs.map((r,ri)=>ri===i?{...r,[k]:+v}:r))

  const save=async()=>{
  if(!form.so_chung_tu){
    showAlert('Vui lòng nhập Số CT!','danger'); return
  }
  if(!rowsCalc.length){
    showAlert('Chưa có nhân viên! Vào Danh Mục → Nhân Viên để thêm.','danger'); return
  }

  // Build body đúng theo PayrollCreate schema
  const body={
    so_chung_tu: form.so_chung_tu,
    ngay_chung_tu: form.ngay_chung_tu,
    ky_ke_toan_id: +form.ky_ke_toan_id,
    dien_giai: form.dien_giai||'',
    details: rowsCalc.map(r=>({
      employee_id: +r.employee_id,
      so_luong_sp: 0,
      tien_luong_sp: 0,
      so_cong: +(r.so_cong||26),
      luong_thoi_gian: +(r.luong_co_ban||0),
      cong_nghi_tinh_luong: 0,
      tien_luong_nghi: 0,
      pc_tu_quy_luong: +(r.phu_cap||0),
      phu_cap_khac: 0,
      tien_thuong: +(r.tien_thuong||0),
    }))
  }

  // Log để debug
  console.log('Payroll body:', JSON.stringify(body, null, 2))

  const r=await api('POST','/payroll',body)
  if(r&&!r.__error){
    showAlert(`Tạo CTL ${form.so_chung_tu} thành công!`)
    const newData=await api('GET','/payroll')
    setForm(makeEmptyForm(Array.isArray(newData)?newData:[]))
    load()
    setTab('list')
  } else {
    showAlert('Lỗi: '+(r?.message||'Tạo CTL thất bại - kiểm tra console'),'danger')
    console.error('Payroll error:', r)
  }
}

  const doExcelBangLuong=()=>exportExcel(
    `BangLuong_${form.so_chung_tu||'CTL'}`,
    'Bảng Lương',
    ['Mã NV','Tên NV','Lương CB','Phụ Cấp','Thưởng','Tổng TN','BHXH','BHYT','BHTN','Tổng Trừ','Thực Lãnh'],
    rowsCalc.map(r=>[r.ma_nv,r.ten_nv,r.luong_co_ban,r.phu_cap,r.tien_thuong,
      r.tong_thu_nhap,r.tru_bhxh,r.tru_bhyt,r.tru_bhtn,r.tong_tru,r.thuc_lanh])
  )

  const doExcelList=()=>exportExcel('DanhSachCTL','Chứng Từ Lương',
    ['Số CT','Ngày CT','Tổng TN','Tổng Giảm Trừ','Thực Lãnh','TT'],
    data.map(r=>[r.so_chung_tu,fmtDate(r.ngay_chung_tu),r.tong_thu_nhap,r.tong_giam_tru,r.tong_thuc_lanh,r.trang_thai])
  )

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}

    <Tabs tabs={[
      {id:'list',label:'📋 Danh Sách CTL'},
      {id:'create',label:'+ Tạo Chứng Từ Lương'}
    ]} active={tab}
      onChange={t=>{
        setTab(t)
        if(t==='create') setForm(f=>({...f,so_chung_tu:makeNewSoCT(data)}))
      }}/>

    {/* ── DANH SÁCH ── */}
    {tab==='list'&&<Card>
      <CH>
        <h3 className="font-bold">👥 Danh Sách Chứng Từ Thanh Toán Lương</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="excel" size="sm" onClick={doExcelList}>⬇ Excel Danh Sách</Btn>
        </div>
      </CH>
      <Tbl data={data} loading={loading} empty="Chưa có chứng từ lương. Nhấn + Tạo để lập bảng lương." cols={[
        {k:'so_chung_tu',l:'Số CT',w:'130px',fn:v=><Code v={v}/>},
        {k:'ngay_chung_tu',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
        {k:'dien_giai',l:'Diễn Giải'},
        {k:'tong_thu_nhap',l:'Tổng Thu Nhập',r:true,fn:v=>fmt(v)},
        {k:'tong_giam_tru',l:'Tổng Giảm Trừ',r:true,
          fn:v=><span className="text-red-600">{fmt(v)}</span>},
        {k:'tong_thuc_lanh',l:'Thực Lãnh',r:true,
          fn:v=><span className="text-green-700 font-bold">{fmt(v)}</span>},
        {k:'trang_thai',l:'TT',w:'90px',
          fn:v=><Badge v={v==='POSTED'?'success':'warning'}>{v||'DRAFT'}</Badge>},
      ]}/>
    </Card>}

    {/* ── TẠO MỚI ── */}
    {tab==='create'&&<div className="space-y-4">
      {/* Thông tin chứng từ */}
      <Card>
        <CH><h3 className="font-bold">📋 Thông Tin Chứng Từ Lương</h3></CH>
        <CB>
          <div className="grid grid-cols-3 gap-3">
            <Inp label="Số CT" req value={form.so_chung_tu}
              onChange={sf('so_chung_tu')} hint="Tự sinh, có thể sửa"/>
            <Inp label="Ngày CT" req type="date" value={form.ngay_chung_tu}
              onChange={sf('ngay_chung_tu')}/>
            <Sel label="Kỳ Kế Toán" value={form.ky_ke_toan_id}
              onChange={sf('ky_ke_toan_id')} options={kyOptions}/>
            <div className="col-span-3">
              <Inp label="Diễn Giải" value={form.dien_giai}
                onChange={sf('dien_giai')} placeholder="Lương tháng .../..."/>
            </div>
          </div>
        </CB>
      </Card>

      {/* Bảng tính lương */}
      <Card>
        <CH>
          <h3 className="font-bold">📊 Bảng Tính Lương</h3>
          <div className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            BHXH {cfg.ty_le_bhxh}% | BHYT {cfg.ty_le_bhyt}% | BHTN {cfg.ty_le_bhtn}%
          </div>
          <div className="ml-auto">
            <Btn v="excel" size="sm" onClick={doExcelBangLuong}>⬇ Xuất Excel Bảng Lương</Btn>
          </div>
        </CH>

        {luongRows.length===0
          ?<CB>
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-3">👤</div>
              <p className="font-medium">Chưa có nhân viên nào</p>
              <p className="text-xs mt-1">Vào <b>Danh Mục → Nhân Viên</b> để thêm nhân viên trước</p>
            </div>
          </CB>
          :<div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase w-24">Mã NV</th>
                  <th className="px-3 py-2 text-left text-xs font-bold uppercase">Tên NV</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase w-32">Lương CB</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase w-28">Phụ Cấp</th>
                  <th className="px-3 py-2 text-right text-xs font-bold uppercase w-28">Thưởng</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-blue-700 uppercase w-32">Tổng TN</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-orange-600 uppercase w-24">BHXH</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-orange-600 uppercase w-24">BHYT</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-orange-600 uppercase w-24">BHTN</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-green-700 uppercase w-32">Thực Lãnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rowsCalc.map((r,i)=>(
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2"><Code v={r.ma_nv}/></td>
                    <td className="px-3 py-2 font-medium">{r.ten_nv}</td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={r.luong_co_ban}
                        onChange={e=>upd(i,'luong_co_ban',e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={r.phu_cap}
                        onChange={e=>upd(i,'phu_cap',e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={r.tien_thuong}
                        onChange={e=>upd(i,'tien_thuong',e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold text-blue-700">
                      {fmtN(r.tong_thu_nhap)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-orange-600">
                      {fmtN(r.tru_bhxh)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-orange-600">
                      {fmtN(r.tru_bhyt)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-orange-600">
                      {fmtN(r.tru_bhtn)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs font-bold text-green-700">
                      {fmtN(r.thuc_lanh)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                <tr>
                  <td colSpan={5} className="px-3 py-2.5 font-bold text-sm">TỔNG CỘNG</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700">
                    {fmtN(tongThuNhap)}
                  </td>
                  <td colSpan={3} className="px-3 py-2.5 text-right font-mono font-bold text-orange-600">
                    {fmtN(tongTru)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-green-700">
                    {fmtN(tongThucLanh)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        }
      </Card>

      {/* Tổng kết + nút lưu */}
      <div className="flex items-center justify-between">
        <div className="flex gap-6 text-sm">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center min-w-32">
            <div className="text-xs text-gray-500 mb-1">Tổng Thu Nhập</div>
            <div className="font-bold font-mono text-blue-700">{fmt(tongThuNhap)}</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center min-w-32">
            <div className="text-xs text-gray-500 mb-1">Tổng Giảm Trừ</div>
            <div className="font-bold font-mono text-orange-600">{fmt(tongTru)}</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center min-w-32">
            <div className="text-xs text-gray-500 mb-1">Thực Lãnh</div>
            <div className="font-bold font-mono text-green-700 text-lg">{fmt(tongThucLanh)}</div>
          </div>
        </div>
        <div className="flex gap-3">
          <Btn v="outline" onClick={()=>setTab('list')}>Hủy</Btn>
          <Btn v="excel" onClick={doExcelBangLuong}>⬇ Xuất Excel</Btn>
          <Btn v="success" onClick={save}>💾 Lưu Chứng Từ Lương</Btn>
        </div>
      </div>
    </div>}
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
  const [form,setForm]=useState({MaHH:'',TenHH:'',DVT:'',DanhMuc:'',GiaBan:0,TonKhoToiThieu:10,ConHoatDong:true})
  const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  useEffect(()=>{api('GET','/units').then(d=>{ const list=Array.isArray(d)?d:[]; setUnits(list); if(list.length) setForm(f=>({...f,DVT:f.DVT||list[0].name||list[0].code||''})) })}, [])
  const openModal=()=>setModal(true)
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
        <Inp label="Danh Mục (DanhMuc)" value={form.DanhMuc} onChange={sf('DanhMuc')}/>
        <Inp label="Giá Bán (GiaBan)" type="number" value={form.GiaBan} onChange={sf('GiaBan')}/>
        <Inp label="Tồn Tối Thiểu" type="number" value={form.TonKhoToiThieu} onChange={sf('TonKhoToiThieu')}/>
      </div>
      {!units.length&&<p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mt-3">⚠️ Chưa có đơn vị tính — vào <b>Danh Mục → Đơn Vị Tính</b> để thêm trước.</p>}
      <div className="flex justify-end gap-2 mt-4"><Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn><Btn onClick={save}>💾 Lưu</Btn></div>
    </Modal>
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
  const [alert,showAlert,closeAlert]=useAlert()
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
      detail={detail} loading={detailLoading} products={[]} customers={customers} suppliers={[]}/>
    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]} active={tab}
      onChange={t=>{setTab(t);if(t==='create') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))}}/>
    {tab==='list'&&<Card>
      <CH><h3 className="font-bold">💰 Danh Sách Phiếu Thu</h3>
        <div className="ml-auto flex gap-2"><Btn v="pdf" size="sm">⬇ PDF</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết</p>
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
      detail={detail} loading={detailLoading} products={[]} customers={[]} suppliers={suppliers}/>
    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]} active={tab}
      onChange={t=>{setTab(t);if(t==='create') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))}}/>
    {tab==='list'&&<Card>
      <CH><h3 className="font-bold">💸 Danh Sách Phiếu Chi</h3>
        <div className="ml-auto flex gap-2"><Btn v="pdf" size="sm">⬇ PDF</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết</p>
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
      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
        <span className="text-sm font-semibold text-red-800">Tổng Tiền Chi:</span>
        <span className="text-xl font-bold text-red-700 font-mono">{fmt(form.TienChi)}</span>
      </div></CB>
      <CF><Btn v="outline" onClick={()=>setTab('list')}>Hủy</Btn><Btn onClick={save}>💾 Lưu</Btn></CF>
    </Card>}
  </div>)
}

// TTG / CTG
const BankTxn=({type})=>{
  const isTTG=type==='nv-ttg'
  const [data,loading,load]=useList(isTTG?'/banking/ttg':'/banking/ctg')
  const [modal,setModal]=useState(false)
  const [accounts,setAccounts]=useState([])
  const [ltypes,setLtypes]=useState([])
  const [customers,setCustomers]=useState([])
  const [suppliers,setSuppliers]=useState([])
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)

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
    noi_dung:'',period_id:1
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
    if(!loading) setForm(f=>({...f,so_chung_tu:makeNewSoCT(data)}))
  },[data,loading])

  const openDetail=(row)=>{
    // TTG/CTG dùng data từ row trực tiếp, không cần fetch thêm
    setDetail({
      SoCT: row.so_chung_tu,
      NgayCT: row.ngay_chung_tu,
      loai_giao_dich: row.loai_giao_dich,
      so_tien_thu: isTTG ? row.so_tien_thu : undefined,
      so_tien_chi: !isTTG ? row.so_tien_chi : undefined,
      noi_dung: row.noi_dung,
      TrangThai: row.trang_thai,
      da_doi_chieu: row.da_doi_chieu,
      items:[]
    })
    setDetailModal(true)
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
      load(); setModal(false)
    } else showAlert('Lỗi: '+(r?.message||'Tạo thất bại'),'danger')
  }

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}

    <DetailModal open={detailModal} onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`🏦 Chi Tiết ${isTTG?'Thu Tiền Gửi':'Chi Tiền Gửi'} - ${detail?.SoCT||''}`}
      detail={detail} loading={detailLoading} products={[]} customers={customers} suppliers={suppliers}/>

    <Card><CH>
      <h3 className="font-bold">{isTTG?'🏦 Thu Tiền Gửi (TTG)':'🏦 Chi Tiền Gửi (CTG)'}</h3>
      <div className="ml-auto flex gap-2">
        <Btn size="sm" onClick={()=>{
          setForm(f=>({...f,so_chung_tu:makeNewSoCT(data)}))
          setModal(true)
        }}>+ Tạo Mới</Btn>
        <Btn v="pdf" size="sm">⬇ PDF</Btn>
      </div>
    </CH>
      <p className="px-4 py-1.5 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết</p>
      <Tbl data={data} loading={loading} empty={`Chưa có ${prefix}`} cols={[
        {k:'so_chung_tu',l:'Số CT',w:'150px',fn:(v,r)=>(
          <button onClick={()=>openDetail(r)} className="text-blue-600 hover:underline font-mono text-xs font-semibold">{v||'-'}</button>
        )},
        {k:'ngay_chung_tu',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
        {k:'tk_id',l:'Tài Khoản',w:'160px',fn:v=><span className="text-xs">{getTKLabel(v)}</span>},
        {
            k: 'loai_giao_dich',
            l: 'Loại GD',
            w: '150px', // Thêm độ rộng để bảng cân đối
            fn: (v, r) => (
              <Badge v="success">
                {v || r.loai_giao_dich || '-'}
              </Badge>
            )
          },
        {k:isTTG?'so_tien_thu':'so_tien_chi',l:'Số Tiền',r:true,
          fn:v=><span className={`font-semibold ${isTTG?'text-green-700':'text-red-700'}`}>{fmt(v)}</span>},
        {k:'noi_dung',l:'Nội Dung'},
        {k:'da_doi_chieu',l:'Đối Chiếu',w:'90px',fn:v=><Badge v={v?'success':'gray'}>{v?'Đã ĐC':'Chưa'}</Badge>},
        {k:'trang_thai',l:'TT',w:'90px',fn:v=><Badge v={v==='POSTED'?'success':'warning'}>{v||'DRAFT'}</Badge>},
      ]}/>
    </Card>

    <Modal open={modal} onClose={()=>setModal(false)}
      title={isTTG?'🏦 Tạo Thu Tiền Gửi (TTG)':'🏦 Tạo Chi Tiền Gửi (CTG)'}>
      <div className="grid grid-cols-2 gap-3">
        <Inp label="Số CT" req value={form.so_chung_tu} onChange={sf('so_chung_tu')} hint="Tự sinh, có thể sửa"/>
        <Inp label="Ngày CT" req type="date" value={form.ngay_chung_tu} onChange={sf('ngay_chung_tu')}/>
        <Sel label="Tài Khoản NH" req value={form.tk_id} onChange={sf('tk_id')}
          options={accounts.map(a=>({value:a.id,label:`${a.ma_tk} - ${a.ten_tk}`}))}/>
        <Sel label="Loại Giao Dịch" value={form.loai_giao_dich} onChange={sf('loai_giao_dich')}
          options={ltypes.map(t=>({value:t.value||t.name||t,label:t.label||t.name||t}))}/>
        <Inp label={isTTG?'Số Tiền Thu':'Số Tiền Chi'} req type="number" min="0"
          value={isTTG?form.so_tien_thu:form.so_tien_chi}
          onChange={sf(isTTG?'so_tien_thu':'so_tien_chi')}/>
        {isTTG
          ?<Sel label="Khách Hàng" value={form.khach_hang_id||''} onChange={sf('khach_hang_id')}
              options={customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))}/>
          :<Sel label="Nhà Cung Cấp" value={form.supplier_id||''} onChange={sf('supplier_id')}
              options={suppliers.map(s=>({value:s.id,label:`${s.TenNCC||s.name} (${s.MaNCC||s.code})`}))}/>
        }
        <div className="col-span-2"><Inp label="Nội Dung" value={form.noi_dung} onChange={sf('noi_dung')}/></div>
      </div>
      <div className={`mt-3 p-3 rounded-lg border flex justify-between items-center ${isTTG?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>
        <span className={`text-sm font-semibold ${isTTG?'text-green-800':'text-red-800'}`}>{isTTG?'Số Tiền Thu:':'Số Tiền Chi:'}</span>
        <span className={`text-xl font-bold font-mono ${isTTG?'text-green-700':'text-red-700'}`}>{fmt(isTTG?form.so_tien_thu:form.so_tien_chi)}</span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Btn v="outline" onClick={()=>setModal(false)}>Hủy</Btn>
        <Btn v={isTTG?'success':'danger'} onClick={save}>💾 Lưu</Btn>
      </div>
    </Modal>
  </div>)
}

// PHIẾU NHẬP MUA - API: NgayCT, SoCT, MaNCC, SoHD, NgayHD, NguoiGD, DienGiai, MaKyKeToan, HinhThucTT, DanhSachHang[{MaHH,SoLuong,DonGia,GhiChu}]
const PurchaseInvoice=()=>{
  const [data,loading,load]=useList('/documents/phieu-nhap-mua')
  const [tab,setTab]=useState('list')
  const [suppliers,setSuppliers]=useState([])
  const [products,setProducts]=useState([])
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)

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

  const makeEmptyForm=(list=[])=>({
    SoCT:makeNewSoCT(list),NgayCT:today(),MaKyKeToan:kyDefault,
    MaNCC:'',NguoiGD:'',DienGiai:'',SoHD:'',NgayHD:today(),HinhThucTT:'Tiền mặt'
  })
  const emptyRows=()=>[{product_id:'',quantity:1,unit_price:0,tax_rate:0}]

  const [form,setForm]=useState(()=>makeEmptyForm())
  const [rows,setRows]=useState(emptyRows())
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/suppliers').then(d=>setSuppliers(Array.isArray(d)?d:[]))
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
  },[])

  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))
  },[data,loading])

  // Hàm xem chi tiết phiếu
  const openDetail=async(row)=>{
    setDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    const r=await api('GET',`/documents/phieu-nhap-mua/${row.id}`)
    setDetail(r&&!r.__error?r:{...row,items:[]})
    setDetailLoading(false)
  }

  // Helper tên NCC
  const getNCCLabel=(id)=>{
    if(!id) return '-'
    const s=suppliers.find(x=>String(x.id)===String(id))
    return s?`${s.TenNCC||s.name} (${s.MaNCC||s.code})`:`NCC #${id}`
  }

  const save=async()=>{
    if(!form.SoCT||!form.MaNCC){
      showAlert('Vui lòng điền: Số CT và Nhà Cung Cấp!','danger'); return
    }
    const validRows=rows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validRows.length){
      showAlert('Vui lòng thêm ít nhất 1 dòng hàng hóa!','danger'); return
    }
    const body={
      NgayCT:form.NgayCT,SoCT:form.SoCT,MaNCC:+form.MaNCC,
      SoHD:form.SoHD,NgayHD:form.NgayHD,NguoiGD:form.NguoiGD,
      DienGiai:form.DienGiai,MaKyKeToan:+form.MaKyKeToan,HinhThucTT:form.HinhThucTT,
      DanhSachHang:validRows.map(r=>({MaHH:+r.product_id,SoLuong:+r.quantity,DonGia:+r.unit_price,GhiChu:''}))
    }
    const r=await api('POST','/documents/phieu-nhap-mua',body)
    if(r&&!r.__error){
      showAlert(`Tạo PNM ${form.SoCT} thành công!`)
      const newData=await api('GET','/documents/phieu-nhap-mua')
      const list=Array.isArray(newData)?newData:[]
      setForm(makeEmptyForm(list))
      setRows(emptyRows())
      load()
      setTab('list')
    } else showAlert('Lỗi: '+(r?.message||'Tạo PNM thất bại'),'danger')
  }

  const total=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)
  const totalTax=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price)*((+r.tax_rate||0)/100),0)

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
      suppliers={suppliers}/>

    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]}
      active={tab}
      onChange={t=>{
        setTab(t)
        if(t==='create'){setForm(makeEmptyForm(data));setRows(emptyRows())}
      }}/>

    {/* ── DANH SÁCH ── */}
    {tab==='list'&&<Card>
      <CH>
        <h3 className="font-bold">🛒 Danh Sách Phiếu Nhập Mua</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="pdf" size="sm">⬇ PDF</Btn>
          <Btn v="excel" size="sm">⬇ Excel</Btn>
        </div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">
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
          <Inp label="Ngày CT" req type="date" value={form.NgayCT} onChange={sf('NgayCT')}/>
          <Sel label="Kỳ Kế Toán" req value={form.MaKyKeToan} onChange={sf('MaKyKeToan')} options={kyOptions}/>
          <div className="col-span-2">
            <Sel label="Nhà Cung Cấp" req value={form.MaNCC} onChange={sf('MaNCC')}
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

        <p className="text-xs font-bold text-gray-600 mb-2">Danh Sách Hàng Hóa:</p>
        <DetailTbl rows={rows} setRows={setRows} products={products} color="blue" hasTax={true}/>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-blue-700 font-semibold">Tổng Tiền Hàng:</span>
            <span className="font-bold font-mono text-blue-800">{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-orange-600 font-semibold">Tiền Thuế:</span>
            <span className="font-bold font-mono text-orange-600">{fmt(totalTax)}</span>
          </div>
          <div className="flex justify-between text-base pt-2 border-t border-blue-200">
            <span className="text-blue-900 font-bold">Tổng Thanh Toán:</span>
            <span className="font-bold font-mono text-blue-900">{fmt(total+totalTax)}</span>
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
const SalesOrder=()=>{
  const [data,loading,load]=useList('/documents/phieu-ban-hang')
  const [tab,setTab]=useState('list')
  const [customers,setCustomers]=useState([])
  const [products,setProducts]=useState([])
  const [invoiceTemplates,setInvoiceTemplates]=useState([])
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)

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

  const makeEmptyForm=(list=[])=>({
    SoCT:makeNewSoCT(list),NgayCT:today(),MaKyKeToan:kyDefault,
    MaKH:'',NguoiGD:'',DienGiai:'',SoHD:'',NgayHD:today(),
    HinhThucTT:'Tiền mặt',SoSeri:'',KyHieuHD:''
  })
  const emptyRows=()=>[{product_id:'',quantity:1,unit_price:0}]

  const [form,setForm]=useState(()=>makeEmptyForm())
  const [rows,setRows]=useState(emptyRows())
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/customers').then(d=>setCustomers(Array.isArray(d)?d:[]))
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
    api('GET','/system-config/mau_hoa_don').then(d=>{
      setInvoiceTemplates(Array.isArray(d?.data)?d.data:[])
    })
  },[])

  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))
  },[data,loading])

  // Hàm xem chi tiết phiếu
  const openDetail=async(row)=>{
    setDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    const r=await api('GET',`/documents/phieu-ban-hang/${row.id}`)
    setDetail(r&&!r.__error?r:{...row,items:[]})
    setDetailLoading(false)
  }

  // Khi chọn mẫu HĐ → tự điền KyHieuHD
  const onSelectTemplate=(e)=>{
    const val=e.target.value
    const tmpl=invoiceTemplates.find(t=>t.code===val)
    setForm(f=>({...f,SoSeri:val,KyHieuHD:tmpl?.ky_hieu||''}))
  }

  // Helper tên KH
  const getKHLabel=(id)=>{
    if(!id) return '-'
    const c=customers.find(x=>String(x.id)===String(id))
    return c?`${c.TenKH||c.name} (${c.MaKH||c.code})`:`KH #${id}`
  }

  const save=async()=>{
    if(!form.SoCT||!form.MaKH){
      showAlert('Vui lòng điền: Số CT và Khách Hàng!','danger'); return
    }
    const validRows=rows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validRows.length){
      showAlert('Vui lòng thêm ít nhất 1 dòng hàng hóa!','danger'); return
    }
    const body={
      NgayCT:form.NgayCT,SoCT:form.SoCT,MaKH:+form.MaKH,
      SoHD:form.SoHD,NgayHD:form.NgayHD,NguoiGD:form.NguoiGD,
      DienGiai:form.DienGiai,MaKyKeToan:+form.MaKyKeToan,HinhThucTT:form.HinhThucTT,
      DanhSachHang:validRows.map(r=>({MaHH:+r.product_id,SoLuong:+r.quantity,DonGia:+r.unit_price,GhiChu:''}))
    }
    const r=await api('POST','/documents/phieu-ban-hang',body)
    if(r&&!r.__error){
      showAlert(`Tạo PBH ${form.SoCT} thành công!`)
      const newData=await api('GET','/documents/phieu-ban-hang')
      const list=Array.isArray(newData)?newData:[]
      setForm(makeEmptyForm(list))
      setRows(emptyRows())
      load()
      setTab('list')
    } else showAlert('Lỗi: '+(r?.message||'Tạo PBH thất bại'),'danger')
  }

  const total=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}

    {/* Modal xem chi tiết */}
    <DetailModal
      open={detailModal}
      onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`🏪 Chi Tiết Phiếu Bán Hàng - ${detail?.SoCT||''}`}
      detail={detail}
      loading={detailLoading}
      products={products}
      customers={customers}
      suppliers={[]}/>

    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]}
      active={tab}
      onChange={t=>{
        setTab(t)
        if(t==='create'){setForm(makeEmptyForm(data));setRows(emptyRows())}
      }}/>

    {/* ── DANH SÁCH ── */}
    {tab==='list'&&<Card>
      <CH>
        <h3 className="font-bold">🏪 Danh Sách Phiếu Bán Hàng</h3>
        <div className="ml-auto flex gap-2">
          <Btn v="pdf" size="sm">⬇ PDF</Btn>
          <Btn v="excel" size="sm">⬇ Excel</Btn>
        </div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">
        💡 Click vào Số CT để xem chi tiết phiếu
      </p>
      <Tbl data={data} loading={loading} empty="Chưa có phiếu bán hàng" cols={[
        {k:'SoCT',l:'Số CT',w:'160px',fn:(v,r)=>(
          <button
            onClick={()=>openDetail(r)}
            className="text-blue-600 hover:underline font-mono text-xs font-semibold">
            {v||r.so_phieu||'-'}
          </button>
        )},
        {k:'NgayCT',l:'Ngày CT',w:'100px',fn:(v,r)=>fmtDate(v||r.ngay_phieu)},
        {k:'MaKH',l:'Khách Hàng',fn:(v,r)=>{
          const id=v??r.customer_id??r.MaKH
          return <span className="font-medium">{getKHLabel(id)}</span>
        }},
        {k:'TongTien',l:'Tổng TT',w:'130px',r:true,
          fn:(v,r)=><span className="font-semibold text-green-700">{fmt(v||r.TongTien||0)}</span>
        },
        {k:'TrangThai',l:'TT',w:'90px',
          fn:(v,r)=><Badge v={v==='POSTED'?'success':'warning'}>{v||r.trang_thai||'DRAFT'}</Badge>
        },
      ]}/>
    </Card>}

    {/* ── TẠO MỚI ── */}
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">🏪 Tạo Phiếu Bán Hàng</h3></CH>
      <CB>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Inp label="Số CT" req value={form.SoCT} onChange={sf('SoCT')} hint="Tự sinh, có thể sửa"/>
          <Inp label="Ngày CT" req type="date" value={form.NgayCT} onChange={sf('NgayCT')}/>
          <Sel label="Kỳ Kế Toán" req value={form.MaKyKeToan} onChange={sf('MaKyKeToan')} options={kyOptions}/>
          <div className="col-span-2">
            <Sel label="Khách Hàng" req value={form.MaKH} onChange={sf('MaKH')}
              options={customers.map(c=>({value:c.id,label:`${c.TenKH||c.name} (${c.MaKH||c.code})`}))}/>
          </div>
          <Sel label="Hình Thức TT" value={form.HinhThucTT} onChange={sf('HinhThucTT')}
            options={['Tiền mặt','Chuyển khoản','Thẻ']}/>

          {/* Số Seri - dropdown nếu có mẫu HĐ, không thì nhập tay */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-600">Ký Hiệu Mẫu HĐ (Số Seri)</label>
            {invoiceTemplates.length>0
              ?<select value={form.SoSeri} onChange={onSelectTemplate}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Chọn mẫu HĐ --</option>
                  {invoiceTemplates.map(t=>(
                    <option key={t.code} value={t.code}>
                      {t.code} - {t.name} {t.ky_hieu?`(${t.ky_hieu})`:''}
                    </option>
                  ))}
                </select>
              :<input value={form.SoSeri} onChange={sf('SoSeri')}
                  placeholder="VD: 1C22TAA (nhập tay)"
                  className="px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"/>
            }
            {!invoiceTemplates.length&&(
              <span className="text-xs text-orange-500">
                ⚠️ Vào <b>Danh Mục → Mẫu Hóa Đơn</b> để khai báo
              </span>
            )}
          </div>

          <Inp label="Ký Hiệu HĐ" value={form.KyHieuHD} onChange={sf('KyHieuHD')} placeholder="VD: AA/24E"/>
          <Inp label="Số HĐ" value={form.SoHD} onChange={sf('SoHD')} placeholder="Số thứ tự HĐ"/>
          <Inp label="Ngày HĐ" type="date" value={form.NgayHD} onChange={sf('NgayHD')}/>
          <Inp label="Người Giao Dịch" value={form.NguoiGD} onChange={sf('NguoiGD')}/>
          <div className="col-span-3">
            <Inp label="Diễn Giải" value={form.DienGiai} onChange={sf('DienGiai')}/>
          </div>
        </div>

        <p className="text-xs font-bold text-gray-600 mb-2">Danh Sách Hàng Hóa:</p>
        <DetailTbl rows={rows} setRows={setRows} products={products} color="green"/>

        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
          <span className="text-sm font-semibold text-green-800">Tổng Thanh Toán:</span>
          <span className="text-xl font-bold text-green-700 font-mono">{fmt(total)}</span>
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
const DetailModal=({open,onClose,title,detail,loading,products=[],customers=[],suppliers=[]})=>{
  if(!open) return null

  const getProductName=(id)=>{
    if(!id) return '-'
    const p=(products||[]).find(x=>String(x.id)===String(id))
    return p?`${p.MaHH||p.code||''} - ${p.TenHH||p.name||''}`:`SP #${id}`
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
            {/* Khách hàng - phiếu thu, bán hàng, bán lẻ */}
            {(detail.MaKH!==undefined||detail.KhachHang!==undefined)&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Khách Hàng:</span>
                <strong>{detail.KhachHang||getKHName(detail.MaKH)}</strong>
              </div>
            )}
            {/* Nhà cung cấp - phiếu chi, nhập mua */}
            {detail.MaNCC!==undefined&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Nhà CC:</span>
                <strong>{getNCCName(detail.MaNCC)}</strong>
              </div>
            )}
            {/* Tiền thu */}
            {detail.TienThu!==undefined&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Số Tiền Thu:</span>
                <strong className="text-green-700 font-mono">{fmt(detail.TienThu)}</strong>
              </div>
            )}
            {/* Tiền chi */}
            {detail.TienChi!==undefined&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Số Tiền Chi:</span>
                <strong className="text-red-700 font-mono">{fmt(detail.TienChi)}</strong>
              </div>
            )}
            {/* TTG */}
            {detail.so_tien_thu!==undefined&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Số Tiền Thu:</span>
                <strong className="text-green-700 font-mono">{fmt(detail.so_tien_thu)}</strong>
              </div>
            )}
            {/* CTG */}
            {detail.so_tien_chi!==undefined&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Số Tiền Chi:</span>
                <strong className="text-red-700 font-mono">{fmt(detail.so_tien_chi)}</strong>
              </div>
            )}
            {detail.HinhThucTT&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Hình Thức TT:</span>
                <strong>{detail.HinhThucTT}</strong>
              </div>
            )}
            {detail.loai_giao_dich&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Loại GD:</span>
                <strong>{detail.loai_giao_dich}</strong>
              </div>
            )}
            {detail.SoHD&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Số HĐ:</span>
                <strong>{detail.SoHD}</strong>
              </div>
            )}
            {(detail.DienGiai||detail.noi_dung)&&(
              <div className="flex gap-2 col-span-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Diễn Giải:</span>
                <strong>{detail.DienGiai||detail.noi_dung}</strong>
              </div>
            )}
            <div className="flex gap-2">
              <span className="text-gray-500 w-28 flex-shrink-0">Trạng Thái:</span>
              <Badge v={(detail.TrangThai||detail.trang_thai)==='POSTED'?'success':'warning'}>
                {detail.TrangThai||detail.trang_thai||'DRAFT'}
              </Badge>
            </div>
            {detail.TongTien&&(
              <div className="flex gap-2">
                <span className="text-gray-500 w-28 flex-shrink-0">Tổng Tiền:</span>
                <strong className="text-red-blue font-mono">{fmt(detail.TongTien)}</strong>
              </div>
            )}
          </div>

          {/* Chi tiết hàng hóa */}
          {items.length>0&&(
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2">📦 Chi Tiết Hàng Hóa:</p>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600 w-10">STT</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-gray-600">Hàng Hóa</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-16">SL</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-28">Đơn Giá</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-600 w-28">Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item,i)=>(
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-center text-gray-400 text-xs">{i+1}</td>
                        <td className="px-3 py-2">{getProductName(item.product_id)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{fmtN(item.quantity)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{fmtN(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-blue-700">
                          {fmtN(item.total||(item.quantity*item.unit_price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={4} className="px-3 py-2.5 font-bold text-right text-sm">Tổng Cộng:</td>
                      <td className="px-3 py-2.5 text-right font-bold font-mono text-blue-700">
                        {fmt(total||detail.TongTien||0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Btn v="outline" onClick={onClose}>Đóng</Btn>
          </div>
        </>
      }
    </Modal>
  )
}
// PHIẾU BÁN LẺ
const RetailOrder=()=>{
  const [data,loading,load]=useList('/documents/phieu-ban-le')
  const [tab,setTab]=useState('list')
  const [products,setProducts]=useState([])
  const {options:kyOptions,defaultKy:kyDefault}=useKyKeToan()
  const [alert,showAlert,closeAlert]=useAlert()
  const [detail,setDetail]=useState(null)
  const [detailModal,setDetailModal]=useState(false)
  const [detailLoading,setDetailLoading]=useState(false)

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
  const makeEmptyForm=(list=[])=>({
    SoCT:makeNewSoCT(list),NgayCT:today(),MaKyKeToan:kyDefault,
    KhachHang:'',DienGiai:'',SoHD:'',KyHieuHD:'',TrangThaiHDDT:'CHUA_PH'
  })
  const emptyRows=()=>[{product_id:'',quantity:1,unit_price:0}]

  const [form,setForm]=useState(()=>makeEmptyForm())
  const [rows,setRows]=useState(emptyRows())
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))

  useEffect(()=>{
    api('GET','/products').then(d=>setProducts(Array.isArray(d)?d:[]))
  },[])

  useEffect(()=>{
    if(!loading&&tab==='list') setForm(f=>({...f,SoCT:makeNewSoCT(data)}))
  },[data,loading])

  const openDetail=async(row)=>{
    setDetailModal(true)
    setDetailLoading(true)
    setDetail(null)
    const r=await api('GET',`/documents/phieu-ban-le/${row.id}`)
    setDetail(r&&!r.__error?r:{...row,items:[]})
    setDetailLoading(false)
  }

  const save=async()=>{
    if(!form.SoCT){showAlert('Vui lòng nhập Số CT!','danger');return}
    const validRows=rows.filter(r=>r.product_id&&+r.quantity>0)
    if(!validRows.length){showAlert('Vui lòng thêm ít nhất 1 dòng hàng!','danger');return}
    const body={
      SoCT:form.SoCT,NgayCT:form.NgayCT,KhachHang:form.KhachHang,
      DienGiai:form.DienGiai,MaKyKeToan:+form.MaKyKeToan,
      DanhSachHang:validRows.map(r=>({MaHH:+r.product_id,SoLuong:+r.quantity,DonGia:+r.unit_price}))
    }
    const r=await api('POST','/documents/phieu-ban-le',body)
    if(r&&!r.__error){
      showAlert(`Tạo BL ${form.SoCT} thành công!`)
      const newData=await api('GET','/documents/phieu-ban-le')
      const list=Array.isArray(newData)?newData:[]
      setForm(makeEmptyForm(list))
      setRows(emptyRows())
      load()
      setTab('list')
    } else showAlert('Lỗi: '+(r?.message||'Tạo thất bại'),'danger')
  }

  const total=rows.reduce((s,r)=>s+(+r.quantity)*(+r.unit_price),0)

  return(<div className="space-y-4">
    {alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <DetailModal open={detailModal} onClose={()=>{setDetailModal(false);setDetail(null)}}
      title={`🛍️ Chi Tiết Phiếu Bán Lẻ - ${detail?.SoCT||''}`}
      detail={detail} loading={detailLoading} products={products} customers={[]} suppliers={[]}/>
    <Tabs tabs={[{id:'list',label:'📋 Danh Sách'},{id:'create',label:'+ Tạo Mới'}]} active={tab}
      onChange={t=>{setTab(t);if(t==='create'){setForm(makeEmptyForm(data));setRows(emptyRows())}}}/>
    {tab==='list'&&<Card>
      <CH><h3 className="font-bold">🛍️ Danh Sách Phiếu Bán Lẻ</h3>
        <div className="ml-auto flex gap-2"><Btn v="pdf" size="sm">⬇ PDF</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div>
      </CH>
      <p className="px-4 py-1.5 text-xs text-blue-600 bg-blue-50 border-b border-blue-100">💡 Click vào Số CT để xem chi tiết</p>
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
    {tab==='create'&&<Card>
      <CH><h3 className="font-bold">🛍️ Tạo Phiếu Bán Lẻ</h3></CH>
      <CB>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Inp label="Số CT" req value={form.SoCT} onChange={sf('SoCT')} hint="Tự sinh, có thể sửa"/>
          <Inp label="Ngày CT" req type="date" value={form.NgayCT} onChange={sf('NgayCT')}/>
          <Sel label="Kỳ Kế Toán" req value={form.MaKyKeToan} onChange={sf('MaKyKeToan')} options={kyOptions}/>
          <Sel label="TT HĐĐT" value={form.TrangThaiHDDT} onChange={sf('TrangThaiHDDT')}
            options={[{value:'CHUA_PH',label:'Chưa phát hành'},{value:'DA_PH',label:'Đã phát hành'}]}/>
          <Inp label="Ký Hiệu HĐ" value={form.KyHieuHD} onChange={sf('KyHieuHD')} placeholder="VD: AA/24E"/>
          <Inp label="Số HĐ" value={form.SoHD} onChange={sf('SoHD')} placeholder="Số thứ tự HĐ"/>
          <div className="col-span-2">
            <Inp label="Khách Hàng" value={form.KhachHang} onChange={sf('KhachHang')} placeholder="Tên khách (không bắt buộc)"/>
          </div>
          <div className="col-span-3"><Inp label="Diễn Giải" value={form.DienGiai} onChange={sf('DienGiai')}/></div>
        </div>
        <p className="text-xs font-bold text-gray-600 mb-2">Danh Sách Hàng Hóa:</p>
        <DetailTbl rows={rows} setRows={setRows} products={products} color="yellow"/>
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
const HTK=()=>{
  const [form,setForm]=useState({period_from:'2026-04-01',period_to:'2026-04-30',valuation_method:'AVG',group_by:'product'})
  const [result,setResult]=useState(null); const [loading,setLoading]=useState(false)
  const [tab2,setTab2]=useState('result'); const [alert,showAlert,closeAlert]=useAlert()
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}))
  const calc=async()=>{ setLoading(true); const r=await api('POST','/inventory/tinh-gia-htk',form); if(r){setResult(r);showAlert(`Tính giá HTK ${form.valuation_method} thành công!`)}else showAlert('Lỗi tính giá HTK!','danger'); setLoading(false) }
  return(<div className="space-y-4">{alert&&<Alert msg={alert.msg} type={alert.type} onClose={closeAlert}/>}
    <Card><CH><h3 className="font-bold">⚖️ Tính Giá Tồn Kho</h3></CH>
      <CB><div className="grid grid-cols-4 gap-3">
        <Sel label="Cách Tính" req value={form.valuation_method} onChange={sf('valuation_method')} options={[{value:'AVG',label:'AVG - Bình quân'},{value:'FIFO',label:'FIFO - Nhập trước xuất trước'}]}/>
        <Inp label="Từ Tháng" req type="date" value={form.period_from} onChange={sf('period_from')}/>
        <Inp label="Đến Tháng" req type="date" value={form.period_to} onChange={sf('period_to')}/>
        <div className="flex items-end"><Btn onClick={calc} disabled={loading} className="w-full justify-center">⚡ {loading?'Đang tính...':'Tính Giá HTK'}</Btn></div>
      </div></CB>
    </Card>
    {result&&(<div>
      <Tabs tabs={[{id:'result',label:'📊 Kết Quả'},{id:'report',label:'📄 Xuất BC'}]} active={tab2} onChange={setTab2}/>
      {tab2==='result'&&<Card><CH><h3 className="font-bold">📊 Bảng Tính Giá HTK - {form.valuation_method}</h3>
        <div className="ml-auto flex gap-2"><Btn v="pdf" size="sm">⬇ PDF</Btn><Btn v="excel" size="sm">⬇ Excel</Btn></div></CH>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase" rowSpan={2}>Mã SP</th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase" rowSpan={2}>Tên SP</th>
              <th className="px-3 py-2 text-center text-xs font-bold text-blue-700 bg-blue-50 uppercase" colSpan={2}>Đầu Kỳ</th>
              <th className="px-3 py-2 text-center text-xs font-bold text-green-700 bg-green-50 uppercase" colSpan={2}>Nhập</th>
              <th className="px-3 py-2 text-center text-xs font-bold text-red-700 bg-red-50 uppercase" colSpan={2}>Xuất</th>
              <th className="px-3 py-2 text-center text-xs font-bold text-yellow-700 bg-yellow-50 uppercase" colSpan={2}>Cuối Kỳ</th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase" rowSpan={2}>Đơn Giá</th>
            </tr>
            <tr>
              {['SL','GT','SL','GT','SL','GT','SL','GT'].map((h,i)=>(
                <th key={i} className={`px-3 py-1 text-xs font-semibold text-right ${i<2?'bg-blue-50 text-blue-600':i<4?'bg-green-50 text-green-600':i<6?'bg-red-50 text-red-600':'bg-yellow-50 text-yellow-600'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(result.details||[]).map((d,i)=>(
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2"><Code v={d.product_code}/></td><td className="px-3 py-2 font-medium">{d.product_name}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{d.opening_qty}</td><td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.opening_value)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{d.import_qty}</td><td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.import_value)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{d.export_qty}</td><td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.export_value)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs font-bold">{d.closing_qty}</td><td className="px-3 py-2 text-right font-mono text-xs font-bold text-blue-700">{fmtN(d.closing_value)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{fmtN(d.unit_price)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </Card>}
      {tab2==='report'&&<Card><CH><h3 className="font-bold">📄 Xuất BC HTK</h3><div className="ml-auto flex gap-2"><Btn v="pdf">⬇ PDF</Btn><Btn v="excel">⬇ Excel</Btn></div></CH><CB><Alert msg="ℹ️ Tính giá HTK trước khi xuất." type="info"/></CB></Card>}
    </div>)}
  </div>)
}

const PayrollPage=()=>{
  const [data,loading]=useList('/payroll')
  return(<Card><CH><h3 className="font-bold">👥 Chứng Từ Thanh Toán Lương</h3><div className="ml-auto flex gap-2"><Btn size="sm">+ Tạo CTL</Btn><Btn v="excel" size="sm">⬇ Bảng Lương</Btn></div></CH>
    <Tbl data={data} loading={loading} empty="Chưa có chứng từ lương" cols={[
      {k:'so_chung_tu',l:'Số CT',w:'130px',fn:v=><Code v={v}/>},{k:'ngay_chung_tu',l:'Ngày',w:'100px',fn:v=>fmtDate(v)},
      {k:'tong_thu_nhap',l:'Tổng Thu Nhập',r:true,fn:v=>fmt(v)},{k:'tong_giam_tru',l:'Tổng Giảm Trừ',r:true,fn:v=><span className="text-red-600">{fmt(v)}</span>},
      {k:'tong_thuc_lanh',l:'Thực Lãnh',r:true,fn:v=><span className="text-green-700 font-bold">{fmt(v)}</span>},{k:'trang_thai',l:'TT',w:'90px',fn:v=><Badge v="warning">{v||'DRAFT'}</Badge>},
    ]}/>
  </Card>)
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
    Promise.all([
      api('GET','/warehouses'),
      api('GET','/products'),
      api('GET','/stock-summary?period_id=1'),
    ]).then(([w,p,s])=>{
      setWarehouses(Array.isArray(w)?w:[])
      setProducts(Array.isArray(p)?p:[])
      if(Array.isArray(s)&&s.length>0) setRows(s.map(item=>mapRow(item,w,p)))
      setLoading(false)
    })
  },[])

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
      product_id:+editForm.product_id, warehouse_id:+editForm.warehouse_id, period_id:1,
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
      const body={product_id:+r.product_id,warehouse_id:+r.warehouse_id,period_id:1,
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
        api('GET','/stock-summary?period_id=1'),
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
      case 'nv-pnm': return <PurchaseInvoice/>
      case 'nv-pbh': return <SalesOrder/>
      case 'nv-bl': return <RetailOrder/>
      case 'nv-pnk': return <WarehouseReceiptPage/>
      case 'nv-pxk': return <WarehouseIssuePage/>
      case 'nv-htk': return <HTKFixed/>
      case 'nv-payroll': return <PayrollPageFixed/>
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
    <Sidebar page={page} onNav={setPage}/>
    <Topbar page={page}/>
    <main className="ml-[260px] mt-[52px] p-5 min-h-[calc(100vh-52px)]">
      <div key={page} style={{animation:'fadeIn 0.15s ease-out'}}>{render()}</div>
    </main>
    <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
  </div>)
}
export default App