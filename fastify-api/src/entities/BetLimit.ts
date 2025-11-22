import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity('game_bet_limit_groups')
export class GameBetLimit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    min: number;

    @Column()
    max: number;

    @Column()
    currency: string;
}
