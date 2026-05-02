REM Copy files to frontend folder
REM Run this in F:\Project\HoKinhDoanh\accounting-software-v2\frontend\

setlocal enabledelayedexpansion

REM Copy root files
copy /Y "vite.config.js" .
copy /Y "tailwind.config.js" .
copy /Y "postcss.config.js" .
copy /Y "package.json" .
copy /Y "index.html" .

REM Create directories if not exist
if not exist "src\api" mkdir src\api
if not exist "src\store" mkdir src\store
if not exist "src\utils" mkdir src\utils
if not exist "src\styles" mkdir src\styles
if not exist "src\components\layout" mkdir src\components\layout
if not exist "src\components\ui" mkdir src\components\ui
if not exist "src\components\form" mkdir src\components\form
if not exist "src\components\table" mkdir src\components\table
if not exist "src\pages" mkdir src\pages

REM Copy API
copy /Y "src_api_client.js" "src\api\client.js"

REM Copy Store
copy /Y "src_store_appStore.js" "src\store\appStore.js"

REM Copy Utils
copy /Y "src_utils_helpers.js" "src\utils\helpers.js"

REM Copy Components - Layout
copy /Y "src_components_layout_Sidebar.jsx" "src\components\layout\Sidebar.jsx"
copy /Y "src_components_layout_Topbar.jsx" "src\components\layout\Topbar.jsx"
copy /Y "src_components_layout_Layout.jsx" "src\components\layout\Layout.jsx"

REM Copy Components - UI, Form, Table
copy /Y "src_components_ui_index.jsx" "src\components\ui\index.jsx"
copy /Y "src_components_form_index.jsx" "src\components\form\index.jsx"
copy /Y "src_components_table_index.jsx" "src\components\table\index.jsx"

REM Copy Pages
copy /Y "src_pages_Dashboard.jsx" "src\pages\Dashboard.jsx"

REM Copy App & Main & Styles
copy /Y "src_App.jsx" "src\App.jsx"
copy /Y "src_main.jsx" "src\main.jsx"
copy /Y "src_styles_globals.css" "src\styles\globals.css"

echo.
echo ===== COPY COMPLETE =====
echo All files copied successfully!
echo.
echo Next step: npm install
pause
