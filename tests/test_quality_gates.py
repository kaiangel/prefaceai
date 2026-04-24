"""
序话(xuhua-wx)质量门测试

验证代码质量、配置完整性、微信小程序规范。
运行: python3 -m pytest tests/test_quality_gates.py -x -q
"""

import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent


def test_app_json_valid():
    """app.json 必须是合法 JSON 且含 pages"""
    data = json.loads((PROJECT_ROOT / "app.json").read_text(encoding="utf-8"))
    assert "pages" in data, "app.json missing 'pages'"
    assert len(data["pages"]) > 0, "app.json has empty pages"


def test_project_config_valid():
    """project.config.json 必须是合法 JSON 且含 appid"""
    data = json.loads((PROJECT_ROOT / "project.config.json").read_text(encoding="utf-8"))
    assert "appid" in data, "project.config.json missing 'appid'"


def test_pages_have_all_four_files():
    """每个 page 必须有 .js/.json/.wxml/.wxss 四件套"""
    app_json = json.loads((PROJECT_ROOT / "app.json").read_text(encoding="utf-8"))
    missing = []
    for page in app_json.get("pages", []):
        for ext in [".js", ".json", ".wxml", ".wxss"]:
            file_path = PROJECT_ROOT / f"{page}{ext}"
            if not file_path.exists():
                missing.append(f"{page}{ext}")
    assert not missing, f"Missing page files: {missing}"


def test_tab_bar_icons_exist():
    """tabBar 配置引用的图标必须实际存在"""
    app_json = json.loads((PROJECT_ROOT / "app.json").read_text(encoding="utf-8"))
    tab_bar = app_json.get("tabBar", {})
    missing = []
    for item in tab_bar.get("list", []):
        for key in ["iconPath", "selectedIconPath"]:
            icon = item.get(key)
            if icon and not (PROJECT_ROOT / icon).exists():
                missing.append(icon)
    assert not missing, f"tabBar icons missing on disk: {missing}"


def test_no_bak_or_backup_files_in_pages():
    """pages/ 下不应含 .bak/.backup 文件(应在 .gitignore 中)"""
    backups = []
    for p in (PROJECT_ROOT / "pages").rglob("*"):
        name = p.name
        if name.endswith((".bak", ".backup")) or ".backup" in name:
            backups.append(str(p.relative_to(PROJECT_ROOT)))
    assert not backups, f"Backup files found in pages/: {backups}"


def test_gitignore_excludes_internal_docs():
    """.gitignore 必须排除内部文档和备份"""
    gi = (PROJECT_ROOT / ".gitignore").read_text(encoding="utf-8")
    required_rules = ["/docs/", "/claudecli.md", "*.bak"]
    missing = [r for r in required_rules if r not in gi]
    assert not missing, f".gitignore missing rules: {missing}"
