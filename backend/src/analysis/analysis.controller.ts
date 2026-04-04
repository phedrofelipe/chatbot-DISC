import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async analyze(@Body() body: { email: string; scores: any; answers: any[] }) {
    return this.analysisService.generateAnalysis(body.email, body.scores, body.answers);
  }

  @UseGuards(JwtAuthGuard)
  @Get('dashboard')
  async getDashboard() {
    const users = await this.usersService.findAll();
    return this.analysisService.generateDashboardAnalysis(users);
  }
}
