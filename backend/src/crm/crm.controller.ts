import { Controller, Get } from '@nestjs/common';
import { CrmService } from './crm.service';

@Controller('crm')
export class CrmController {
    constructor(private readonly crmService: CrmService) { }

    @Get('contacts')
    getContacts() {
        // TODO: Implement contacts query
        return { message: 'Contacts endpoint - coming soon' };
    }
}
