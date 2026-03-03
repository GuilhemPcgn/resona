import {
  IsUUID,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateInvoiceItemDto } from './create-invoice-item.dto';

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  OVERDUE = 'overdue',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  client_id: string;

  @IsDateString()
  issue_date: string;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CreateInvoiceItemDto)
  items: CreateInvoiceItemDto[];
}
