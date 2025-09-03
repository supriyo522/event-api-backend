import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest-event-management'),
    AuthModule,
    UsersModule,
    EventsModule,
  ],
})
export class AppModule {}
