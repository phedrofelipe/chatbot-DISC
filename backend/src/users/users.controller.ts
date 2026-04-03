import { Controller, Post, Body, Patch, Param, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() userData: Partial<User>) {
    return this.usersService.create(userData);
  }

  @Patch(':id/analysis')
  async updateAnalysis(@Param('id') id: string, @Body() body: { result: any }) {
    return this.usersService.updateAnalysis(parseInt(id), body.result);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string) {
    return this.usersService.findByEmail(email);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }
}