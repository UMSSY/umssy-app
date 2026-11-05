import { beforeEach, describe, expect, it } from 'vitest';
import { AppointmentDocumentMapper } from '../mappers/appointment-document.mapper.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import {
  createAppointmentRecord,
  MENTOR_ID,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('AppointmentMapper', () => {
  let mapper: AppointmentMapper;

  beforeEach(() => {
    mapper = new AppointmentMapper(new AppointmentDocumentMapper());
  });

  it('returns the persisted appointment times as ISO UTC and the student to its mentor', () => {
    const record = createAppointmentRecord({
      startAt: new Date('2026-10-23T10:00:00-04:00'),
      endAt: new Date('2026-10-23T10:30:00-04:00'),
    });

    expect(mapper.toResponse(record, MENTOR_ID)).toEqual({
      id: record.id,
      blockId: record.blockId,
      startAt: '2026-10-23T14:00:00.000Z',
      endAt: '2026-10-23T14:30:00.000Z',
      orientationType: record.orientationType,
      counterpart: { id: STUDENT_ID, fullName: 'Luis Flores', role: 'student' },
      status: 'CONFIRMED',
      message: null,
      requestedAt: '2026-10-22T13:00:00.000Z',
      document: null,
    });
  });

  it('returns the message, request date and document metadata of the appointment', () => {
    const document = {
      fileName: 'cv-luis-flores.pdf',
      sizeBytes: 245760,
      mimeType: 'application/pdf',
      uploadedAt: new Date('2026-10-22T09:20:00-04:00'),
    };
    const record = createAppointmentRecord({
      message: 'Quiero revisar mi CV',
      requestedAt: new Date('2026-10-22T09:15:00-04:00'),
      document,
    });

    expect(mapper.toResponse(record, MENTOR_ID)).toMatchObject({
      message: 'Quiero revisar mi CV',
      requestedAt: '2026-10-22T13:15:00.000Z',
      document: {
        fileName: 'cv-luis-flores.pdf',
        sizeBytes: 245760,
        mimeType: 'application/pdf',
        uploadedAt: '2026-10-22T13:20:00.000Z',
      },
    });
  });

  it('returns null message and document when the appointment has none', () => {
    expect(
      mapper.toResponse(createAppointmentRecord(), STUDENT_ID),
    ).toMatchObject({ message: null, document: null });
  });

  it('returns the same appointment data for both participants, changing only the counterpart', () => {
    const record = createAppointmentRecord();
    const mentorResponse = mapper.toResponse(record, MENTOR_ID);
    const studentResponse = mapper.toResponse(record, STUDENT_ID);
    const { counterpart: mentorCounterpart, ...mentorData } = mentorResponse;
    const { counterpart: studentCounterpart, ...studentData } = studentResponse;

    expect(mentorData).toEqual(studentData);
    expect(mentorCounterpart).toEqual({
      id: STUDENT_ID,
      fullName: 'Luis Flores',
      role: 'student',
    });
    expect(studentCounterpart).toEqual({
      id: MENTOR_ID,
      fullName: 'Ana Pérez',
      role: 'mentor',
    });
  });

  it('preserves null block and topic without deriving times from the availability block', () => {
    const record = createAppointmentRecord({
      blockId: null,
      orientationType: null,
    });

    expect(mapper.toResponse(record, STUDENT_ID)).toMatchObject({
      blockId: null,
      orientationType: null,
      startAt: record.startAt.toISOString(),
      endAt: record.endAt.toISOString(),
    });
  });

  it('normalizes only the legacy confirmed status', () => {
    expect(
      mapper.toResponse(
        createAppointmentRecord({ status: { title: 'CONFIRMADA' } }),
        MENTOR_ID,
      ).status,
    ).toBe('CONFIRMED');
  });

  it.each(['CANCELLED', 'COMPLETED', 'PENDIENTE'])(
    'preserves the real status %s in appointment detail',
    (title) => {
      expect(
        mapper.toResponse(
          createAppointmentRecord({ status: { title } }),
          MENTOR_ID,
        ).status,
      ).toBe(title);
    },
  );

  it('selects the counterpart for each appointment when a user participates on both sides', () => {
    const asMentor = createAppointmentRecord();
    const asStudent = createAppointmentRecord({
      mentorId: OTHER_USER_ID,
      studentId: MENTOR_ID,
      mentor: { id: OTHER_USER_ID, firstName: 'Marta', lastName: 'Vargas' },
      student: asMentor.mentor,
    });

    expect(
      mapper
        .toResponseList([asMentor, asStudent], MENTOR_ID)
        .map((row) => row.counterpart),
    ).toEqual([
      { id: STUDENT_ID, fullName: 'Luis Flores', role: 'student' },
      { id: OTHER_USER_ID, fullName: 'Marta Vargas', role: 'mentor' },
    ]);
  });

  it('maps an empty result to an empty list', () => {
    expect(mapper.toResponseList([], MENTOR_ID)).toEqual([]);
  });
});
