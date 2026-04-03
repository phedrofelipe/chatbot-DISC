import { Controller, Post, Body, Get } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { UsersService } from '../users/users.service';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async analyze(@Body() body: { scores: any; answers: any[] }) {
    return this.analysisService.generateAnalysis(body.scores, body.answers);
  }

  @Get('dashboard')
  async getDashboard() {
    const users = await this.usersService.findAll();
    return this.analysisService.generateDashboardAnalysis(users);
  }
}
