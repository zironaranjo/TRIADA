import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Owner } from './entities/owner.entity';

@Injectable()
export class OwnersService {
  constructor(
    @InjectRepository(Owner)
    private ownersRepository: Repository<Owner>,
  ) {}

  create(createOwnerDto: any) {
    const owner = this.ownersRepository.create(createOwnerDto);
    return this.ownersRepository.save(owner);
  }

  findAll() {
    return this.ownersRepository.find();
  }

  findOne(id: string) {
    return this.ownersRepository.findOne({ where: { id } });
  }
}
