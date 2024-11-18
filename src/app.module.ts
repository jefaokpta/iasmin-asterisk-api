import { Module } from '@nestjs/common';
import { AriModule } from './ari/ari.module';
import { ConfigModule } from '@nestjs/config';
import { AmiModule } from './ami/ami.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AriModule,
    AmiModule
  ],
})
export class AppModule {}
