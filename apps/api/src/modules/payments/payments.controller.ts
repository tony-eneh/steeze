import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for an order' })
  @ApiResponse({
    status: 201,
    description: 'Payment initialized successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async initializePayment(
    @CurrentUser('id') userId: string,
    @Body() initializePaymentDto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePayment(userId, initializePaymentDto);
  }

  @Post('webhook')
  @SkipThrottle()
  @ApiOperation({ summary: 'Paystack webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Verify against the exact bytes Paystack signed. Re-serialising the parsed
    // body would change the payload whenever key order or spacing differs.
    const payload = req.rawBody?.toString('utf8') ?? JSON.stringify(req.body);
    return this.paymentsService.handleWebhook(signature, payload);
  }

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify a payment by reference' })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentsService.verifyPayment(reference);
  }
}
