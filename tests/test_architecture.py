"""
序话(xuhua-wx)架构适配度测试

验证项目结构、文件存在性、关键约束。
运行: python3 -m pytest tests/test_architecture.py -x -q
"""

import os
import re
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent


def test_required_files_exist():
    """必需文件必须存在"""
    required = [
        "app.js",
        "app.json",
        "app.wxss",
        "project.config.json",
        ".claude/settings.json",
        ".team-brain/TEAM_CHAT.md",
        ".team-brain/TEAM_PROTOCOL.md",
        ".claude/PROGRESS_PROTOCOL.md",
        "CLAUDE.md",
    ]
    missing = [f for f in required if not (PROJECT_ROOT / f).exists()]
    assert not missing, f"Required files missing: {missing}"


def test_all_agent_roles_defined():
    """7 个 agent 角色文件 + progress 三件套必须存在"""
    roles = ["coordinator", "pm", "backend", "frontend", "tester", "devops", "resonance"]
    for role in roles:
        assert (PROJECT_ROOT / f".claude/agents/{role}.md").exists(), (
            f"Agent role file missing: {role}.md"
        )
        for progress in ["current", "context-for-others", "completed"]:
            path = PROJECT_ROOT / f".claude/agents/{role}-progress/{progress}.md"
            assert path.exists(), f"Progress file missing: {role}-progress/{progress}.md"


def test_api_base_url_consistency():
    """API base URL 必须一致使用 https://www.duyueai.com"""
    app_js_path = PROJECT_ROOT / "app.js"
    if not app_js_path.exists():
        return
    content = app_js_path.read_text(encoding="utf-8", errors="ignore")
    urls = re.findall(r'https?://[^\s\'"\\\\]+duyueai\.com[^\s\'"\\\\]*', content)
    for u in urls:
        assert u.startswith("https://www.duyueai.com"), (
            f"Unexpected base URL (should be https://www.duyueai.com): {u}"
        )


def test_no_forbidden_overseas_llm_endpoints():
    """
    合规检查: 序话是中国大陆境内微信小程序,代码中不应硬编码境外 LLM 端点。
    允许字符串常量里出现模型名(作为 UI 展示),但 API 端点 URL 不允许。
    """
    forbidden_urls = [
        "api.openai.com",
        "api.anthropic.com",
        "generativelanguage.googleapis.com",
    ]
    for js_file in PROJECT_ROOT.rglob("*.js"):
        path_str = str(js_file)
        if any(skip in path_str for skip in ["node_modules", ".backup", "tests/"]):
            continue
        content = js_file.read_text(encoding="utf-8", errors="ignore")
        for url in forbidden_urls:
            assert url not in content, (
                f"Forbidden overseas LLM endpoint '{url}' found in {js_file}"
            )


def test_team_brain_directory_structure():
    """.team-brain 必需子目录必须存在"""
    required_dirs = [
        "status", "handoffs", "decisions", "knowledge",
        "daily-sync", "chat-archive", "shared-memory", "analysis"
    ]
    tb = PROJECT_ROOT / ".team-brain"
    missing = [d for d in required_dirs if not (tb / d).is_dir()]
    assert not missing, f".team-brain subdirs missing: {missing}"


def test_team_chat_is_append_only_placeholder():
    """TEAM_CHAT.md 存在且有基础 header(实际 append-only 规则在协议文档中)"""
    chat = PROJECT_ROOT / ".team-brain" / "TEAM_CHAT.md"
    assert chat.exists(), "TEAM_CHAT.md missing"
    content = chat.read_text(encoding="utf-8")
    assert len(content) > 100, "TEAM_CHAT.md too short — missing header?"


def test_harness_health_exists():
    """Harness V2: HARNESS_HEALTH.md Day 1 必须建立"""
    path = PROJECT_ROOT / ".team-brain" / "status" / "HARNESS_HEALTH.md"
    assert path.exists(), "HARNESS_HEALTH.md missing"


def test_error_patterns_file_exists():
    """Harness V2: test_error_patterns.py 即使为空也必须存在(Day 1)"""
    path = PROJECT_ROOT / "tests" / "test_error_patterns.py"
    assert path.exists(), "tests/test_error_patterns.py missing"


def test_skill_index_exists():
    """Skills 系统: SKILL_INDEX.md 必须存在"""
    path = PROJECT_ROOT / ".claude" / "skills" / "SKILL_INDEX.md"
    assert path.exists(), "SKILL_INDEX.md missing"


def test_xh_workflow_skills_present():
    """8 个 xh* 工作流 Skills 必须存在(从 xuhuastory 移植)"""
    xh_skills = ["xhassign", "xhaudit", "xhdispatch", "xhpipeline",
                 "xhsync", "xhtdd", "xhteam", "xhwrap"]
    base = PROJECT_ROOT / ".claude" / "skills"
    for xh in xh_skills:
        sd = base / xh / "SKILL.md"
        assert sd.exists(), f"Workflow skill missing: {xh}/SKILL.md"


def test_xuhua_skill_triggers_renamed():
    """XUHUA_SKILL_TRIGGERS.md 必须存在(不是源项目的 XUHUASTORY_...)"""
    new_path = PROJECT_ROOT / ".claude" / "skills" / "XUHUA_SKILL_TRIGGERS.md"
    old_path = PROJECT_ROOT / ".claude" / "skills" / "XUHUASTORY_SKILL_TRIGGERS.md"
    assert new_path.exists(), "XUHUA_SKILL_TRIGGERS.md missing"
    assert not old_path.exists(), (
        "Legacy XUHUASTORY_SKILL_TRIGGERS.md should have been renamed"
    )
