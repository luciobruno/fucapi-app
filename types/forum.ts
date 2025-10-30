export interface Forum {
    id: number;
    name: string;
    description: string;
    topicsCount: number;
    createdAt: number;
    tag: string;
  }
  
  export interface Topic {
    id: number;
    title: string;
    author: string;
    createdAt: number;
    content: string;
    repliesCount: number;
    forumId: number; 
  }
  
  export interface Reply {
    id: number;
    author: string;
    createdAt: number;
    text: string;
    accepted: boolean;
    topicId: number; 
    forumId: number; 
  }