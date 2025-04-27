import { Module } from '@nestjs/common'
import { MeiliSearchModule } from 'nestjs-meilisearch'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MeilisearchService } from './meilisearch.service'
import { MeilisearchController } from './meilisearch.controller'

@Module({
  imports: [
    MeiliSearchModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        host: configService.get('MEILISEARCH_HOST', 'http://localhost:7700'),
        apiKey: configService.get('MEILISEARCH_API_KEY', ''),
      }),
    }),
  ],
  controllers: [MeilisearchController],
  providers: [MeilisearchService],
  exports: [MeilisearchService],
})
export class MeilisearchModule {}
