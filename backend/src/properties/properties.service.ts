import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';

@Injectable()
export class PropertiesService {
    constructor(
        @InjectRepository(Property)
        private propertiesRepository: Repository<Property>,
    ) { }

    create(createPropertyDto: any) {
        const property = this.propertiesRepository.create(createPropertyDto);
        return this.propertiesRepository.save(property);
    }

    findAll() {
        return this.propertiesRepository.find({ relations: ['owner'] });
    }

    findOne(id: string) {
        return this.propertiesRepository.findOne({ where: { id }, relations: ['owner'] });
    }
}
