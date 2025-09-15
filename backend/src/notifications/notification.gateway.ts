// src/modules/notifications/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationGateway');
  private userSockets = new Map<number, Set<string>>(); // userId -> socketIds

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(socket: AuthenticatedSocket, ...args: any[]) {
    try {
      // Extract token from handshake auth
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        socket.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        socket.disconnect();
        return;
      }

      // Associate socket with user
      socket.user = user;

      // Track user socket
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id)!.add(socket.id);

      // Join user-specific room
      socket.join(`user_${user.id}`);

      this.logger.log(`User ${user.email} connected with socket ${socket.id}`);

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to notifications',
        userId: user.id,
      });
    } catch (error) {
      this.logger.error('Connection authentication failed:', error);
      socket.disconnect();
    }
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    if (socket.user) {
      const userSockets = this.userSockets.get(socket.user.id);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.userSockets.delete(socket.user.id);
        }
      }

      this.logger.log(
        `User ${socket.user.email} disconnected from socket ${socket.id}`,
      );
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (!socket.user) return;

    socket.join(data.room);
    this.logger.log(`User ${socket.user.email} joined room ${data.room}`);

    socket.emit('joined_room', { room: data.room });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (!socket.user) return;

    socket.leave(data.room);
    this.logger.log(`User ${socket.user.email} left room ${data.room}`);

    socket.emit('left_room', { room: data.room });
  }

  @SubscribeMessage('mark_notification_read')
  handleMarkNotificationRead(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { notificationId: number },
  ) {
    if (!socket.user) return;

    // Broadcast to all user's sockets
    this.sendToUser(socket.user.id, 'notification_read', {
      notificationId: data.notificationId,
    });
  }

  @SubscribeMessage('get_online_status')
  handleGetOnlineStatus(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { userIds: number[] },
  ) {
    if (!socket.user) return;

    const onlineStatus = data.userIds.map((userId) => ({
      userId,
      online: this.userSockets.has(userId),
    }));

    socket.emit('online_status', onlineStatus);
  }

  // Public methods for sending notifications
  sendToUser(userId: number, event: string, data: any) {
    const userSocketIds = this.userSockets.get(userId);
    if (userSocketIds && userSocketIds.size > 0) {
      userSocketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
      this.logger.debug(`Sent event '${event}' to user ${userId}`);
    }
  }

  sendToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
    this.logger.debug(`Sent event '${event}' to room ${room}`);
  }

  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.debug(`Broadcasted event '${event}' to all connected users`);
  }

  // Send notification to multiple users
  sendToUsers(userIds: number[], event: string, data: any) {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  // Get user connection status
  isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId);
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  // Get all online user IDs
  getOnlineUserIds(): number[] {
    return Array.from(this.userSockets.keys());
  }

  // Send typing indicators for real-time features
  sendTypingIndicator(fromUserId: number, toUserId: number, isTyping: boolean) {
    this.sendToUser(toUserId, 'typing_indicator', {
      fromUserId,
      isTyping,
      timestamp: new Date(),
    });
  }

  // Send real-time enrollment updates
  sendEnrollmentUpdate(studentId: number, courseId: number, status: string) {
    this.sendToUser(studentId, 'enrollment_update', {
      courseId,
      status,
      timestamp: new Date(),
    });
  }

  // Send real-time grade updates
  sendGradeUpdate(studentId: number, assignmentId: number, grade: number) {
    this.sendToUser(studentId, 'grade_update', {
      assignmentId,
      grade,
      timestamp: new Date(),
    });
  }

  // Send system announcements
  sendSystemAnnouncement(
    title: string,
    message: string,
    targetUserIds?: number[],
  ) {
    const announcement = {
      title,
      message,
      timestamp: new Date(),
      type: 'system_announcement',
    };

    if (targetUserIds && targetUserIds.length > 0) {
      this.sendToUsers(targetUserIds, 'system_announcement', announcement);
    } else {
      this.broadcastToAll('system_announcement', announcement);
    }
  }
}
