import { Controller, Get } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Controller('accounting')
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) { }

    @Get('dashboard')
    getDashboard() {
        return this.accountingService.getDashboardStats();
    }

    @Get('ledger')
    getLedger() {
        // TODO: Implement ledger query with filters
        return { message: 'Ledger endpoint - coming soon' };
    }
}
