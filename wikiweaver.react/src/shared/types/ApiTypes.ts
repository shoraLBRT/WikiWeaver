// wikiweaver.react/src/types/ApiTypes.ts

// Type for an article paragraph
export interface ParagraphDto {
  id: number;
  content: string;
  order: number;
}

// Type for article content
export interface ArticleContentDto {
  id: number;
  title: string;
  paragraphs: ParagraphDto[];
}

// Type for an article linked to a navigation node
export interface ArticleReadDto {
  id: number;
  title: string;
  nodeId?: number;
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