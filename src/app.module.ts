import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserAccountsModule } from './features/user-accounts';

//TODO path for DB put into env or config module
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/nest-hw'),
    UserAccountsModule,
  ],
})
export class AppModule {}
