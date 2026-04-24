"""
序话(xuhua-wx)错误模式防护测试 (Error Patterns)

Harness V2 实践:每次 bug 修复后,在此追加一个 test case。
结构: EP-xxx 对应一个 test_ep_xxx 函数。

当前: 初始状态(0 test case),随 bug 积累逐步添加。

模板示例(注释掉,待实际 bug 出现时启用):
"""

# def test_ep_001_short_description():
#     """EP-001: 错误模式的简短描述
#
#     发现日期: YYYY-MM-DD
#     发现者: <role>
#     根因: ...
#     修复: ...
#     """
#     # 复现条件:
#     # ...
#     # 修复验证:
#     # assert ...
#     pass


def test_placeholder_no_error_patterns_yet():
    """占位符: 避免 pytest 抱怨没有 test。真正的 EP test 出现时,删除这个。"""
    assert True
