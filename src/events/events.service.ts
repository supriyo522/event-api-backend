import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event, EventDocument } from './schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  async create(createEventDto: CreateEventDto, userId: string, banner: Express.Multer.File) {
    const eventDate = new Date(createEventDto.date);
    if (eventDate <= new Date()) {
      throw new BadRequestException('Event date must be a future date');
    }

    const event = new this.eventModel({
      ...createEventDto,
      date: eventDate,
      createdBy: new Types.ObjectId(userId),
      banner: banner ? banner.filename : null,
      attendees: [],
    });

    return event.save();
  }

  async findAll(query: { page: number; limit: number; search?: string; date?: string }) {
    const { page, limit, search, date } = query;

    const filter: any = {};
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }
    if (date) {
      const filterDate = new Date(date);
      filter.date = { $gte: filterDate };
    }

    const skip = (page - 1) * limit;

    const events = await this.eventModel
      .find(filter)
      .populate('createdBy', 'name email')
      .populate('attendees', 'name email')
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.eventModel.countDocuments(filter);

    return {
      data: events,
      total,
      page,
      limit,
    };
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    if (updateEventDto.date && new Date(updateEventDto.date) <= new Date()) {
      throw new BadRequestException('Event date must be a future date');
    }

    const updated = await this.eventModel.findByIdAndUpdate(id, updateEventDto, { new: true });
    if (!updated) throw new NotFoundException('Event not found');
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.eventModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Event not found');
    return { message: 'Event deleted successfully' };
  }

  async registerAttendee(eventId: string, userId: string) {
    const event = await this.eventModel.findById(eventId);
    if (!event) throw new NotFoundException('Event not found');

    const userObjectId = new Types.ObjectId(userId);

    if (event.attendees.includes(userObjectId)) {
      throw new BadRequestException('User already registered as attendee');
    }

    event.attendees.push(userObjectId);
    await event.save();

    return { message: 'Registered as attendee successfully' };
  }
}
