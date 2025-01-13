import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestingModule } from './features/testing';
import { BloggersPlatformModule } from './features/bloggers-platform';
import { UserAccountsModule } from './features/user-accounts';
import { UtilitiesApplicationModule } from './features/service';

//TODO path for DB put into env or config module
@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017', {
      dbName: 'nest-hw',
    }),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
    UtilitiesApplicationModule,
  ],
})
export class AppModule {}
