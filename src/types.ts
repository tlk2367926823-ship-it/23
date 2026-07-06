export type AppStep = "intro" | "generating" | "result" | "publish" | "reward";

export type MaterialKind = "image" | "video";

export interface ShareDraft {
  title: string;
  body: string;
  tags: string[];
  materialType: MaterialKind;
  style: "real_experience" | "promotion" | "student_story" | "exam_tips";
  cta: string;
}

export interface MockAsset {
  id: string;
  type: MaterialKind;
  title: string;
  keywords: string[];
  url: string;
  tone: string;
}

export interface PublishPayload {
  title: string;
  body: string;
  tags: string[];
  assets: string[];
}

export interface PublishResult {
  success: boolean;
  mode: "mock" | "copy" | "deeplink" | "native-share" | "api";
  message?: string;
}

export interface Publisher {
  publish(payload: PublishPayload): Promise<PublishResult>;
}
