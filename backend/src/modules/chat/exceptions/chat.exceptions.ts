import { HttpStatus } from '@nestjs/common';
import { DomainException } from '../../../common/exceptions/domain.exception.js';

export class UserNotFoundException extends DomainException {
  constructor() {
    super('Usuario destinatario no encontrado', HttpStatus.NOT_FOUND, 'USER_NOT_FOUND');
  }
}

export class InactiveUserException extends DomainException {
  constructor() {
    super('El usuario no se encuentra activo', HttpStatus.FORBIDDEN, 'INACTIVE_USER');
  }
}

export class SelfConversationException extends DomainException {
  constructor() {
    super('No es posible iniciar una conversación consigo mismo', HttpStatus.BAD_REQUEST, 'SELF_CONVERSATION');
  }
}

export class ConversationNotFoundException extends DomainException {
  constructor() {
    super('Conversación no encontrada', HttpStatus.NOT_FOUND, 'CONVERSATION_NOT_FOUND');
  }
}

export class NotConversationParticipantException extends DomainException {
  constructor() {
    super('No eres participante de esta conversación', HttpStatus.FORBIDDEN, 'NOT_CONVERSATION_PARTICIPANT');
  }
}

export class MessageStatusNotFoundException extends DomainException {
  constructor() {
    super('Estado del mensaje no encontrado', HttpStatus.INTERNAL_SERVER_ERROR, 'MESSAGE_STATUS_NOT_FOUND');
  }
}

export class InvalidMessageContentException extends DomainException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST, 'INVALID_MESSAGE_CONTENT');
  }
}


export class CannotBlockSelfException extends DomainException {
  constructor() { super('No puedes bloquearte a ti mismo', HttpStatus.BAD_REQUEST, 'CANNOT_BLOCK_SELF'); }
}

export class InvalidBlockTargetException extends DomainException {
  constructor() { super('El identificador del usuario no es válido', HttpStatus.BAD_REQUEST, 'INVALID_BLOCK_TARGET'); }
}

export class UserAlreadyBlockedException extends DomainException {
  constructor() { super('El usuario ya está bloqueado', HttpStatus.CONFLICT, 'USER_ALREADY_BLOCKED'); }
}

export class BlockNotFoundException extends DomainException {
  constructor() { super('No existe un bloqueo para este usuario', HttpStatus.NOT_FOUND, 'BLOCK_NOT_FOUND'); }
}

export class UserBlockedException extends DomainException {
  constructor() { super('No es posible enviar mensajes en esta conversación', HttpStatus.FORBIDDEN, 'USER_BLOCKED'); }
}