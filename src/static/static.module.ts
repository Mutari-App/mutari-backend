import { Module } from '@nestjs/common';
import { StaticService } from './static.service';
import { StaticController } from './static.controller';

@Module({
  controllers: [StaticController],
  providers: [StaticService],
})
export class StaticModule {}
