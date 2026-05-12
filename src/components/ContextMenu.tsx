/**
 * 右键菜单组件
 * 宠物的自定义右键菜单，替代浏览器默认菜单
 */

import { useEffect, useRef, useCallback } from "react";
import type { ContextMenuItem } from "@/types";
import { MENU_ICONS } from "./contextMenuItems";

interface ContextMenuProps {
  /** 是否显示 */
  visible: boolean;
  /** 菜单位置 */
  x: number;
  y: number;
  /** 菜单项 */
  items: ContextMenuItem[];
  /** 关闭回调 */
  onClose: () => void;
  /** 选择回调 */
  onSelect: (id: string) => void;
}

export function ContextMenu({
  visible,
  x,
  y,
  items,
  onClose,
  onSelect,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // 延迟注册，避免触发当前右键事件
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visible, onClose]);

  // ESC 键关闭
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  // 处理菜单项点击
  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled || item.separator) return;
      onSelect(item.id);
      onClose();
    },
    [onSelect, onClose],
  );

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        left: x,
        top: y,
        background: "rgba(30, 30, 30, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: 8,
        padding: "4px 0",
        minWidth: 160,
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        zIndex: 9999,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: 13,
        color: "#e0e0e0",
        userSelect: "none",
        animation: "contextMenuFadeIn 0.12s ease-out",
      }}
    >
      {items.map((item) =>
        item.separator ? (
          <div
            key={item.id}
            style={{
              height: 1,
              background: "rgba(255, 255, 255, 0.08)",
              margin: "4px 8px",
            }}
          />
        ) : (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: item.disabled ? "default" : "pointer",
              opacity: item.disabled ? 0.4 : 1,
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.08)";
              }
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "transparent";
            }}
          >
            <span style={{ width: 18, textAlign: "center", fontSize: 14 }}>
              {item.icon ? MENU_ICONS[item.icon] ?? "" : ""}
            </span>
            <span>{item.label}</span>
          </div>
        ),
      )}
    </div>
  );
}
