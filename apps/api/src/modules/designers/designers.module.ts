import { Module } from '@nestjs/common';
import { DesignersController } from './designers.controller';
import { DesignersService } from './designers.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DesignersController],
  providers: [DesignersService],
  exports: [DesignersService],
})
export class DesignersModule {}
