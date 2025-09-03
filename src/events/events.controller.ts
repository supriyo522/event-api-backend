import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async getAllEvents(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('date') date?: string,
  ) {
    if (date && isNaN(Date.parse(date))) {
      throw new BadRequestException('Invalid date format');
    }
    return this.eventsService.findAll({ page, limit, search, date });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = file.originalname.split('.').pop();
          cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(new Error('Only JPG/PNG images are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Req() req,
    @UploadedFile() banner: Express.Multer.File,
  ) {
    return this.eventsService.create(createEventDto, req.user._id, banner);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async updateEvent(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    return this.eventsService.delete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/register')
  async registerAsAttendee(@Param('id') id: string, @Req() req) {
    return this.eventsService.registerAttendee(id, req.user._id);
  }
}
