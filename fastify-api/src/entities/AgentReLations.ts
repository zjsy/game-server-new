import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity('game_agent_relations')
export class GameAgentRelations {
    @PrimaryColumn()
    agent_id: number;

    @PrimaryColumn()
    pid: number;

    @Column()
    up_level: number;

    @Column()
    level: number;
}
