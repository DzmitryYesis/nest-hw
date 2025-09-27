import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TestingModule } from './features/testing';
import { UserAccountsModule } from './features/user-accounts';
import { UtilitiesApplicationModule } from './features/service';
import { UserIdMiddleware } from './core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloggersPlatformModule } from './features/bloggers-platform';

//TODO info DB put into env or config module
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'ab1595182',
      database: 'UsersPlatform',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
    UtilitiesApplicationModule,
  ],
  providers: [UtilitiesApplicationModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserIdMiddleware).forRoutes('*');
  }
}
