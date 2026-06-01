type AiQueueMessage =
  | { kind: "daily"; userId: string; dateKey: string }
  | { kind: "share-card"; userId: string; shareId: string }
  | { kind: "report"; userId: string; threadId: string };

interface CloudflareBindings {
  DB?: D1Database;
  SESSION_KV?: KVNamespace;
  ASSETS_BUCKET?: R2Bucket;
  AI_QUEUE?: Queue<AiQueueMessage>;
  DEEPSEEK_API_KEY?: string;
  CF_ACCOUNT_ID?: string;
  CF_AI_GATEWAY_ID?: string;
  APP_BASE_URL?: string;
  SESSION_SECRET?: string;
  BUFPAY_AID?: string;
  BUFPAY_SECRET?: string;
  BUFPAY_MOCK?: string;
  ADMIN_TOKEN?: string;
  CLAWBOT_WEBHOOK_SECRET?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  DEEPSEEK_CHAT_MODEL?: string;
  DEEPSEEK_REPORT_MODEL?: string;
}

type CloudflareRequestContext = {
  cloudflare?: {
    env?: CloudflareBindings;
    ctx?: ExecutionContext;
  };
};

declare module "@tanstack/react-start" {
  interface Register {
    server: {
      requestContext: CloudflareRequestContext;
    };
  }
}
