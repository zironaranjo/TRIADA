import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { ContactNote } from './entities/contact-note.entity';

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    @InjectRepository(ContactNote)
    private notesRepository: Repository<ContactNote>,
  ) {}

  // ─── Contacts CRUD ────────────────────────────────

  async findAll(query?: {
    type?: string;
    source?: string;
    search?: string;
  }): Promise<Contact[]> {
    const qb = this.contactsRepository.createQueryBuilder('contact');

    if (query?.type) {
      qb.andWhere('contact.type = :type', { type: query.type });
    }
    if (query?.source) {
      qb.andWhere('contact.source = :source', { source: query.source });
    }
    if (query?.search) {
      qb.andWhere(
        '(contact.firstName ILIKE :search OR contact.lastName ILIKE :search OR contact.email ILIKE :search OR contact.company ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('contact.createdAt', 'DESC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactsRepository.findOne({ where: { id } });
    if (!contact) throw new NotFoundException(`Contact ${id} not found`);
    return contact;
  }

  async create(data: Partial<Contact>) {
    if (data.email) {
      const existing = await this.contactsRepository.findOne({
        where: { email: data.email },
      });
      if (existing) return existing;
    }
    const contact = this.contactsRepository.create(data as Contact);
    return this.contactsRepository.save(contact);
  }

  async update(id: string, data: Partial<Contact>) {
    await this.findOne(id);
    await this.contactsRepository.update(id, data as any);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.notesRepository.delete({ contactId: id });
    await this.contactsRepository.delete(id);
  }

  // ─── Contact Notes ────────────────────────────────

  async getNotes(contactId: string): Promise<ContactNote[]> {
    return this.notesRepository.find({
      where: { contactId },
      order: { createdAt: 'DESC' },
    });
  }

  async addNote(
    contactId: string,
    data: { type: string; content: string; createdBy?: string },
  ) {
    await this.findOne(contactId);
    const note = this.notesRepository.create({
      contactId,
      type: data.type,
      content: data.content,
      createdBy: data.createdBy,
    } as ContactNote);
    const saved = await this.notesRepository.save(note);

    await this.contactsRepository.update(contactId, {
      lastContactDate: new Date(),
    } as any);

    return saved;
  }

  // ─── Stats ────────────────────────────────────────

  async getStats() {
    const total = await this.contactsRepository.count();
    const guests = await this.contactsRepository.count({
      where: { type: 'GUEST' },
    });
    const owners = await this.contactsRepository.count({
      where: { type: 'OWNER' },
    });
    const vendors = await this.contactsRepository.count({
      where: { type: 'VENDOR' },
    });

    return { total, guests, owners, vendors };
  }

  // ─── Auto-create from Booking ─────────────────────

  async createFromBooking(data: {
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    source?: string;
    totalPrice?: number;
  }) {
    const names = data.guestName.split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';

    const existing = await this.contactsRepository.findOne({
      where: { email: data.guestEmail },
    });

    if (existing) {
      existing.totalBookings = (existing.totalBookings || 0) + 1;
      existing.totalSpent =
        Number(existing.totalSpent || 0) + Number(data.totalPrice || 0);
      existing.lastContactDate = new Date();
      return this.contactsRepository.save(existing);
    }

    const contact = this.contactsRepository.create({
      firstName,
      lastName,
      email: data.guestEmail,
      phone: data.guestPhone || null,
      type: 'GUEST',
      source: data.source || 'DIRECT',
      totalBookings: 1,
      totalSpent: data.totalPrice || 0,
    } as Contact);
    return this.contactsRepository.save(contact);
  }
}
