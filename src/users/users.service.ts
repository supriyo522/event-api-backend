import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({ email: createUserDto.email }).exec();
    if (existing) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || UserRole.USER,
    });
    return createdUser.save();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const user = await this.userModel.findOne({ email }).exec();
    return user || undefined;
  }

  async findById(id: string): Promise<User | undefined> {
    const user = await this.userModel.findById(id).exec();
    return user || undefined;
  }
}
