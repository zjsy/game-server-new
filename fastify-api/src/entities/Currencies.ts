import {Entity, PrimaryGeneratedColumn, Column, Index} from 'typeorm';

@Entity()
export class GameCurrencies {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    sign: string;

    @Column()
    rate: number;
}
