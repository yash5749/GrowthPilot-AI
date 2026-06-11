import { Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    return this.ordersService.importCsv(file.buffer);
  }

  @Post()
  async create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.ordersService.findAll({ page, limit });
  }
}
