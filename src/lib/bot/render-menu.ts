import { MENU_ITEMS_USER, MENU_ITEMS_OPERATOR } from "./actions";

export function renderMenu(isOperator: boolean): string {
  const items = isOperator ? MENU_ITEMS_OPERATOR : MENU_ITEMS_USER;

  let text = "🔮 戏命师微信指令秘籍：\n\n";
  text += "回复数字可快速执行命令：\n\n";

  for (const item of items) {
    text += `${item.label}. ${item.description}\n`;
  }

  text += "\n也可以直接发送关键词（如「今日」「感情」「盲盒」）\n";
  text += "或直接发送任何问题，戏命师会替你拆盘推演。\n\n";
  text += "菜单 60 秒内有效，过期请重新发送「菜单」。";

  return text;
}
