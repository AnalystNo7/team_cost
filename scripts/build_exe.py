"""
Build standalone executable for Windows using PyInstaller
This script packages the backend as an executable with embedded server
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path


def build_backend_exe():
    """Build backend executable with PyInstaller"""
    print("Building backend executable...")

    backend_dir = Path(__file__).parent.parent / "backend"
    dist_dir = Path(__file__).parent.parent / "dist"

    # Install PyInstaller if needed
    subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)

    # Create spec file content
    spec_content = '''
# -*- mode: python ; coding: utf-8 -*-
import sys
sys.setrecursionlimit(5000)

a = Analysis(
    ['app/main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='TeamCostServer',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
'''

    spec_file = backend_dir / "TeamCostServer.spec"
    spec_file.write_text(spec_content)

    # Run PyInstaller
    subprocess.run(
        ["pyinstaller", "--clean", str(spec_file)],
        cwd=backend_dir,
        check=True
    )

    print(f"Backend executable built: {backend_dir / 'dist' / 'TeamCostServer.exe'}")


def build_frontend():
    """Build frontend for production"""
    print("Building frontend...")

    frontend_dir = Path(__file__).parent.parent / "frontend"

    subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
    subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)

    print(f"Frontend built: {frontend_dir / 'dist'}")


def create_installer_package():
    """Create installer package with all components"""
    print("Creating installer package...")

    project_dir = Path(__file__).parent.parent
    package_dir = project_dir / "installer" / "TeamCostCalculator"

    # Clean and create package directory
    if package_dir.exists():
        shutil.rmtree(package_dir)
    package_dir.mkdir(parents=True)

    # Copy backend executable
    backend_exe = project_dir / "backend" / "dist" / "TeamCostServer.exe"
    if backend_exe.exists():
        shutil.copy(backend_exe, package_dir)

    # Copy frontend build
    frontend_dist = project_dir / "frontend" / "dist"
    if frontend_dist.exists():
        shutil.copytree(frontend_dist, package_dir / "www")

    # Create launcher script
    launcher_content = '''@echo off
REM Team Cost Calculator Launcher

echo Starting Team Cost Calculator...

REM Start backend server
start /B TeamCostServer.exe

REM Wait for server to start
timeout /t 3 /nobreak > nul

REM Open browser
start http://localhost:8000

echo.
echo Application is running at http://localhost:8000
echo Press any key to stop the server...
pause > nul

REM Kill the server
taskkill /F /IM TeamCostServer.exe > nul 2>&1
'''

    launcher_file = package_dir / "TeamCostCalculator.bat"
    launcher_file.write_text(launcher_content)

    # Create README
    readme_content = '''Team Cost Calculator
====================

Калькулятор расчёта стоимости проектной команды

Запуск:
1. Запустите TeamCostCalculator.bat
2. Приложение откроется в браузере по адресу http://localhost:8000

Системные требования:
- Windows 10 или выше
- 4 GB RAM
- 500 MB свободного места на диске

Данные хранятся в файле data/team_cost.db
'''

    readme_file = package_dir / "README.txt"
    readme_file.write_text(readme_content, encoding='utf-8')

    # Create data directory
    (package_dir / "data").mkdir()

    print(f"Installer package created: {package_dir}")


def main():
    """Main build process"""
    print("=" * 50)
    print("Team Cost Calculator - Build Script")
    print("=" * 50)

    try:
        build_frontend()
        build_backend_exe()
        create_installer_package()

        print("")
        print("=" * 50)
        print("Build completed successfully!")
        print("Installer package: installer/TeamCostCalculator/")
        print("=" * 50)

    except subprocess.CalledProcessError as e:
        print(f"Build failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
