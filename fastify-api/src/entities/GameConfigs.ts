import { RowDataPacket } from 'mysql2'
export interface GameConfig {
  id: number;
  name: string;
  value: string;
}
export interface GameConfigRow extends RowDataPacket, GameConfig { }
