#!/usr/bin/env python3
"""
PostureGuard Production Readiness Check
Bu script projenin production'a hazır olup olmadığını kontrol eder.
"""

import os
import re
import glob

def check_localhost_references():
    """Localhost referanslarını kontrol eder"""
    print("🔍 Checking for localhost references...")
    
    localhost_patterns = [
        r'localhost',
        r'127\.0\.0\.1',
        r'http://localhost',
        r'ws://localhost'
    ]
    
    files_to_check = [
        'frontend/src/**/*.js',
        'frontend/src/**/*.jsx',
        '*.py',
        'routers/*.py'
    ]
    
    found_localhost = False
    
    for pattern in files_to_check:
        for file_path in glob.glob(pattern, recursive=True):
            if os.path.isfile(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        for localhost_pattern in localhost_patterns:
                            if re.search(localhost_pattern, content, re.IGNORECASE):
                                print(f"⚠️  Found localhost reference in: {file_path}")
                                found_localhost = True
                except Exception as e:
                    print(f"❌ Error reading {file_path}: {e}")
    
    if not found_localhost:
        print("✅ No localhost references found!")
    else:
        print("❌ Localhost references found - please fix before production!")
    
    return not found_localhost

def check_environment_variables():
    """Environment variables kontrol eder"""
    print("\n🔧 Checking environment variables...")
    
    required_vars = [
        'REACT_APP_API_URL',
        'REACT_APP_WEBSOCKET_URL'
    ]
    
    missing_vars = []
    
    # Check if .env.production exists
    env_prod_path = 'frontend/.env.production'
    if os.path.exists(env_prod_path):
        print(f"✅ Found {env_prod_path}")
        with open(env_prod_path, 'r') as f:
            content = f.read()
            for var in required_vars:
                if var in content:
                    print(f"✅ {var} is set")
                else:
                    print(f"❌ {var} is missing")
                    missing_vars.append(var)
    else:
        print(f"❌ {env_prod_path} not found")
        missing_vars.extend(required_vars)
    
    return len(missing_vars) == 0

def check_production_files():
    """Production dosyalarını kontrol eder"""
    print("\n📁 Checking production files...")
    
    required_files = [
        'deploy_production.sh',
        'frontend/env.production',
        'main.py'
    ]
    
    missing_files = []
    
    for file_path in required_files:
        if os.path.exists(file_path):
            print(f"✅ {file_path} exists")
        else:
            print(f"❌ {file_path} missing")
            missing_files.append(file_path)
    
    return len(missing_files) == 0

def main():
    """Ana kontrol fonksiyonu"""
    print("🚀 PostureGuard Production Readiness Check")
    print("=" * 50)
    
    checks = [
        ("Localhost References", check_localhost_references),
        ("Environment Variables", check_environment_variables),
        ("Production Files", check_production_files)
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        print(f"\n📋 {check_name}:")
        if check_func():
            print(f"✅ {check_name} - PASSED")
        else:
            print(f"❌ {check_name} - FAILED")
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All checks passed! Project is ready for production!")
    else:
        print("⚠️  Some checks failed. Please fix issues before production deployment.")
    
    return all_passed

if __name__ == "__main__":
    main() 