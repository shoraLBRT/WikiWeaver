// wikiweaver.react/src/types/ApiTypes.ts

export interface ParagraphDto {
  id: number;
  content: string;
  order: number;
  isDefault: boolean;
}

export interface ArticleContentDto {
  id: number;
  title: string;
  paragraphs: ParagraphDto[];
}

export interface ArticleContentCreateDto {
  title: string;
  parentArticleId?: number;
  paragraphs: ParagraphDto[];
}

export interface ArticleReadDto {
  id: number;
  title: string;
  parentArticleId?: number;
  hasContent: boolean;
}

export interface ParagraphReadDto {
  id: number;
  content: string;
  articleId: number;
  order: number;
  isDefault: boolean;
}

export interface AdminCleanupResultDto {
  deletedArticles: number;
  deletedParagraphs: number;
  message: string;
}

export interface AiProviderSettingsDto {
  baseUrl: string;
  model: string;
  isEnabled: boolean;
  hasApiKey: boolean;
  markdownStylingSystemPrompt?: string;
}

export interface UpdateAiProviderSettingsDto {
  baseUrl: string;
  model: string;
  isEnabled: boolean;
  apiKey?: string;
  markdownStylingSystemPrompt?: string | null;
}

export interface AiStyleRequestDto {
  text: string;
}

export interface AiStyleResponseDto {
  styledText: string;
}

export interface AiConnectionCheckResultDto {
  message: string;
  styledText: string;
}

export interface NavigationArticleDto {
  id: number;
  title: string;
  parentArticleId?: number;
  hasContent: boolean;
  children?: NavigationArticleDto[];
}

export type NavigationTreeDto = NavigationArticleDto[];

export interface AdminAuthStatusDto {
  requiresBootstrapAdmin: boolean;
}

export interface AdminRegisterRequestDto {
  email: string;
  password: string;
  inviteToken?: string;
}

export interface AdminLoginRequestDto {
  email: string;
  password: string;
}

export interface AdminAuthResponseDto {
  accessToken: string;
  expiresAtUtc: string;
  email: string;
}

export interface AdminInviteTokenCreateResponseDto {
  token: string;
  expiresAtUtc: string;
}
