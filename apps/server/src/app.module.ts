import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RealtimeGateway } from './realtime/realtime.gateway.js';
import { RealtimeTesterController } from './dev/realtime-tester.controller.js';

const controllers = [
  AppController,
  ...(process.env.ENABLE_REALTIME_TESTER === 'true' ? [RealtimeTesterController] : []),
];

@Module({
  imports: [],
  controllers,
  providers: [AppService, RealtimeGateway],
})
export class AppModule {}
