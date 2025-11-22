import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm';

@Entity()
export class GameFailTransactionJobs {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    round_id: number;

    @Column()
    round_sn: string;

    @Column()
    user_id: number;

    @Column()
    username: string;

    @Column()
    type: number;

    @Column()
    data: string;

    @Column()
    status: number;

    @Column()
    created_at: Date;
}
