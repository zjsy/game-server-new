import { RowDataPacket } from 'mysql2'

export interface UserBlockTables {
  user_id: number;
  table_id: number;
}

export interface UserBlockTablesRow extends RowDataPacket, UserBlockTables { }
