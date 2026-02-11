import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
  ) {}

  async createContact(data: Partial<Contact>) {
    // Check if contact exists by email to avoid duplicates
    const existing = await this.contactsRepository.findOne({
      where: { email: data.email },
    });
    if (existing) {
      return existing; // Or update it
    }
    const contact = this.contactsRepository.create(data);
    return this.contactsRepository.save(contact);
  }
}
