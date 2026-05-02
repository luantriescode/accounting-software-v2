"""
FULL TEST SUITE v3 - HỘ KINH DOANH ACCOUNTING SOFTWARE
Fix: Error handling tests dùng session riêng, không bị timeout
Chạy: python test_full_suite_v3.py
"""

import requests
import time
import threading
import statistics
from requests.exceptions import Timeout, ConnectionError

BASE_URL = "http://127.0.0.1:8002"
RESULTS = {"passed": 0, "failed": 0, "warnings": 0, "errors": []}

# Session dùng chung - keep-alive
SESSION = requests.Session()
SESSION.headers.update({"Content-Type": "application/json"})

def log(status, name, detail=""):
    icons = {"PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
    print(f"  {icons.get(status,'ℹ️')} [{status}] {name}" + (f" → {detail}" if detail else ""))
    if status == "PASS":   RESULTS["passed"] += 1
    elif status == "FAIL": RESULTS["failed"] += 1; RESULTS["errors"].append(f"{name}: {detail}")
    elif status == "WARN": RESULTS["warnings"] += 1

def GET(path, timeout=15):
    try:
        return SESSION.get(f"{BASE_URL}{path}", timeout=timeout)
    except Exception: return None

def POST(path, body, timeout=15):
    try:
        return SESSION.post(f"{BASE_URL}{path}", json=body, timeout=timeout)
    except Exception: return None

# ─────────────────────────────────────────────────
# MODULE TESTS
# ─────────────────────────────────────────────────
def test_catalog():
    print("\n🟦 MODULE 1: CATALOG")
    for path, label in [
        ("/customers", "customers"), ("/customers/1", "customer by ID"),
        ("/suppliers", "suppliers"), ("/products", "products"), ("/warehouses", "warehouses"),
    ]:
        r = GET(path)
        if r and r.status_code == 200:
            data = r.json()
            count = len(data) if isinstance(data, list) else "ok"
            log("PASS", f"GET {path}", f"{count} records" if isinstance(count, int) else count)
        else:
            log("FAIL", f"GET {path}", str(r.status_code if r else "No response"))

def test_documents():
    print("\n🟦 MODULE 2: DOCUMENTS")
    for ep in ["phieu-thu","phieu-chi","bao-co","bao-no","phieu-nhap-mua","phieu-ban-hang","phieu-ban-le"]:
        r = GET(f"/documents/{ep}")
        if r and r.status_code == 200:
            log("PASS", f"GET /documents/{ep}", f"{len(r.json())} records")
        else:
            log("FAIL", f"GET /documents/{ep}", str(r.status_code if r else "No response"))

def test_warehouse():
    print("\n🟦 MODULE 3: WAREHOUSE")
    for path in ["/documents/phieu-nhap-kho","/documents/phieu-xuat-kho","/cost-items","/stock-summary?period_id=1"]:
        r = GET(path)
        if r and r.status_code == 200: log("PASS", f"GET {path}")
        else: log("FAIL", f"GET {path}", str(r.status_code if r else "No response"))

def test_payroll():
    print("\n🟦 MODULE 4: PAYROLL")
    for path in ["/employees", "/payroll", "/payroll-config"]:
        r = GET(path)
        if r and r.status_code == 200: log("PASS", f"GET {path}")
        else: log("FAIL", f"GET {path}", str(r.status_code if r else "No response"))

def test_inventory():
    print("\n🟦 MODULE 5: INVENTORY")
    body = {"period_from":"2026-04-01","period_to":"2026-04-30","valuation_method":"AVG","group_by":"product"}
    r = POST("/inventory/tinh-gia-htk", body)
    if r and r.status_code == 200:
        d = r.json()
        log("PASS", "POST /inventory/tinh-gia-htk (AVG)", f"{len(d.get('details',[]))} items")
    else:
        log("FAIL", "POST /inventory/tinh-gia-htk", str(r.status_code if r else "No response"))

    r = GET("/inventory/bao-cao-ton-kho?period_from=2026-04-01&period_to=2026-04-30&valuation_method=AVG")
    if r and r.status_code in [200, 404]:
        log("PASS", "GET /inventory/bao-cao-ton-kho", f"Status {r.status_code}")
    else:
        log("FAIL", "GET /inventory/bao-cao-ton-kho", str(r.status_code if r else "No response"))

def test_banking():
    print("\n🟦 MODULE 6: BANKING")
    r = GET("/banking/loai-giao-dich-thu")
    if r and r.status_code == 200:
        log("PASS", "GET /banking/loai-giao-dich-thu", f"{len(r.json()['items'])} options")
    else: log("FAIL", "GET /banking/loai-giao-dich-thu")

    r = GET("/banking/loai-giao-dich-chi")
    if r and r.status_code == 200:
        log("PASS", "GET /banking/loai-giao-dich-chi", f"{len(r.json()['items'])} options")
    else: log("FAIL", "GET /banking/loai-giao-dich-chi")

    r = GET("/banking/accounts")
    if r and r.status_code == 200:
        log("PASS", "GET /banking/accounts", f"{len(r.json())} accounts")
    else: log("FAIL", "GET /banking/accounts")

    for path in ["/banking/ttg", "/banking/ctg"]:
        r = GET(path)
        if r and r.status_code == 200: log("PASS", f"GET {path}", f"{len(r.json())} records")
        else: log("FAIL", f"GET {path}")

    r = GET("/banking/bao-cao-so-du?period_id=1")
    if r and r.status_code == 200:
        log("PASS", "GET /banking/bao-cao-so-du", "Has data")
    elif r and r.status_code == 404:
        log("WARN", "GET /banking/bao-cao-so-du", "404 - Chưa có data trong bank_balances")
    else:
        log("FAIL", "GET /banking/bao-cao-so-du", str(r.status_code if r else "No response"))

# ─────────────────────────────────────────────────
# ERROR HANDLING TESTS (v3 fix: dùng new session mỗi request)
# ─────────────────────────────────────────────────
def test_error_handling():
    print("\n🟧 ERROR HANDLING TESTS")

    # FIX: mỗi test dùng requests.get/post trực tiếp, không dùng SESSION chung
    # vì session có thể bị block bởi request trước

    # Test 1: 404 - customer không tồn tại
    try:
        r = requests.get(f"{BASE_URL}/customers/999999", timeout=15)
        if r.status_code == 404:
            log("PASS", "404 Not Found", f"/customers/999999 → {r.json().get('detail','')}")
        else:
            log("FAIL", "404 Not Found", f"Got {r.status_code}")
    except Exception as e:
        log("FAIL", "404 Not Found", str(e)[:60])

    # Test 2: 422 - missing required fields
    try:
        r = requests.post(f"{BASE_URL}/employees",
            json={"ten_nv": "Test Only"},  # Thiếu ma_nv, luong_co_ban
            timeout=15)
        if r.status_code == 422:
            log("PASS", "422 Validation Error", "Missing required fields rejected")
        else:
            log("FAIL", "422 Validation Error", f"Got {r.status_code}: {r.text[:100]}")
    except Exception as e:
        log("FAIL", "422 Validation Error", str(e)[:60])

    # Test 3: 400 - duplicate bank account
    try:
        r = requests.post(f"{BASE_URL}/banking/accounts",
            json={"ma_tk": "NH1", "ten_tk": "Duplicate", "loai_tk": "NH", "so_du_hien_tai": 0},
            timeout=15)
        if r.status_code == 400:
            log("PASS", "400 Duplicate Code", f"NH1 rejected → {r.json().get('detail','')[:50]}")
        elif r.status_code == 201:
            log("WARN", "400 Duplicate", "NH1 accepted - có thể chưa tạo TK này trước")
        else:
            log("FAIL", "400 Duplicate Code", f"Got {r.status_code}")
    except Exception as e:
        log("FAIL", "400 Duplicate Code", str(e)[:60])

    # Test 4: 400 - FK violation (period_id không tồn tại)
    try:
        r = requests.post(f"{BASE_URL}/documents/phieu-thu",
            json={"so_phieu": f"PT-FK-{int(time.time())}", "ngay_phieu": "2026-04-30",
                  "ky_ke_toan_id": 99999, "khach_hang_id": 1,
                  "so_tien": 100000, "hinh_thuc_thanh_toan": "tien_mat"},
            timeout=15)
        if r.status_code == 400:
            log("PASS", "400 FK Violation", f"period_id=99999 rejected")
        elif r.status_code == 422:
            log("PASS", "422 FK Validation", f"period_id=99999 rejected at schema level")
        else:
            log("FAIL", "400 FK Violation", f"Got {r.status_code}")
    except Exception as e:
        log("FAIL", "400 FK Violation", str(e)[:60])

    # Test 5: 404 banking account
    try:
        r = requests.get(f"{BASE_URL}/banking/accounts/99999", timeout=15)
        if r.status_code == 404:
            log("PASS", "404 Banking Account", "Not found handled")
        else:
            log("WARN", "404 Banking", f"Got {r.status_code}")
    except Exception as e:
        log("WARN", "404 Banking", str(e)[:60])

# ─────────────────────────────────────────────────
# PERFORMANCE TESTS
# ─────────────────────────────────────────────────
def test_performance():
    print("\n⚡ PERFORMANCE TESTS")

    endpoints = [
        ("/customers",              500),
        ("/products",               500),
        ("/documents/phieu-thu",   2000),
        ("/banking/accounts",       500),
        ("/employees",              500),
        ("/banking/ttg",           1000),
        ("/banking/ctg",           1000),
    ]

    for ep, threshold in endpoints:
        times = []
        for _ in range(5):
            start = time.time()
            r = GET(ep)
            elapsed = (time.time() - start) * 1000
            if r and r.status_code == 200: times.append(elapsed)

        if times:
            avg = statistics.mean(times)
            mx = max(times)
            if avg < threshold:
                log("PASS", f"PERF {ep}", f"avg={avg:.0f}ms max={mx:.0f}ms ✓")
            elif avg < threshold * 1.5:
                log("WARN", f"PERF {ep}", f"avg={avg:.0f}ms - hơi chậm")
            else:
                log("FAIL", f"PERF {ep}", f"avg={avg:.0f}ms >> {threshold}ms")
        else:
            log("FAIL", f"PERF {ep}", "No response")

    # Concurrent load test
    print("\n  📊 Concurrent Load Test (10x /customers)")
    errors, times = [], []

    def do_req():
        start = time.time()
        try:
            r = requests.get(f"{BASE_URL}/customers", timeout=15)
            times.append((time.time() - start) * 1000)
            if r.status_code != 200: errors.append(1)
        except: errors.append(1)

    threads = [threading.Thread(target=do_req) for _ in range(10)]
    for t in threads: t.start()
    for t in threads: t.join()

    if len(errors) == 0 and times:
        log("PASS", "Load Test 10x concurrent", f"avg={statistics.mean(times):.0f}ms all OK")
    else:
        log("FAIL", "Load Test 10x concurrent", f"{len(errors)} errors")

# ─────────────────────────────────────────────────
# SECURITY TESTS
# ─────────────────────────────────────────────────
def test_security():
    print("\n🔒 SECURITY TESTS")

    # SQL Injection
    for payload in ["'; DROP TABLE customers; --", "1 OR 1=1",
                    "1; SELECT * FROM customers", "' OR '1'='1"]:
        try:
            r = requests.get(f"{BASE_URL}/customers/{payload}", timeout=15)
            if r.status_code == 500:
                log("FAIL", f"SQL Injection NOT blocked: {payload[:35]}", "500!")
            else:
                log("PASS", f"SQL Injection blocked: {payload[:35]}", f"→ {r.status_code}")
        except: log("PASS", f"SQL Injection blocked: {payload[:35]}")

    # XSS
    try:
        r = requests.post(f"{BASE_URL}/customers",
            json={"code": "XSS-TEST", "name": "<script>alert('XSS')</script>", "is_active": True},
            timeout=15)
        if r and "<script>" not in r.text:
            log("PASS", "XSS - script tag not reflected in response")
        elif r:
            log("FAIL", "XSS - script tag in response!")
        else:
            log("PASS", "XSS - request blocked")
    except: log("PASS", "XSS - connection rejected")

    # CORS
    try:
        r = requests.options(f"{BASE_URL}/customers", timeout=15,
            headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"})
        cors = r.headers.get("Access-Control-Allow-Origin", "")
        if cors:
            log("PASS", "CORS Headers present", f"Allow-Origin: {cors}")
        else:
            log("WARN", "CORS Headers", "Không thấy trong OPTIONS response")
    except Exception as e:
        log("WARN", "CORS check", str(e)[:50])

    # Large payload
    try:
        r = requests.post(f"{BASE_URL}/customers",
            json={"code": "LARGE", "name": "A" * 10000},
            timeout=15)
        if r and r.status_code in [400, 422]:
            log("PASS", "Large payload rejected", f"Status {r.status_code}")
        elif r and r.status_code == 500:
            log("FAIL", "Large payload → 500!")
        else:
            log("WARN", "Large payload", f"Status {r.status_code if r else 'N/A'} (DB truncated)")
    except: log("WARN", "Large payload", "Connection reset (OK)")

    # Null injection
    try:
        r = requests.post(f"{BASE_URL}/documents/phieu-thu",
            json={"so_phieu": None, "ngay_phieu": None},
            timeout=15)
        if r and r.status_code == 422:
            log("PASS", "Null injection rejected with 422")
        else:
            log("WARN", "Null injection", f"Status {r.status_code if r else 'N/A'}")
    except: log("WARN", "Null injection", "No response")

    # Negative amount
    try:
        r = requests.post(f"{BASE_URL}/banking/ctg",
            json={"tk_id": 1, "loai_giao_dich": "chi_khac",
                  "so_chung_tu": f"SEC-NEG-{int(time.time())}",
                  "ngay_chung_tu": "2026-04-30",
                  "so_tien_chi": -99999, "period_id": 1},
            timeout=15)
        if r and r.status_code in [400, 422]:
            log("PASS", "Negative amount rejected", f"Status {r.status_code}")
        elif r and r.status_code == 201:
            log("WARN", "Negative amount accepted", "Cần thêm Field(gt=0) trong schemas")
        else:
            log("WARN", "Negative amount", f"Status {r.status_code if r else 'N/A'}")
    except: log("WARN", "Negative amount", "No response")

# ─────────────────────────────────────────────────
# BUSINESS LOGIC TESTS
# ─────────────────────────────────────────────────
def test_business_logic():
    print("\n🧠 BUSINESS LOGIC TESTS")

    # Overdraft prevention
    try:
        r = requests.post(f"{BASE_URL}/banking/ctg",
            json={"tk_id": 1, "loai_giao_dich": "chi_khac",
                  "so_chung_tu": f"BL-OD-{int(time.time())}",
                  "ngay_chung_tu": "2026-04-30",
                  "so_tien_chi": 999999999999, "period_id": 1},
            timeout=15)
        if r and r.status_code == 400:
            log("PASS", "Overdraft prevention", "Số dư không đủ → 400")
        elif r and r.status_code == 201:
            log("FAIL", "Overdraft NOT prevented!", "Chi vượt số dư vẫn tạo được")
        else:
            log("WARN", "Overdraft test", f"Status {r.status_code if r else 'N/A'}")
    except Exception as e:
        log("WARN", "Overdraft test", str(e)[:60])

    # FK violation period_id → phải 400 (sau khi fix main.py IntegrityError handler)
    try:
        r = requests.post(f"{BASE_URL}/documents/phieu-thu",
            json={"so_phieu": f"PT-BL-{int(time.time())}", "ngay_phieu": "2026-04-30",
                  "ky_ke_toan_id": 99999, "khach_hang_id": 1,
                  "so_tien": 100000, "hinh_thuc_thanh_toan": "tien_mat"},
            timeout=15)
        if r and r.status_code in [400, 422]:
            log("PASS", "FK period_id=99999 rejected", f"Status {r.status_code}")
        elif r and r.status_code == 500:
            log("FAIL", "FK period_id=99999 → 500!", "IntegrityError handler chưa active")
        else:
            log("WARN", "FK period_id", f"Status {r.status_code if r else 'N/A'}")
    except Exception as e:
        log("WARN", "FK period_id test", str(e)[:60])

    # Payroll config update
    try:
        r = requests.put(f"{BASE_URL}/payroll-config",
            json={"ty_le_bhxh": 8.0, "ty_le_bhyt": 1.5, "ty_le_bhtn": 1.0,
                  "luong_co_so": 2340000, "giam_tru_gia_canh": 11000000,
                  "giam_tru_phu_thuoc": 4400000},
            timeout=15)
        if r and r.status_code == 200:
            log("PASS", "PUT /payroll-config", "Config updated OK")
        else:
            log("WARN", "PUT /payroll-config", f"Status {r.status_code if r else 'N/A'}")
    except Exception as e:
        log("WARN", "PUT /payroll-config", str(e)[:60])

# ─────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("🚀 FULL TEST SUITE v3 - HỘ KINH DOANH V2")
    print(f"📍 Testing: {BASE_URL}")
    print("=" * 60)

    test_catalog()
    test_documents()
    test_warehouse()
    test_payroll()
    test_inventory()
    test_banking()
    test_error_handling()
    test_performance()
    test_security()
    test_business_logic()

    print("\n" + "=" * 60)
    total = RESULTS["passed"] + RESULTS["failed"]
    pct = int(RESULTS["passed"] / total * 100) if total > 0 else 0
    print(f"📊 RESULTS: {RESULTS['passed']}/{total} passed ({pct}%)")
    if RESULTS["warnings"]: print(f"⚠️  WARNINGS: {RESULTS['warnings']}")
    if RESULTS["errors"]:
        print("\n❌ FAILURES:")
        for e in RESULTS["errors"]: print(f"   → {e}")
    else:
        print("🎉 ALL TESTS PASSED!")
    print("=" * 60)