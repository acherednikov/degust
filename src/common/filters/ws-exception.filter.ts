// import { ArgumentsHost, Catch } from '@nestjs/common';
// import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
// import { Socket } from 'socket.io';

// @Catch()
// export class WsExceptionFilter extends BaseWsExceptionFilter {
//   catch(exception: unknown, host: ArgumentsHost) {
//     const client = host.switchToWs().getClient<Socket>();

//     const error =
//       exception instanceof WsException
//         ? exception.getError()
//         : { message: 'Internal server error' };

//     const payload =
//       typeof error === 'string' ? { message: error } : error;

//     client.emit('exception', payload);
//   }
// }

import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let payload: Record<string, any>;

    if (exception instanceof WsException) {
      const err = exception.getError();
      payload = typeof err === 'string' ? { message: err } : (err as Record<string, any>);
    } else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      payload = typeof res === 'string' ? { message: res } : (res as Record<string, any>);
    } else {
      payload = { message: 'Internal server error' };
    }

    client.emit('exception', payload);
  }
}
