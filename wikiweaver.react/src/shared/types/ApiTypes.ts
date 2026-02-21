// wikiweaver.react/src/types/ApiTypes.ts

// Type for an article paragraph
export interface ParagraphDto {
  id: number;
  content: string;
  order: number;
  isDefault: boolean;
}

// Type for article content
export interface ArticleContentDto {
  id: number;
  title: string;
  paragraphs: ParagraphDto[];
}

export interface ArticleContentCreateDto {
  title: string;
  nodeId?: number;
  paragraphs: ParagraphDto[];
}

// Type for an article linked to a navigation node
export interface ArticleReadDto {
  id: number;
  title: string;
  nodeId?: number;
}

export interface ParagraphReadDto {
  id: number;
  content: string;
  articleId: number;
  order: number;
  isDefault: boolean;
}

export interface AdminNodeDto {
  id: number;
  title: string;
  parentId: number | null;
}

export interface AdminCleanupResultDto {
  deletedNodes: number;
  deletedArticles: number;
  deletedParagraphs: number;
  message: string;
}

export interface AiProviderSettingsDto {
  baseUrl: string;
  model: string;
  isEnabled: boolean;
  hasApiKey: boolean;
}

export interface UpdateAiProviderSettingsDto {
  baseUrl: string;
  model: string;
  isEnabled: boolean;
  apiKey?: string;
  clearApiKey?: boolean;
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

// Type for a navigation tree node
export interface NavigationNodeDto {
  id: number;
  title: string;
  parentId?: number;
  children?: NavigationNodeDto[];
  article?: ArticleReadDto;
}

// Type for the entire navigation tree (list of root nodes)
export type NavigationTreeDto = NavigationNodeDto[];


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
