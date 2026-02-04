import { Controller, Post, Headers, Req, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

interface RequestWithRawBody extends Request {
    rawBody: Buffer;
}

@Controller('webhooks') // Prefix webhooks
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('stripe')
    async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() request: RequestWithRawBody) {
        if (!signature) {
            throw new BadRequestException('Missing stripe-signature header');
        }

        if (!request.rawBody) {
            throw new BadRequestException('Raw body not available. Ensure middleware is configured properly.');
        }

        try {
            const event = this.paymentsService.constructEvent(request.rawBody, signature);
            await this.paymentsService.handleEvent(event);
            return { received: true };
        } catch (err) {
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }
    }
}
