export interface Task {
  id: string;
  userId: string;
  text: string;
  tag: string;
  created?: Date;
}