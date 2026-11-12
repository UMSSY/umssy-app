import { beforeEach, describe, expect, it } from 'vitest';
import { AppointmentDocumentMapper } from '../mappers/appointment-document.mapper.js';
import { AppointmentMapper } from '../mappers/appointment.mapper.js';
import {
  createAppointmentRecord,
  MENTOR_ID,
  NOW,
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

    expect(mapper.toResponse(record, MENTOR_ID, NOW)).toEqual({
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

    expect(mapper.toResponse(record, MENTOR_ID, NOW)).toMatchObject({
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
      mapper.toResponse(createAppointmentRecord(), STUDENT_ID, NOW),
    ).toMatchObject({ message: null, document: null });
  });

  it('returns the same appointment data for both participants, changing only the counterpart', () => {
    const record = createAppointmentRecord();
    const mentorResponse = mapper.toResponse(record, MENTOR_ID, NOW);
    const studentResponse = mapper.toResponse(record, STUDENT_ID, NOW);
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

    expect(mapper.toResponse(record, STUDENT_ID, NOW)).toMatchObject({
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
        NOW,
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
          NOW,
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
        .toResponseList([asMentor, asStudent], MENTOR_ID, NOW)
        .map((row) => row.counterpart),
    ).toEqual([
      { id: STUDENT_ID, fullName: 'Luis Flores', role: 'student' },
      { id: OTHER_USER_ID, fullName: 'Marta Vargas', role: 'mentor' },
    ]);
  });

  it('maps an empty result to an empty list', () => {
    expect(mapper.toResponseList([], MENTOR_ID, NOW)).toEqual([]);
  });

  it('returns COMPLETED for a confirmed appointment from its exact end time', () => {
    const record = createAppointmentRecord();

    expect(mapper.toResponse(record, MENTOR_ID, record.endAt).status).toBe(
      'COMPLETED',
    );
    expect(
      mapper.toResponse(record, MENTOR_ID, new Date(record.endAt.getTime() - 1))
        .status,
    ).toBe('CONFIRMED');
  });

  it('keeps a cancelled appointment CANCELLED after its end time', () => {
    const record = createAppointmentRecord({ status: { title: 'CANCELLED' } });

    expect(
      mapper.toResponse(
        record,
        STUDENT_ID,
        new Date('2026-12-01T00:00:00.000Z'),
      ).status,
    ).toBe('CANCELLED');
  });

  it('classifies every appointment of a list with the same instant', () => {
    const ended = createAppointmentRecord({
      endAt: new Date(NOW.getTime() - 60_000),
    });
    const upcoming = createAppointmentRecord();

    expect(
      mapper
        .toResponseList([ended, upcoming], MENTOR_ID, NOW)
        .map((row) => row.status),
    ).toEqual(['COMPLETED', 'CONFIRMED']);
  });

  it('adds the meeting url only to the appointment detail', () => {
    const record = createAppointmentRecord({
      meetingUrl: 'https://meet.jit.si/umssy-stored',
    });
    const meetingUrl = 'https://meet.jit.si/umssy-shared';

    expect(
      mapper.toDetailResponse(record, STUDENT_ID, meetingUrl, NOW),
    ).toEqual({
      ...mapper.toResponse(record, STUDENT_ID, NOW),
      meetingUrl,
    });
    expect(mapper.toResponse(record, STUDENT_ID, NOW)).not.toHaveProperty(
      'meetingUrl',
    );
  });

  it('returns a null meeting url when it must not be shared', () => {
    expect(
      mapper.toDetailResponse(createAppointmentRecord(), MENTOR_ID, null, NOW)
        .meetingUrl,
    ).toBeNull();
  });
});
