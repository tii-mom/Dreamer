import { COMMANDS, DIGIT_MENU_MAP_USER, DIGIT_MENU_MAP_OPERATOR, type BotIntent } from "./actions";

/**
 * Menu session TTL: 60 seconds
 * User's numeric menu selection expires after this time
 */
const MENU_SESSION_TTL_MS = 60_000;

const menuSessions = new Map<string, { expiresAt: number }>();

export function setMenuSession(userId: string): void {
  menuSessions.set(userId, { expiresAt: Date.now() + MENU_SESSION_TTL_MS });
}

export function clearMenuSession(userId: string): void {
  menuSessions.delete(userId);
}

function hasActiveMenuSession(userId: string): boolean {
  const session = menuSessions.get(userId);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    menuSessions.delete(userId);
    return false;
  }
  return true;
}

/**
 * Parse user input text into a BotIntent
 * Handles both keyword matching and digit menu selection
 */
export function parseIntent(text: string, userId: string, isOperator: boolean): BotIntent | null {
  const trimmed = text.trim();

  // Check digit menu first
  if (/^\d{1,2}$/.test(trimmed) && hasActiveMenuSession(userId)) {
    const digitMap = isOperator ? DIGIT_MENU_MAP_OPERATOR : DIGIT_MENU_MAP_USER;
    const intent = digitMap[trimmed];
    if (intent) {
      clearMenuSession(userId);
      return intent;
    }
  }

  // Keyword matching
  for (const cmd of COMMANDS) {
    // For operator-only commands, skip if user is not operator
    if (cmd.requiresOperator && !isOperator) continue;

    for (const regex of cmd.keywords) {
      if (regex.test(trimmed)) {
        return cmd.intents[0];
      }
    }
  }

  return "chat";
}

/**
 * Check if text looks like a menu request
 */
export function isMenuRequest(text: string): boolean {
  return /^菜单$|^menu$|^help$|^帮助$/i.test(text.trim());
}
