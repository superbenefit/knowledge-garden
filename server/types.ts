export interface ContentChunk {
  id: string;
  text: string;
  metadata: {
    title: string;
    url: string;
    section?: string;
    file_path: string;
  };
}

export interface VectorRecord {
  id: string;
  text: string;
  vector: number[];
  title: string;
  url: string;
  section: string;
  file_path: string;
}

export interface SearchResult {
  id: string;
  text: string;
  title: string;
  url: string;
  section: string;
  file_path: string;
  _distance?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
