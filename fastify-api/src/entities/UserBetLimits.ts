import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from 'typeorm';
import {GameBetLimit} from './GameBetLimit';

@Entity()
export class GameUserBetLimits {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    game_type: number;

    @Column()
    limit_id: number;

    @OneToOne(() => GameBetLimit)
    @JoinColumn({name: 'limit_id', referencedColumnName: 'id'})
    limit: GameBetLimit;
}
