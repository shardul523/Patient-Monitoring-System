import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import * as amqpConnectionManager from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';

@Injectable()
export class MessagingService {
  private connection: amqpConnectionManager.AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;
  private readonly logger = new Logger(MessagingService.name);

  constructor(private configService: ConfigService) {
    const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL') || '';
    this.connection = amqpConnectionManager.connect([rabbitmqUrl]);
    
    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: async (channel: amqp.Channel) => {
        await channel.assertQueue(this.configService.get<string>('RABBITMQ_QUEUE_PATIENT_EVENTS') || '', { durable: true });
        await channel.assertQueue(this.configService.get<string>('RABBITMQ_QUEUE_APPOINTMENT_EVENTS') || '', { durable: true });
      },
    });
  }

  async publishPatientEvent(eventType: string, data: any): Promise<void> {
    const queue = this.configService.get<string>('RABBITMQ_QUEUE_PATIENT_EVENTS') || '';
    const message = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.channelWrapper.sendToQueue(queue, message, { persistent: true });
      this.logger.log(`Published ${eventType} event to ${queue}`);
    } catch (error) {
      this.logger.error(`Failed to publish ${eventType} event`, error);
    }
  }

  async publishAppointmentEvent(eventType: string, data: any): Promise<void> {
    const queue = this.configService.get<string>('RABBITMQ_QUEUE_APPOINTMENT_EVENTS') || '';
    const message = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.channelWrapper.sendToQueue(queue, message, { persistent: true });
      this.logger.log(`Published ${eventType} event to ${queue}`);
    } catch (error) {
      this.logger.error(`Failed to publish ${eventType} event`, error);
    }
  }
}