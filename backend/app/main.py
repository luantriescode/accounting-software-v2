from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

# Import routers
from app.modules.catalog.routes import router as catalog_router
from app.modules.documents.routes import router as documents_router
from app.modules.warehouse.routes import router as warehouse_router
from app.modules.payroll.routes import router as payroll_router
from app.modules.inventory.routes import router as inventory_router
from app.modules.banking.routes import router as banking_router

app = FastAPI(
    title="Phần Mềm Kế Toán - Hộ Kinh Doanh",
    description="API cho phần mềm kế toán hộ kinh doanh",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── HANDLERS ──

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append({"field": field, "message": error["msg"]})
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Dữ liệu không hợp lệ", "errors": errors}
    )

@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """Bắt lỗi FK violation, Unique constraint từ DB → trả 400 thay vì 500"""
    msg = str(exc.orig)
    if "ForeignKeyViolation" in msg or "foreign key" in msg.lower():
        detail = "Dữ liệu tham chiếu không tồn tại (kỳ kế toán, khách hàng, kho... không hợp lệ)"
    elif "UniqueViolation" in msg or "unique" in msg.lower():
        detail = "Dữ liệu đã tồn tại (trùng mã hoặc số chứng từ)"
    elif "NotNullViolation" in msg or "not-null" in msg.lower():
        detail = "Thiếu dữ liệu bắt buộc"
    else:
        detail = "Lỗi dữ liệu: " + msg[:200]
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": detail}
    )

# ── ROUTERS ──
app.include_router(catalog_router)
app.include_router(documents_router)
app.include_router(warehouse_router)
app.include_router(payroll_router)
app.include_router(inventory_router)
app.include_router(banking_router)

@app.get("/")
async def root():
    return {"message": "Phần Mềm Kế Toán - Hộ Kinh Doanh V2.0", "version": "2.0.0", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.0.0"}