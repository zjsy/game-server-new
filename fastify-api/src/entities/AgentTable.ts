import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity('game_agent_tables')
export class GameAgentTable {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    agent_id: number;

    @Column()
    table_id: number;
}
